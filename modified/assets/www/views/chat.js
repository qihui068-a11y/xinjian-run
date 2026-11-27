/* 信笺 · 视图：鸽屋（会话列表）/ 会话页（消息 / 媒体面板）

   媒体面板的四个入口（相册 / 拍摄 / 位置 / 文件）回调在 data.js 的 ChatSink。 */
'use strict';



  /* ================= 视图：鸽屋（二级） ================= */
  VIEWS.pigeon = function (el) {
    el.classList.add('pigeon-view');
    el.innerHTML =
      '<header class="workspace-heading"><div><h1 class="t-title">鸽屋</h1><p>和朋友聊聊代码与日常</p></div>' +
      '<div class="workspace-actions"><button type="button" class="icon-btn" data-act="new" aria-label="添加朋友">' +
      svg('plus-square') + '</button><button type="button" class="icon-btn" data-act="more" aria-label="鸽屋选项">' +
      svg('more') + '</button></div></header>' +
      '<div class="scroll workspace-content pg-scroll" id="pgList">' +
      '<div class="workspace-filters"><button type="button" aria-current="page">消息</button>' +
      '<button type="button" data-act="contacts">好友</button></div>' +
      '<label class="workspace-search">' + svg('search') +
      '<input type="search" id="pgSearch" placeholder="搜索会话或消息" aria-label="搜索会话或消息"></label>' +
      '<div class="workspace-shortcuts">' +
      '<button type="button" data-act="lan-toggle" id="pgLan"></button>' +
      '<button type="button" data-act="nearby" id="pgNearby"></button></div>' +
      '<div class="pg-scan" id="pgScan" hidden><div class="pg-scan-list" id="pgScanList"></div></div>' +
      '<button type="button" class="pg-safe" data-act="boundary">仅限可信网络 · 明文传输</button>' +
      '<div class="workspace-section"><h2>最近聊天</h2><button type="button" data-act="requests" id="pgRequests">好友申请</button></div>' +
      '<div class="pg-sessions"></div></div>';
    var sessionList = el.querySelector('.pg-sessions');
    var scanBox = el.querySelector('#pgScan');
    var scanList = el.querySelector('#pgScanList');
    var lanBtn = el.querySelector('#pgLan');
    var nearby = el.querySelector('#pgNearby');
    nearby.innerHTML = '<span class="pg-radar" aria-hidden="true"><span class="pg-waves"></span>' + svg('radar') +
      '</span><span><strong>附近设备</strong><small></small></span>';
    var scanStatus = nearby.querySelector('small'), knownPeers;
    var search = el.querySelector('#pgSearch');
    var requests = el.querySelector('#pgRequests');
    search.addEventListener('input', render);

    /* 两态图标：开着是实心 wifi，关着是带斜线的 wifi */
    function paintLan() {
      var on = Lan.running();
      lanBtn.innerHTML = svg(on ? 'wifi' : 'wifiOff') + '<span><strong>' +
        (on ? '局域网已开启' : '局域网已关闭') + '</strong><small>' +
        (on ? '连接可信网络中的设备' : '点击开启局域网') + '</small></span>';
      lanBtn.classList.toggle('on', on);
    }

    /* 只有真的扫到设备才亮出这张表：局域网开着但空着的时候，整块不存在 */
    function paintScan() {
      var scanning = Lan.running();
      var near = scanning ? Lan.peers() : [];
      nearby.classList.toggle('is-scanning', scanning);
      scanStatus.textContent = near.length ? '发现 ' + near.length + ' 台设备' :
        scanning ? '暂未发现设备' : '开启局域网后查看';
      if (!near.length) {
        scanBox.hidden = true;
        knownPeers = new Set();
        if (scanList.innerHTML !== '') scanList.innerHTML = '';
        return;
      }
      var h = near.map(function (d) {
        return '<button type="button" class="pg-scan-row" data-peer="' + esc(d.id) + '">' +
          '<span class="pg-scan-id">' + esc(Lan.short(d.id)) + '</span>' +
          '<span class="pg-scan-name">' + esc(d.name || '未命名设备') + '</span>' +
        '</button>';
      }).join('');
      scanBox.hidden = false;
      if (scanList.innerHTML !== h) {
        scanList.innerHTML = h;
        scanList.querySelectorAll('.pg-scan-row').forEach(function (row) {
          if (knownPeers && !knownPeers.has(row.dataset.peer)) {
            Motion.play(row, [{ opacity: 0, transform: 'translateY(4px) scale(.985)' },
              { opacity: 1, transform: 'none' }], 210);
          }
        });
      }
      knownPeers = new Set(near.map(function (peer) { return peer.id; }));
    }
    function render() {
      paintLan();
      paintScan();
      var term = search.value.trim().toLowerCase();
      var pending = Pigeon.requestCount();
      requests.textContent = pending ? '好友申请 · ' + pending : '好友申请';
      var list = Pigeon.list(), body = '';
      for (var i = 0; i < list.length; i++) {
        var s = list[i];
        var name = Pigeon.displayName(s.peer, s.name) || '';
        if (term && name.toLowerCase().indexOf(term) < 0 && !s.msgs.some(function (message) {
          return String(message.text || message.name || '').toLowerCase().indexOf(term) >= 0;
        })) continue;
        var tail = s.msgs.length ? s.msgs[s.msgs.length - 1] : null;
        var last = '';
        if (tail) last = tail.kind === 'image' ? '[图片]' : (tail.text || '');
        var mark = '';
        if (s.peer) {
          if (s.terminated) mark = '<span class="pg-mark">已终止</span>';
          else if (Pigeon.blocked(s.peer)) mark = '<span class="pg-mark">已屏蔽</span>';
          else if (s.waiting) mark = '<span class="pg-mark">验证中</span>';
          else if (Pigeon.muted(s.peer)) mark = '<span class="pg-mark">免打扰</span>';
        }
        body += '<button type="button" class="pg-item" data-sid="' + esc(s.id) + '">' +
          '<span class="pg-av">' + esc(String(Pigeon.displayName(s.peer, s.name) || '?').slice(0, 1)) + '</span>' +
          '<span class="pg-main"><span class="pg-top">' +
          '<span class="pg-name">' + esc(Pigeon.displayName(s.peer, s.name)) + '</span>' + mark +
          '<span class="pg-time">' + fmtTime(s.mtime) + '</span></span>' +
          '<span class="pg-last">' + (s.peer ? '局域网 · ' : s.npc ? '内置助手 · ' : '') + esc(last || '还没有消息') + '</span></span></button>';
      }
      if (!body) body = '<div class="empty"><p>' + (term ? '未找到会话' : '还没有通信') + '</p>' +
        (term ? '' : '<button data-act="contacts">打开通讯录</button>') + '</div>';
      if (sessionList.innerHTML !== body) sessionList.innerHTML = body;
    }

    render();
    el.__cleanup = Lan.observe(render);

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=requests]')) return Nav.go('requests');
      if (e.target.closest('[data-act=nearby]')) {
        if (!Lan.running()) return Lan.toggle();
        if (scanBox.hidden) return toast('暂未发现附近设备');
        return scanBox.scrollIntoView({ block: 'nearest' });
      }
      if (e.target.closest('[data-act=more]')) {
        return popover([
          { ico: 'contacts', label: '通讯录', value: 'contacts' },
          { ico: 'info', label: '局域网使用说明', value: 'about' }
        ], e.target.closest('[data-act=more]')).then(function (name) { if (name) Nav.go(name); });
      }
      if (e.target.closest('[data-act=lan-toggle]')) return Lan.toggle();
      if (e.target.closest('[data-act=contacts]')) return Nav.go('contacts');
      if (e.target.closest('[data-act=boundary]')) return Nav.go('about');
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


  /* ================= 视图：通讯录（三级） =================
     顶部一条「验证消息」常驻（等同微信的「新的朋友」），下面是联系人。
     每一行右滑露出 聊天 / 屏蔽 / 删除，点行本身直接进会话。 */
  VIEWS.contacts = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">通讯录</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="ct-list" id="ctList"></div></div>';
    var listEl = el.querySelector('#ctList');
    var openRow = null, draggedAt = 0;

    function closeRow() {
      if (!openRow) return;
      openRow.classList.remove('open');
      openRow = null;
    }

    function subOf(f) {
      if (f.blocked) return '已屏蔽';
      if (Pigeon.terminated(f.id)) return '对方已终止通讯';
      return Lan.peer(f.id) ? '在线' : '离线';
    }

    function render() {
      var waiting = Pigeon.requestCount();
      var h = '<button type="button" class="ct-entry" data-act="requests">' +
        '<span class="ct-entry-ico">' + svg('userPlus') + '</span>' +
        '<span class="ct-entry-main">验证消息</span>' +
        (waiting ? '<span class="ct-badge">' + (waiting > 99 ? '99+' : waiting) + '</span>' : '') +
        '<span class="ct-arrow">' + svg('chevron') + '</span></button>';
      var fs = Pigeon.friends();
      if (fs.length) h += '<div class="ct-section">联系人</div>';
      if (!fs.length) {
        h += '<div class="ct-empty">还没有联系人<br><small>在鸽屋打开局域网，聊过一句就算认识</small></div>';
      } else {
        h += '<div class="ct-group">' + fs.map(function (f) {
          var name = f.alias || f.name || f.id;
          return '<div class="ct-row" data-peer="' + esc(f.id) + '">' +
            '<div class="ct-actions">' +
            '<button type="button" data-do="chat">' + svg('bird') + '<span>聊天</span></button>' +
            '<button type="button" data-do="block">' + svg('lock') + '<span>' + (f.blocked ? '解除' : '屏蔽') + '</span></button>' +
            '<button type="button" data-do="delete" class="danger">' + svg('trash') + '<span>删除</span></button>' +
            '</div>' +
            '<button type="button" class="ct-face">' +
            '<span class="ct-av">' + esc(String(name).slice(0, 1)) + '</span>' +
            '<span class="ct-main"><span class="ct-name">' + esc(name) + '</span>' +
            '<span class="ct-sub">' + esc(subOf(f)) + '</span></span>' +
            '<span class="ct-dot' + (Lan.peer(f.id) && !f.blocked ? ' on' : '') + '"></span>' +
            '</button></div>';
        }).join('') + '</div>';
      }
      listEl.innerHTML = h;
    }

    render();
    el.__cleanup = Lan.observe(function () {
      closeRow();
      render();
    });

    /* 拖动：只有横向负向位移超过 40px 才展开，避免和上下滚动打架 */
    listEl.addEventListener('pointerdown', function (e) {
      var face = e.target.closest('.ct-face');
      if (!face) return;
      var row = face.parentNode;
      var startX = e.clientX, startY = e.clientY, dx = 0, moved = false;
      function move(ev) {
        dx = ev.clientX - startX;
        if (Math.abs(dx) > Math.abs(ev.clientY - startY) && dx < 0) {
          moved = true;
          face.style.transition = 'none';
          face.style.transform = 'translateX(' + Math.max(dx, -168) + 'px)';
        }
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        face.style.transition = '';
        face.style.transform = '';
        if (moved) {
          draggedAt = Date.now();
          if (dx < -40) {
            closeRow();
            row.classList.add('open');
            openRow = row;
          } else {
            closeRow();
          }
        }
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=requests]')) return Nav.go('requests');
      var act = e.target.closest('[data-do]');
      if (act) {
        var row = act.closest('.ct-row');
        var peer = row && row.dataset.peer;
        var f = peer && Pigeon.friend(peer);
        if (!f) return;
        closeRow();
        if (act.dataset.do === 'chat') return Nav.go('chat', { sid: Pigeon.openLan(f.id, f.name).id });
        if (act.dataset.do === 'block') {
          Pigeon.setBlocked(f.id, !f.blocked);
          toast(f.blocked ? '已解除屏蔽' : '已屏蔽，对方的消息不会再进来');
          return render();
        }
        var label = f.alias || f.name || f.id;
        var rowEl = act.closest('.ct-row');
        confirmBox('删除「' + label + '」和聊天记录？', '删除').then(function (ok) {
          if (!ok) return;
          var animOn = typeof Anim !== 'undefined' && Anim.enabled();
          function finish() {
            if (Lan.running()) Lan.dropContact(f.id);
            else Pigeon.deleteFriend(f.id);
            toast('已删除');
            render();
          }
          /* 规范第 12 条：先失焦 200ms，再塌陷 260ms，最后才从列表移除 */
          if (animOn && rowEl) {
            rowEl.classList.add('leaving');
            setTimeout(finish, 460);
          } else {
            finish();
          }
        });
        return;
      }
      var face = e.target.closest('.ct-face');
      if (face) {
        if (Date.now() - draggedAt < 300) return;
        if (openRow) return closeRow();
        var pid = face.parentNode.dataset.peer;
        if (pid) Nav.go('chat', { sid: Pigeon.openLan(pid, (Pigeon.friend(pid) || {}).name || pid).id });
      }
    });
  };


  /* ================= 视图：验证消息（四级） ================= */
  VIEWS.requests = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">验证消息</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="req-list" id="reqList"></div></div>';
    var listEl = el.querySelector('#reqList');

    function render() {
      var list = Pigeon.requests(), h = '';
      if (!list.length) {
        h = '<div class="empty"><p>没有新的验证消息</p></div>';
      } else {
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          var name = r.nick || r.peer;
          h += '<div class="req-item" data-peer="' + esc(r.peer) + '">' +
            '<span class="ct-av">' + esc(String(name).slice(0, 1)) + '</span>' +
            '<div class="req-main"><div class="req-name">' + esc(name) + '</div>' +
            '<div class="req-text">' + esc(r.text || '') + (r.n > 1 ? '（共 ' + r.n + ' 条）' : '') + '</div></div>' +
            '<div class="req-acts">' +
            '<button type="button" class="cv-btn ok" data-req="accept">同意</button>' +
            '<button type="button" class="cv-btn" data-req="ignore">忽略</button>' +
            '</div></div>';
        }
      }
      listEl.innerHTML = h;
    }

    Pigeon.readRequests();
    render();

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      var btn = e.target.closest('[data-req]');
      if (!btn) return;
      var item = btn.closest('.req-item');
      var peer = item && item.dataset.peer;
      if (!peer) return;
      if (btn.dataset.req === 'accept') {
          Pigeon.acceptRequest(peer);
        if (Lan.running()) Lan.accept(peer);
        /* 全站唯一一处 Lottie：验证通过的高光；关动效时自动不播 */
        if (typeof Motion !== 'undefined') Motion.verify();
        toast('已添加');
        render();
      } else {
        Pigeon.dropRequest(peer);
        toast('已忽略');
        render();
      }
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
    el.classList.add('chat-view');

    var acts = '';
    for (var k = 0; !lanChat && k < CHAT_ACTS.length; k++) {
      var a = CHAT_ACTS[k];
      acts += '<div class="chat-act" data-chat="' + a.key + '">' +
        '<span class="chat-act-ico">' + svg(a.ico) + '</span>' +
        '<span>' + esc(a.label) + '</span></div>';
    }

    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">' + esc(Pigeon.displayName(s.peer, s.name)) + '</div>' +
      (lanChat ? '<button class="icon-btn" data-act="cset" aria-label="会话设置">' + svg('menu') + '</button>'
               : '<div class="t-gap"></div>') + '</div>' +
      '<div class="chat-wrap">' +
      '<div class="chat-list" id="chatList"></div>' +
      '<div class="chat-tip" id="chatTip"></div>' +
      '<div class="chat-bar">' +
      (lanChat && Lan.canSendImage() ? '<button class="chat-attach" type="button" data-act="attach" aria-label="发送图片">' + svg('image') + '</button>' : '') +
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
      sendBtn.innerHTML = has || lanChat
        ? svg('send') + '<span class="send-label">发送</span>' : '+';
      sendBtn.setAttribute('aria-label', has || lanChat ? '发送消息' : '附件');
      sendBtn.classList.toggle('ready', has && !ipt.disabled);
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
      return '<div class="bubble">' + esc(m.text);
    }

    function failedDelivery(message) {
      if (!lanChat || message.dir !== 'out' || !message.mid) return '';
      if (message.delivery !== 'failed' && (message.delivery || Lan.pending(message.mid))) return '';
      return '<div class="msg-st"><button type="button" data-retry="' + esc(message.mid) +
        '" aria-label="未送达，重发">' + svg('redo') + '重发</button></div>';
    }

    function transferState(message) {
      if (!lanChat || message.dir !== 'out' || !message.mid || !/^(image|file)$/.test(message.kind)) return '';
      if (message.delivery === 'pending' && Lan.pending(message.mid)) {
        return '<span class="msg-transfer is-busy" role="status" aria-label="正在发送"></span>';
      }
      if (message.delivery === 'delivered') {
        return '<span class="msg-transfer is-delivered" role="img" aria-label="已送达">' + svg('check') + '</span>';
      }
      return '';
    }

    /* 对方终止通讯后只弹一次三选一：删除 / 备份后删除 / 保留 */
    var termShown = false;
    function termCheck(cur) {
      if (!cur.terminated || cur.termAck || termShown) return;
      termShown = true;
      sheet('对方已终止通讯', [
        { label: '删除通讯', value: 'delete', danger: true },
        { label: '备份通讯后删除', value: 'backup' },
        'sep',
        { label: '保留', value: 'keep' }
      ]).then(function (v) {
        if (v === 'delete') { Pigeon.deleteFriend(s.peer); Nav.back(false); return; }
        if (v === 'backup') { backupChat(); Pigeon.deleteFriend(s.peer); Nav.back(false); return; }
        /* 选「保留」也要落一个「已确认」，否则每次进来都再弹一遍 */
        Pigeon.ackTerminate(s.peer);
        render();
      });
    }

    function backupChat() {
      var name = Pigeon.displayName(s.peer, s.name);
      var text = Pigeon.chatText(s.peer, name);
      var d = new Date();
      var stamp = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      Bridge.exportOne('鸽屋-' + name + '-' + stamp + '.txt', text).then(function (ok) {
        toast(ok === false ? '备份失败' : '已导出到 下载/信笺/');
      }, function () { toast('备份失败'); });
    }

    var seenMessages = new WeakSet(), deliveryStates = new WeakMap(), chatMarkup = null;
    function render() {
      var cur = Pigeon.get(s.id);
      if (!cur) return;
      var h = '', previous, groupStart;
      for (var i = 0; i < cur.msgs.length; i++) {
        var m = cur.msgs[i];
        var grouped = previous && previous.dir === m.dir && Number.isFinite(m.t) &&
          Number.isFinite(groupStart) && m.t >= groupStart && m.t - groupStart < 300000;
        if (!grouped) {
          groupStart = m.t;
          if (Number.isFinite(m.t)) h += '<div class="msg-time">' + esc(fmtTime(m.t)) + '</div>';
        }
        h += '<div class="msg ' + (m.dir === 'out' ? 'out' : 'in') +
          (grouped ? ' is-continuation' : '') + '">' + bodyOf(m) + failedDelivery(m) + transferState(m) + '</div></div>';
        previous = m;
      }
      if (h !== chatMarkup) {
        listEl.innerHTML = h || '<div class="chat-tip">这里还没有消息</div>';
        listEl.querySelectorAll('.msg').forEach(function (row, i) {
          var message = cur.msgs[i];
          if (chatMarkup !== null && !seenMessages.has(message)) {
            var sent = message.dir === 'out';
            Motion.play(row, sent ? [{ opacity: 0, transform: 'translateY(10px) scale(.96)' },
              { opacity: 1, transform: 'none' }] : [{ opacity: .3 }, { opacity: 1 }], sent ? 230 : 180);
          } else if (seenMessages.has(message) && deliveryStates.get(message) !== message.delivery) {
            Motion.play(row.querySelector('.msg-transfer, [data-retry]'),
              [{ opacity: .3, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], 200);
          }
          seenMessages.add(message);
          deliveryStates.set(message, message.delivery);
        });
        chatMarkup = h;
        listEl.scrollTop = listEl.scrollHeight;
      }
      if (!lanChat) {
        tipEl.textContent = s.npc ? 'FUO 是内置占位对象，只会重复一句开场白。' : '消息只保存在本机。';
      } else if (cur.terminated) {
        tipEl.textContent = '对方已终止通讯';
        termCheck(cur);
      } else if (!Pigeon.friend(s.peer)) {
        tipEl.textContent = '验证消息已发出，等对方回复';
      } else if (Pigeon.blocked(s.peer)) {
        tipEl.innerHTML = '已屏蔽 · <button type="button" class="lan-action" data-act="unblock">解除</button>';
      } else if (Lan.running()) {
        tipEl.textContent = Lan.peer(s.peer) ? '局域网 · 在线' : '局域网 · 对方离线';
      } else if (Lan.available) {
        tipEl.innerHTML = '<button type="button" class="lan-action" data-act="lan-toggle">开启局域网</button>';
      } else {
        tipEl.textContent = '局域网聊天需要 Android 应用。';
      }
      paintLock();
    }

    /* 验证没结束时把输入锁住：按钮之外，回车/粘贴也进不来 */
    function paintLock() {
      var gate = lanChat ? Pigeon.canSend(s.id) : { ok: true };
      var locked = !gate.ok;
      ipt.disabled = locked;
      ipt.placeholder = !locked ? '写点什么'
        : (gate.why === 'terminated' ? '对方已终止通讯' : '等对方回复后才能继续聊');
      if (locked) sendBtn.disabled = true;
    }

    function send() {
      var v = ipt.value.trim();
      if (!v) return;
      if (lanChat) {
        /* 主动加的人，对方回第一句之前只准发一条（0.4 的 invite 规则） */
        if (!Pigeon.canSend(s.id).ok) { toast('等对方回复后才能继续发'); return; }
        var live = Pigeon.get(s.id);
        /* 回复陌生人的第一句就是同意：先把好友关系补上，这一条才不算「验证消息」 */
        if (live && live.pending) Pigeon.addFriend(s.peer, s.name);
        ipt.value = '';
        paintSend();
        if (!Pigeon.friend(s.peer)) Pigeon.markWaiting(s.peer);
        Lan.send(s, v.slice(0, 2000));
        render();
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
        /* 局域网只认图片：文件/位置走不了 v2 协议，先说清楚 */
        if (lanChat) {
          if (o.kind !== 'image') return toast('鸽屋现在只能发图片');
          if (Lan.shareImage(s, o.name)) toast('正在发送');
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
      if (e.target === ipt) { paintSend(); paintLock(); }
    });

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=lan-toggle]')) return Lan.toggle();

      if (e.target.closest('[data-act=cset]')) return Nav.go('cset', { sid: s.id });
      if (e.target.closest('[data-act=unblock]')) {
        Pigeon.setBlocked(s.peer, false);
        toast('已解除屏蔽');
        render();
        return;
      }

      var retryBtn = e.target.closest('[data-retry]');
      if (retryBtn) {
        var cur = Pigeon.get(s.id);
        var lost = null;
        if (cur) {
          for (var mi = 0; mi < cur.msgs.length; mi++) {
            if (cur.msgs[mi].mid === retryBtn.dataset.retry) { lost = cur.msgs[mi]; break; }
          }
        }
        if (lost) Lan.retry(s, lost);
        return;
      }
      if (e.target.closest('[data-act=attach]')) {
        sheet('发送图片', [
          { label: '相册', value: 'album' },
          { label: '拍摄', value: 'camera' }
        ]).then(function (v) {
          if (v === 'album') Bridge.pickImage();
          else if (v === 'camera') Bridge.capture();
        });
        return;
      }
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

  /* ================= 视图：会话设置（四级） =================
     从会话页右上角三条杠进来。只放和这个会话有关的东西，
     全局设置在小家 → 设置，别混进来。 */
  VIEWS.cset = function (el, p) {
    var sid = p && p.sid;
    var s = Pigeon.get(sid);
    if (!s || !s.peer) { Nav.back(false); return; }
    var peer = s.peer;

    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">会话设置</div><div class="t-gap"></div></div>' +
      '<div class="scroll set-body"><div class="rows" id="csList"></div>' +
      '<div class="set-note">设备 ' + esc(peer) + '</div>' +
      '<div class="set-note">蓝牙和 p2p 还没做，先占位。</div></div>';

    var listEl = el.querySelector('#csList');

    function paint() {
      var f = Pigeon.friend(peer) || {};
      listEl.innerHTML =
        rowHtml('note', null, '备注', f.alias || '未设置') +
        rowHtml('mute', null, '消息免打扰', f.muted ? '已开启' : '未开启') +
        rowHtml('bt', null, '切换蓝牙通讯', '未实现') +
        rowHtml('p2p', null, 'p2p 通讯', '未实现') +
        rowHtml('del', 'trash', '终结通讯', '');
    }
    paint();

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      var row = e.target.closest('.row');
      if (!row) return;
      var act = row.dataset.act;

      if (act === 'note') {
        var f0 = Pigeon.friend(peer) || {};
        inputBox('备注', f0.alias || '', '最多 20 个字').then(function (v) {
          /* 取消是 null；清空输入框是空串，要当成「删掉备注」 */
          if (v === null || v === undefined || v === false) return;
          Pigeon.patchFriend(peer, { alias: String(v).slice(0, 20) });
          paint();
          toast(v ? '备注已保存' : '备注已清空');
        });
        return;
      }

      if (act === 'mute') {
        var f1 = Pigeon.friend(peer) || {};
        Pigeon.patchFriend(peer, { muted: !f1.muted });
        paint();
        toast(f1.muted ? '已取消免打扰' : '已开启免打扰');
        return;
      }

      if (act === 'bt') return toast('局域网和蓝牙的切换还没做');
      if (act === 'p2p') return toast('p2p 直连还没做，排在蓝牙之后');

      if (act === 'del') {
        var nm = Pigeon.displayName(peer, s.name);
        confirmBox('终结通讯「' + nm + '」？这个会话和里面的消息都会一起删掉。', '删除')
          .then(function (ok) {
            if (!ok) return;
            /* 先告诉对方再删本地；对方收到会弹「已终止通讯」三选一 */
            if (Lan.running()) Lan.dropContact(peer);
            else Pigeon.deleteFriend(peer);
            toast('已删除');
            Nav.reset('pigeon');
          });
      }
    });
  };
