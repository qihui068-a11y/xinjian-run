/* 信笺 · 视图：鸽屋（会话列表）/ 会话页（消息 / 媒体面板）

   媒体面板的四个入口（相册 / 拍摄 / 位置 / 文件）回调在 data.js 的 ChatSink。 */
'use strict';



  /* ================= 视图：鸽屋（二级） ================= */
  VIEWS.pigeon = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">鸽屋</div>' +
      '<button class="icon-btn" data-act="new">' + svg('plus') + '</button></div>' +
      '<div class="scroll" id="pgList"><section class="lan-panel"></section><div class="pg-sessions"></div></div>';
    var lanPanel = el.querySelector('.lan-panel');
    var sessionList = el.querySelector('.pg-sessions');

    function render() {
      var on = Lan.running();
      var nearby = Lan.peers();
      lanPanel.hidden = !Lan.available;
      var lanHtml = '<div class="lan-head"><strong>局域网聊天</strong>' +
        '<button type="button" class="lan-action" data-act="lan-toggle">' + (on ? '关闭' : '开启') + '</button></div>';
      if (on) {
        lanHtml += '<p>' + (nearby.length ? '附近设备' : '正在查找同一局域网的设备…') +
          ' · 本机 ' + esc(Lan.id()) + '</p>';
        lanHtml += nearby.map(function (device) {
          return '<button type="button" class="lan-peer" data-peer="' + esc(device.id) + '">' +
            '<span>' + esc(device.name || device.id) + '</span><small>' + esc(device.id) + '</small></button>';
        }).join('');
      }
      if (lanPanel.innerHTML !== lanHtml) {
        var focused = lanPanel.contains(document.activeElement) && document.activeElement;
        var selected = focused && focused.dataset.peer;
        lanPanel.innerHTML = lanHtml;
        if (focused) {
          var next = selected && lanPanel.querySelector('[data-peer="' + selected + '"]');
          (next || lanPanel.querySelector('[data-act="lan-toggle"]')).focus();
        }
      }

      var list = Pigeon.list(), body = '';
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        var last = s.msgs.length ? s.msgs[s.msgs.length - 1].text : '';
        body += '<button type="button" class="pg-item" data-sid="' + esc(s.id) + '">' +
          '<span class="pg-av">' + esc(String(s.name || '?').slice(0, 1)) + '</span>' +
          '<span class="pg-main"><span class="pg-top">' +
          '<span class="pg-name">' + esc(s.name) + '</span>' +
          '<span class="pg-time">' + fmtTime(s.mtime) + '</span></span>' +
          '<span class="pg-last">' + (s.peer ? '局域网 · ' : '') + esc(last || '还没有消息') + '</span></span></button>';
      }
      if (!body) body = '<div class="empty"><p>还没有通信</p><button data-act="new">添加好友</button></div>';
      if (sessionList.innerHTML !== body) sessionList.innerHTML = body;
    }

    render();
    el.__cleanup = Lan.observe(render);

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=lan-toggle]')) return Lan.toggle();
      var peerButton = e.target.closest('[data-peer]');
      if (peerButton) {
        var peer = Lan.peer(peerButton.dataset.peer);
        if (peer) Nav.go('chat', { sid: Pigeon.openLan(peer.id, peer.name).id });
        return;
      }
      if (e.target.closest('[data-act=new]')) {
        var btn = e.target.closest('[data-act=new]');
        popover([
          { ico: 'users', label: '发起群聊', value: 'group' },
          { ico: 'userPlus', label: '添加朋友', value: 'add' },
          { ico: 'scan', label: '扫一扫', value: 'scan' },
          'sep',
          { ico: 'pay', label: '收付款', value: 'pay' }
        ], btn).then(function (v) {
          if (!v) return;
          if (v === 'add') {
            /* 输入框会自动 focus，真机上就会唤起输入法 */
            inputBox('添加朋友', '', '输入点什么').then(function (name) {
              if (name === null || name === '') return;
              var s = Pigeon.create(name.slice(0, 20));
              Nav.go('chat', { sid: s.id });
            });
            return;
          }
          if (v === 'group') {
            return Nav.go('stub', { title: '发起群聊', text: '群聊还没想清楚，先不开放。' });
          }
          if (v === 'scan') {
            return Nav.go('stub', { title: '扫一扫', text: '想和我一起挑战微信霸权吗？想着吧~' });
          }
          if (v === 'pay') {
            return Nav.go('stub', { title: '收付款', text: '暂未开始发展此业务哦~' });
          }
        });
        return;
      }
      var it = e.target.closest('.pg-item');
      if (it) Nav.go('chat', { sid: it.dataset.sid });
    });
  };


  /* ================= 视图：会话（三级） ================= */
  /* + 面板里的四项。收藏 / 音乐 / 个人名片按需求删掉了。 */
  var CHAT_ACTS = [
    { key: 'album', ico: 'image', label: '相册' },
    { key: 'camera', ico: 'camera', label: '拍摄' },
    { key: 'location', ico: 'pin', label: '位置' },
    { key: 'file', ico: 'folder', label: '文件' }
  ];


  VIEWS.chat = function (el, p) {
    var s = Pigeon.get(p && p.sid);
    if (!s) { Nav.back(false); return; }
    var lanChat = !!s.peer;

    var acts = '';
    for (var k = 0; !lanChat && k < CHAT_ACTS.length; k++) {
      var a = CHAT_ACTS[k];
      acts += '<div class="chat-act" data-chat="' + a.key + '">' +
        '<span class="chat-act-ico">' + svg(a.ico) + '</span>' +
        '<span>' + esc(a.label) + '</span></div>';
    }

    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">' + esc(s.name) + '</div>' +
      '<div class="t-gap"></div></div>' +
      '<div class="chat-wrap">' +
      '<div class="chat-list" id="chatList"></div>' +
      '<div class="chat-tip" id="chatTip"></div>' +
      '<div class="chat-bar">' +
      '<input type="text" id="chatIpt" placeholder="写点什么" autocomplete="off">' +
      '<button class="chat-send plus" data-act="send" id="sendBtn">+</button>' +
      '</div>' +
      '<div class="chat-panel" id="chatPanel" hidden>' + acts + '</div>' +
      '</div>';

    var listEl = el.querySelector('#chatList');
    var tipEl = el.querySelector('#chatTip');
    var ipt = el.querySelector('#chatIpt');
    var sendBtn = el.querySelector('#sendBtn');
    var panelEl = el.querySelector('#chatPanel');

    var panelOpen = false, panelLayer = null;

    /* 输入框空着 → 显示 +；有字 → 显示 发送 */
    function paintSend() {
      var has = ipt.value.trim() !== '';
      sendBtn.textContent = has || lanChat ? '发送' : '+';
      sendBtn.classList.toggle('plus', !has && !lanChat);
      sendBtn.disabled = lanChat && !has;
    }

    function togglePanel(open) {
      var v = (open === undefined) ? !panelOpen : !!open;
      if (v === panelOpen) return;
      panelOpen = v;
      panelEl.hidden = !v;
      sendBtn.classList.toggle('on', v);
      if (v) {
        /* 面板占返回键一层：按返回先收面板，不退出会话 */
        panelLayer = Back.open(function () {
          panelOpen = false;
          panelEl.hidden = true;
          sendBtn.classList.remove('on');
          panelLayer = null;
        });
        /* 真机上把键盘收起来，面板才看得全 */
        if (document.activeElement === ipt) ipt.blur();
      } else if (panelLayer) {
        Back.done(panelLayer);
        panelLayer = null;
      }
    }
    var stopObserving = lanChat ? Lan.observe(render) : null;
    el.__cleanup = function () {
      if (stopObserving) stopObserving();
      if (panelLayer) { Back.done(panelLayer); panelLayer = null; }
      ChatSink = null;
      window.__xjPerm = null;
    };

    /* 一条消息的正文。老数据没有 kind，一律当文字处理。 */
    function bodyOf(m) {
      var kind = m.kind || 'text';
      if (kind === 'image') {
        return '<div class="bubble media"><img class="msg-img" src="/media/' +
          encodeURIComponent(m.name || '') + '" alt="">';
      }
      if (kind === 'file') {
        return '<div class="bubble media"><div class="msg-file">' + svg('folder') +
          '<span class="msg-file-name">' + esc(m.name || '文件') + '</span>' +
          '<span class="msg-file-size">' + esc(fmtSize(m.size)) + '</span></div>';
      }
      if (kind === 'loc') {
        return '<div class="bubble media"><div class="msg-loc">' + svg('pin') +
          '<span>' + esc(locText(m)) + '</span></div>';
      }
      return '<div class="bubble">' + esc(m.text) +
        (m.dir === 'out' ? '<div class="msg-st">' + deliveryText(m) + '</div>' : '') + '</div>';
    }

    function deliveryText(message) {
      if (!lanChat) return '本机 · 未送达';
      if (message.delivery === 'delivered') return '已送达';
      return Lan.pending(message.mid) ? '发送中…' : '未送达';
    }

    function render() {
      var cur = Pigeon.get(s.id);
      if (!cur) return;
      var h = '', i;
      for (i = 0; i < cur.msgs.length; i++) {
        var m = cur.msgs[i];
        var out = m.dir === 'out';
        var body = bodyOf(m);
        /* 非文字消息：气泡要无条件闭合；「未送达」只在自己的消息上标 */
        if (m.kind && m.kind !== 'text') {
          if (out) body += '<div class="msg-st">本机 · 未送达</div>';
          body += '</div>';
        }
        h += '<div class="msg ' + (out ? 'out' : 'in') + '">' + body + '</div>';
      }
      listEl.innerHTML = h || '<div class="chat-tip">这里还没有消息</div>';
      listEl.scrollTop = listEl.scrollHeight;
      if (!lanChat) {
        tipEl.textContent = s.npc ? 'FUO 是内置占位对象，只会重复一句开场白。' : '消息只保存在本机。';
      } else if (Lan.running()) {
        tipEl.textContent = Lan.peer(s.peer) ? '局域网 · 在线 · 仅文字' : '局域网 · 对方离线';
      } else if (Lan.available) {
        tipEl.innerHTML = '<button type="button" class="lan-action" data-act="lan-toggle">开启局域网</button>';
      } else {
        tipEl.textContent = '局域网聊天需要 Android 应用。';
      }
    }

    function send() {
      var v = ipt.value.trim();
      if (!v) return;
      if (lanChat) {
        ipt.value = '';
        paintSend();
        Lan.send(s, v.slice(0, 2000));
        return;
      }
      togglePanel(false);           /* 发出去就收面板，和微信一致 */
      Pigeon.add(s.id, v.slice(0, 2000), 'out');
      ipt.value = '';
      paintSend();
      render();
      /* 内置 NPC 只会回同一句；延迟一点，让「发出去 → 收到」看得出先后 */
      var cur = Pigeon.get(s.id);
      if (cur && cur.npc) {
        setTimeout(function () {
          Pigeon.add(s.id, Pigeon.line(), 'in');
          render();
        }, 420);
      }
    }

    render();
    paintSend();

    /* ---------- 四个媒体入口 ---------- */
    var pendingCapture = false, pendingLoc = false;

    function permItem(st, key) {
      var items = (st && st.items) || [];
      for (var i = 0; i < items.length; i++) if (items[i].key === key) return items[i];
      return null;
    }
    function grantedOf(st, key) {
      var it = permItem(st, key);
      return !!(it && it.granted);
    }

    /* 发出去之后统一走一遍：落盘、刷新、让 NPC 回一句 */
    function pushMsg(text, extra) {
      togglePanel(false);
      Pigeon.add(s.id, text, 'out', extra);
      render();
      npcReply();
    }
    function npcReply() {
      var cur = Pigeon.get(s.id);
      if (cur && cur.npc) {
        setTimeout(function () {
          Pigeon.add(s.id, Pigeon.line(), 'in');
          render();
        }, 420);
      }
    }

    /* 原生把选好的东西送回来 */
    ChatSink = {
      picked: function (o) {
        if (!o.ok) {
          toast(o.why === 'cancel' ? '已取消'
            : o.why === 'perm' ? '相机权限没给'
            : o.why === 'copy' ? '读取失败' : '打不开选择器');
          return;
        }
        pushMsg(o.name || '', { kind: o.kind === 'image' ? 'image' : 'file', name: o.name, size: o.size });
      },
      located: function (o) {
        if (!o.ok) {
          toast(o.why === 'perm' ? '没有位置权限'
            : o.why === 'timeout' ? '定位超时，换个地方试试'
            : '定位失败');
          return;
        }
        pushMsg('', { kind: 'loc', lat: o.lat, lon: o.lon, acc: o.acc, fine: !!o.fine });
      }
    };

    function doAct(key) {
      if (key === 'album') {
        if (!Bridge.pickImage()) return toast('演示模式没有相册');
        toast('选一张图');
        return;
      }
      if (key === 'file') {
        if (!Bridge.pickFile()) return toast('演示模式没有文件选择器');
        toast('选一个文件');
        return;
      }
      if (key === 'camera') {
        if (!Bridge.can('capture')) return toast('演示模式没有相机');
        Bridge.permStatus().then(function (st) {
          if (grantedOf(st, 'camera')) { Bridge.capture(); return; }
          pendingCapture = true;
          toast('要在系统弹框里允许相机');
          Bridge.askPerm('camera');
        });
        return;
      }
      if (key === 'location') {
        if (!Bridge.can('locate')) return toast('演示模式没有定位');
        Bridge.permStatus().then(function (st) {
          if (grantedOf(st, 'loc') || grantedOf(st, 'locFine')) {
            toast('正在定位…');
            Bridge.locate();
            return;
          }
          pendingLoc = true;
          toast('要在系统弹框里允许位置');
          /* 一次申请同时请求精确和大致，系统会让用户二选一 */
          Bridge.askPerm('locFine');
        });
      }
    }

    /* 权限弹框回调：授权后接着把刚才想做的事做完 */
    window.__xjPerm = function (key, ok) {
      if (key === 'camera') {
        if (pendingCapture) {
          pendingCapture = false;
          if (ok) Bridge.capture(); else toast('没给相机权限');
        }
        return;
      }
      if (key === 'loc' || key === 'locFine') {
        if (!pendingLoc) return;
        pendingLoc = false;
        /* 用户可能只给了「大致」，所以这里重新读一次真实状态 */
        Bridge.permStatus().then(function (st) {
          if (grantedOf(st, 'loc') || grantedOf(st, 'locFine')) {
            toast('正在定位…');
            Bridge.locate();
          } else {
            toast('没给位置权限');
          }
        });
      }
    };

    el.addEventListener('input', function (e) {
      if (e.target === ipt) paintSend();
    });

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=lan-toggle]')) return Lan.toggle();

      if (e.target.closest('[data-act=send]')) {
        /* 按钮是 + 的时候，点它是开合面板 */
        if (!lanChat && ipt.value.trim() === '') { togglePanel(); return; }
        return send();
      }

      var hit = e.target.closest('[data-chat]');
      if (hit) return doAct(hit.dataset.chat);
    });

    ipt.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) send();
    });
  };
