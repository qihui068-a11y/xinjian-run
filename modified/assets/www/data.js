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


  /* ================= 鸽屋数据（本地会话与局域网聊天记录） ================= */
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
    function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
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
          d.sessions[id] = { id: id, peer: peer, name: name || peer, msgs: [], mtime: Date.now() };
          d.order.unshift(id);
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
      receiveLan: function (peer, name, mid, text) {
        var s = this.openLan(peer, name);
        if (!s.msgs.some(function (m) { return m.dir === 'in' && m.mid === mid; })) {
          this.add(s.id, text, 'in', { mid: mid });
        }
      },
      delivery: function (id, mid, ok) {
        var s = this.get(id);
        if (!s) return;
        var message = s.msgs.find(function (m) { return m.dir === 'out' && m.mid === mid; });
        if (!message) return;
        message.delivery = ok ? 'delivered' : 'failed';
        save();
      },
      remove: function (id) {
        var d = load(), o = [];
        delete d.sessions[id];
        for (var i = 0; i < d.order.length; i++) if (d.order[i] !== id) o.push(d.order[i]);
        d.order = o;
        save();
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
    return '<div class="row" data-act="' + act + '">' +
      '<span class="row-ico">' + svg(ico) + '</span>' +
      '<span class="row-t">' + esc(label) + '</span>' +
      (val ? '<span class="row-v">' + esc(val) + '</span>' : '') +
      '<span class="row-arrow">&#8250;</span></div>';
  }
