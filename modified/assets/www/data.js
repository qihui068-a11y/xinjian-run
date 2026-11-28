/* 信笺 · 数据层（Profile 个人信息 / Pigeon 鸽屋 / 时间与大小格式化 / 批量导出）

   必须在所有视图之前加载：书架、小家、会话页都要用 fmtTime / locText / Pigeon。
   这里没有 DOM 依赖，只碰 localStorage 和 Bridge。 */

'use strict';



  /* ================= 个人资料 ================= */
  var Profile = (function () {
    var KEY = 'xj:profile';
    var d = { nick: '', sid: '', cover: 0 };
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var o = JSON.parse(raw);
        for (var k in o) if (o.hasOwnProperty(k)) d[k] = o[k];
      }
    } catch (e) {}
    if (!d.sid) d.sid = 'xj-' + String(Math.floor(Math.random() * 9000) + 1000);
    function save() { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
    save();
    return {
      get: function () { return d; },
      set: function (k, v) { d[k] = v; save(); }
    };
  })();


  /* ================= 鸽屋数据（会话 / 好友 / 验证） ==================
     会话（sessions）是聊天窗口，好友（friends）是通讯录里的联系人，键都是对方的 xj-id。
     两者分开存：删好友要连会话一起删，但对方离线不该让聊天记录消失。
     friends 是 v2 新增；老数据没有这个字段，load() 里补一个空表，不迁移旧消息。 */
  var Pigeon = (function () {
    var KEY = 'xj:pigeon:v1';
    var db = null;
    /* 内置占位 NPC：本地对象，不联网。只会重复一句开场白。 */
    var NPC_LINE = '你好，我是FUO。';

    function load() {
      if (db) return db;
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) db = JSON.parse(raw);
      } catch (e) { db = null; }
      if (!db || !db.sessions) db = { order: [], sessions: {} };
      if (!db.order) db.order = [];
      if (!db.friends || typeof db.friends !== 'object') db.friends = {};
      if (!db.requests || typeof db.requests !== 'object') db.requests = {};
      db.v = 2;
      if (!db.sessions.fuo) {
        db.sessions.fuo = {
          id: 'fuo', name: 'FUO', npc: true, mtime: Date.now(),
          msgs: [{ text: NPC_LINE, dir: 'in', t: Date.now() }]
        };
        db.order.unshift('fuo');
        save();
      }
      return db;
    }
    /* 写不进去时不能装作没事：界面照常显示、重启全没，是最坏的一种「成功」 */
    var saveWarned = false;
    function save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(db));
      } catch (e) {
        if (saveWarned) return;
        saveWarned = true;
        try { toast('存储空间不足，新的聊天记录可能保存不下来'); } catch (x) {}
      }
    }

    function friendOf(peer) { return load().friends[peer] || null; }

    return {
      list: function () {
        var d = load(), out = [];
        for (var i = 0; i < d.order.length; i++) {
          if (d.sessions[d.order[i]]) out.push(d.sessions[d.order[i]]);
        }
        return out;
      },
      get: function (id) { return load().sessions[id] || null; },
      line: function () { return NPC_LINE; },
      create: function (name) {
        var d = load();
        var id = 's' + Date.now().toString(36);
        d.sessions[id] = { id: id, name: name, msgs: [], mtime: Date.now() };
        d.order.unshift(id);
        save();
        return d.sessions[id];
      },
      openLan: function (peer, name) {
        var d = load();
        var id = 'lan-' + peer;
        if (!d.sessions[id]) {
          d.sessions[id] = {
            id: id, peer: peer, name: name || peer, msgs: [], mtime: Date.now(),
            pending: false, waiting: false, ignored: false
          };
          d.order.unshift(id);
          save();
        } else if (name && !d.sessions[id].name) {
          d.sessions[id].name = name;
          save();
        }
        return d.sessions[id];
      },
      /* extra 用来带图片/文件/位置这些附加信息（kind、name、size、lat、lon…） */
      add: function (id, text, dir, extra) {
        var d = load(), s = d.sessions[id];
        if (!s) return null;
        var m = { text: text, dir: dir || 'out', t: Date.now() };
        if (extra) { for (var k in extra) if (extra.hasOwnProperty(k)) m[k] = extra[k]; }
        s.msgs.push(m);
        s.mtime = m.t;
        save();
        return m;
      },
      /* 收到文字。不是好友 = 验证请求，进通讯录那条「验证消息」，不建会话。 */
      receiveLan: function (peer, name, mid, text) {
        var d = load();
        var f = d.friends[peer];
        if (f && f.blocked) return false;
        var s = d.sessions['lan-' + peer];
        if (s && s.ignored) return false;
        /* 我发过验证、对方回了话 = 同意，直接转正 */
        if (!f && s && s.waiting) { this.addFriend(peer, name); f = d.friends[peer]; }
        if (!f) { this.addRequest(peer, name, text); return true; }
        if (!s) s = this.openLan(peer, name);
        if (!s.msgs.some(function (m) { return m.dir === 'in' && m.mid === mid; })) {
          this.add(s.id, text, 'in', { mid: mid });
        }
        save();
        return true;
      },
      /* 收到的图：原生已经写进 media/，这里只记文件名和尺寸 */
      receiveImage: function (peer, name, mid, fileName, w, h, size) {
        var d = load();
        var f = d.friends[peer];
        if (f && f.blocked) return false;
        var s = d.sessions['lan-' + peer];
        if (s && s.ignored) return false;
        if (!f && s && s.waiting) { this.addFriend(peer, name); f = d.friends[peer]; }
        if (!f) { this.addRequest(peer, name, '[图片]'); return true; }
        if (!s) s = this.openLan(peer, name);
        if (!s.msgs.some(function (m) { return m.dir === 'in' && m.mid === mid; })) {
          this.add(s.id, '', 'in', { kind: 'image', name: fileName, mid: mid, w: w, h: h, size: size });
        }
        save();
        return true;
      },
      delivery: function (id, mid, ok) {
        var s = this.get(id);
        if (!s) return;
        var message = s.msgs.find(function (m) { return m.dir === 'out' && m.mid === mid; });
        if (!message) return;
        message.delivery = ok === true ? 'delivered' : ok === false ? 'failed' : 'pending';
        save();
      },
      remove: function (id) {
        var d = load(), o = [];
        delete d.sessions[id];
        for (var i = 0; i < d.order.length; i++) if (d.order[i] !== id) o.push(d.order[i]);
        d.order = o;
        save();
      },

      /* ---------------- 验证请求 ----------------
         陌生人发来的消息不建会话，先记在这里；同意之后才建会话并把那条消息搬进去。
         结构：{ peer, nick, text, t, n, unread }，n 是收到几条，unread 是没看过的。 */
      requests: function () {
        var d = load(), out = [];
        for (var k in d.requests) if (d.requests.hasOwnProperty(k)) out.push(d.requests[k]);
        out.sort(function (a, b) { return (b.t || 0) - (a.t || 0); });
        return out;
      },
      requestCount: function () {
        var d = load(), n = 0;
        for (var k in d.requests) if (d.requests.hasOwnProperty(k)) n += (d.requests[k].unread || 0);
        return n;
      },
      request: function (peer) { return load().requests[peer] || null; },
      addRequest: function (peer, nick, text, mid) {
        if (!peer) return null;
        var d = load();
        var r = d.requests[peer];
        if (!r) r = d.requests[peer] = { peer: peer, nick: nick || '', text: '', t: Date.now(), n: 0, unread: 0 };
        if (mid) r.mid = mid;
        if (nick) r.nick = nick;
        r.text = String(text || '');
        r.t = Date.now();
        r.n = (r.n || 0) + 1;
        r.unread = (r.unread || 0) + 1;
        /* 上限 200 条：同一网段可以无限换 id 灌请求，不设上限就会把 localStorage 写满 */
        var keys = Object.keys(d.requests);
        if (keys.length > 200) {
          keys.sort(function (a, b) { return (d.requests[a].t || 0) - (d.requests[b].t || 0); });
          for (var i = 0; i < keys.length - 200; i++) delete d.requests[keys[i]];
        }
        save();
        return r;
      },
      readRequests: function () {
        var d = load();
        for (var k in d.requests) if (d.requests.hasOwnProperty(k)) d.requests[k].unread = 0;
        save();
      },
      dropRequest: function (peer) {
        var d = load();
        if (!peer || !d.requests[peer]) return false;
        delete d.requests[peer];
        save();
        return true;
      },
      /* 同意：落好友 + 建会话，把对方那条验证消息搬进历史，再删掉请求 */
      acceptRequest: function (peer) {
        var d = load(), r = d.requests[peer];
        var name = (r && r.nick) || peer;
        var f = this.addFriend(peer, name);
        var s = this.openLan(peer, name);
        if (r && r.text) this.add(s.id, r.text, 'in', { t: r.t, mid: r.mid });
        this.dropRequest(peer);
        save();
        return f;
      },
      /* 对方终止通讯：会话留个标记，界面据此锁输入并给三选一 */
      terminate: function (peer) {
        var d = load(), s = d.sessions['lan-' + peer];
        if (!s) return false;
        s.terminated = true;
        s.termAck = false;
        save();
        return true;
      },
      /* 用户已经对「对方终止通讯」做过选择：之后不再弹，也不再反复提醒 */
      ackTerminate: function (peer) {
        var d = load(), s = d.sessions['lan-' + peer];
        if (!s) return false;
        s.termAck = true;
        save();
        return true;
      },
      terminated: function (peer) {
        var d = load(), s = d.sessions['lan-' + peer];
        return !!(s && s.terminated);
      },
      /* 这个会话里所有图片的落盘文件名，删会话时用 */
      imageNames: function (peer) {
        var d = load(), s = d.sessions['lan-' + peer], out = [];
        if (!s) return out;
        for (var i = 0; i < s.msgs.length; i++) {
          var m = s.msgs[i];
          if (m.kind === 'image' && m.name) out.push(m.name);
        }
        return out;
      },
      /* 备份用：把一个会话导成纯文本 */
      chatText: function (peer, title) {
        var d = load(), s = d.sessions['lan-' + peer];
        if (!s) return '';
        var hasImage = s.msgs.some(function (m) { return m.kind === 'image'; });
        var out = ['# 鸽屋 · ' + (title || s.name || peer), '# 设备 ' + peer];
        /* 备份是纯文本：图片文件不会跟着导出，正文里只留占位，不写会被删掉的文件名 */
        if (hasImage) out.push('# 注：本备份只含文字，图片不包含在内');
        out.push('');
        var i, m;
        for (i = 0; i < s.msgs.length; i++) {
          m = s.msgs[i];
          var who = m.dir === 'out' ? '我' : (s.name || peer);
          var when = new Date(m.t || Date.now());
          var pad = function (x) { return x < 10 ? '0' + x : '' + x; };
          var stamp = when.getFullYear() + '-' + pad(when.getMonth() + 1) + '-' + pad(when.getDate()) +
            ' ' + pad(when.getHours()) + ':' + pad(when.getMinutes());
          var body = m.kind === 'image' ? '[图片]（未包含在备份中）' : (m.text || '');
          out.push('[' + stamp + '] ' + who + '：' + body);
        }
        return out.join('\n') + '\n';
      },

      /* ---------------- 好友 / 验证 ---------------- */
      friend: friendOf,
      friends: function () {
        var d = load(), out = [];
        for (var k in d.friends) if (d.friends.hasOwnProperty(k)) out.push(d.friends[k]);
        out.sort(function (a, b) {
          var x = a.alias || a.name || a.id, y = b.alias || b.name || b.id;
          return String(x).localeCompare(String(y), 'zh');
        });
        return out;
      },
      /* 通讯录和会话标题都走这里：有备注用备注，没有就用对方昵称 */
      displayName: function (peer, fallback) {
        var f = friendOf(peer);
        return (f && (f.alias || f.name)) || fallback || peer;
      },
      /* 通过验证 / 主动加好友：两边都落到同一个函数，幂等 */
      addFriend: function (peer, name) {
        var d = load();
        var f = d.friends[peer];
        if (!f) {
          f = d.friends[peer] = {
            id: peer, name: name || '', alias: '', note: '', muted: false,
            blocked: false, addedAt: Date.now()
          };
        } else if (name && !f.name) {
          f.name = name;
        }
        var s = d.sessions['lan-' + peer];
        if (s) { s.pending = false; s.waiting = false; s.ignored = false; }
        save();
        return f;
      },
      patchFriend: function (peer, patch) {
        var f = friendOf(peer);
        if (!f) return null;
        for (var k in patch) if (patch.hasOwnProperty(k)) f[k] = patch[k];
        save();
        return f;
      },
      setBlocked: function (peer, on) { return this.patchFriend(peer, { blocked: !!on }); },
      blocked: function (peer) { var f = friendOf(peer); return !!(f && f.blocked); },
      muted: function (peer) { var f = friendOf(peer); return !!(f && f.muted); },
      /* 能不能再发消息。规则照 0.4：主动加的人，对方回第一句之前只准发一条，
         但「未送达」的那条不算数，否则对方没在线一次就把自己永久锁死。 */
      canSend: function (id) {
        var d = load(), s = d.sessions[id];
        if (!s || !s.peer) return { ok: true };
        if (s.terminated) return { ok: false, why: 'terminated' };
        if (d.friends[s.peer]) return { ok: true };
        for (var i = 0; i < s.msgs.length; i++) {
          var m = s.msgs[i];
          if (m.dir === 'out' && m.delivery !== 'failed') return { ok: false, why: 'wait' };
        }
        return { ok: true };
      },
      /* 通过验证：本地落好友，同时告诉对方「我同意了」，否则对方那条「等回复」永远挂着 */
      accept: function (peer, name) {
        this.addFriend(peer, name);
        var d = load(), s = d.sessions['lan-' + peer];
        if (s) { s.pending = false; s.waiting = false; s.ignored = false; }
        save();
      },
      /* 忽略：这条会话不再提示，之后对方的消息也不进来（但不算屏蔽，随时能通过） */
      ignoreLan: function (peer) {
        var d = load(), s = d.sessions['lan-' + peer];
        if (!s) return;
        s.pending = false;
        s.ignored = true;
        save();
      },
      markWaiting: function (peer) {
        var d = load(), s = d.sessions['lan-' + peer];
        if (s && !d.friends[peer]) { s.waiting = true; save(); }
      },
      /* 删好友 = 连会话一起删；聊天记录和联系人是一体的，留着半截更怪 */
      deleteFriend: function (peer) {
        var d = load(), id = 'lan-' + peer, o = [];
        /* 图片清理收在这里：三个删除入口（通讯录 / 会话设置 / 终止后三选一）都走这个函数，
           不要在视图里各写一遍分支——上一版就是只在一个入口删了，另外两个漏了。 */
        var images = this.imageNames(peer);
        delete d.friends[peer];
        delete d.sessions[id];
        for (var i = 0; i < d.order.length; i++) if (d.order[i] !== id) o.push(d.order[i]);
        d.order = o;
        save();
        if (images.length && typeof window.__xjDropMedia === 'function') {
          try { window.__xjDropMedia(images); } catch (error) {}
        }
      }
    };
  })();


  function fmtTime(ts) {
    var dt = new Date(ts), now = new Date();
    function p2(x) { return x < 10 ? '0' + x : '' + x; }
    if (dt.toDateString() === now.toDateString()) return p2(dt.getHours()) + ':' + p2(dt.getMinutes());
    return (dt.getMonth() + 1) + '/' + dt.getDate();
  }


  /* ================= 媒体回调收件人 =================
     原生把结果送回来时（window.__xjPick / __xjLoc），落到当前打开的会话。
     视图离开时会把它置空，避免回调打到已经不存在的界面上。 */
  var ChatSink = null;

  window.__xjPick = function (json) {
    var o;
    try { o = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return; }
    if (!o || !ChatSink || !ChatSink.picked) return;
    ChatSink.picked(o);
  };

  window.__xjLoc = function (json) {
    var o;
    try { o = typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return; }
    if (!o || !ChatSink || !ChatSink.located) return;
    ChatSink.located(o);
  };

  function fmtSize(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  }

  /* 经纬度转成人看得懂的写法 */
  function locText(m) {
    var lat = Number(m.lat) || 0, lon = Number(m.lon) || 0;
    var ns = lat >= 0 ? '北纬' : '南纬';
    var ew = lon >= 0 ? '东经' : '西经';
    return ns + ' ' + Math.abs(lat).toFixed(4) + '°, ' + ew + ' ' + Math.abs(lon).toFixed(4) + '°';
  }


  /* ================= 共用动作 ================= */
  function exportAll() {
    Bridge.list().then(function (list) {
      if (!list.length) return toast('书架是空的');
      confirmBox('导出全部 ' + list.length + ' 个文件？', '开始导出').then(function (ok) {
        if (!ok) return;
        var i = 0, okN = 0, badN = 0;
        (function next() {
          if (i >= list.length) {
            toast(badN ? ('导出 ' + okN + ' 个，' + badN + ' 个失败') : ('已导出 ' + list.length + ' 个'));
            return;
          }
          var nm = list[i++].name;
          Bridge.read(nm).then(function (txt) {
            return Bridge.exportOne(nm, txt).then(function (r) {
              if (r === false) badN++; else okN++;
              setTimeout(next, 260);
            }, function () { badN++; setTimeout(next, 260); });
          }, function () { badN++; setTimeout(next, 260); });
        })();
      });
    });
  }


  function rowHtml(act, ico, label, val) {
    return '<button type="button" class="row' + (ico ? ' has-icon' : '') + '" data-act="' + act + '">' +
      (ico ? '<span class="row-ico">' + svg(ico) + '</span>' : '') +
      '<span class="row-t">' + esc(label) + '</span>' +
      (val ? '<span class="row-v">' + esc(val) + '</span>' : '') +
      '<span class="row-arrow">' + svg('chevron') + '</span></button>';
  }