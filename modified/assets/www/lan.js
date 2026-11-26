/* 鸽屋的 WebView 接口。只有用户开启局域网后才会开始发现和收发。

   图片走协议 v2：JS 把原图压到 1 MB 以内 -> 原生切成 12000 字符的块顺序发 ->
   对端原生收齐后直接写进 media/，回一个文件名，JS 只认 /media/<name>，渲染代码和本地图片完全一样。
   带宽只占四分之一：同一时刻只有一张在传，一张传完后至少等 3 倍耗时再发下一张。 */
'use strict';

var Lan = (function () {
  var bridge = window.XinJianLan;
  var available = !!(bridge && typeof bridge.start === 'function');
  var on = false;
  var peers = Object.create(null);
  var pending = Object.create(null);
  var waiters = Object.create(null);
  var listeners = [];
  var idPattern = /^xj-[0-9a-f]{12}$/;
  var midPattern = /^[A-Za-z0-9_-]{1,80}$/;
  var id = '';
  /* 单张上限 1 MB：压完的 base64 不超过这个长度（1 MB 原始字节 ≈ 1.37 MB base64） */
  var MAX_B64 = 1365000;
  /* 「我同意」这条控制消息用 \u0001 开头：对方看到的是静默的，不会在会话里多出一条 */
  var ACCEPT_MARK = '\u0001';
  /* 「我删了你」也用一条静默控制消息，对端据此弹三选一 */
  var TERMINATE_MARK = '\u0002';
  var ACCEPT_TEXT = ACCEPT_MARK + '已同意你的好友申请';
  var TERMINATE_TEXT = TERMINATE_MARK + '已终止通讯';
  var epoch = 0;
  var queue = [], busy = false;
  /* 正在发的图片：mid -> 会话 id。关网时据此把它们一次性标成失败 */
  var inflight = Object.create(null);
  if (available) {
    try { id = bridge.deviceId(); } catch (error) {}
  }

  function refresh() { listeners.slice().forEach(function (listener) { listener(); }); }

  function setState(active) {
    on = active;
    if (!on) {
      /* 关网=作废所有在途任务，速度要快过它们的回调 */
      epoch++;
      peers = Object.create(null);
      Object.keys(pending).forEach(function (mid) {
        Pigeon.delivery(pending[mid], mid, false);
        delete pending[mid];
      });
      queue = [];
      busy = false;
      Object.keys(waiters).forEach(function (mid) { delete waiters[mid]; });
      Object.keys(inflight).forEach(function (mid) {
        Pigeon.delivery(inflight[mid], mid, false);
        delete inflight[mid];
      });
    }
    refresh();
  }

  window.__xjLan = function (json) {
    var event;
    try { event = JSON.parse(json); } catch (error) { return; }
    if (!event) return;
    if (event.t === 'state') {
      setState(event.on === true);
      if (event.failed) toast('无法开启局域网，请检查网络或端口占用');
      return;
    }
    if (!on || typeof event.id !== 'string' || !idPattern.test(event.id) || event.id === id) return;
    if (event.t === 'peer') {
      peers[event.id] = { id: event.id, name: typeof event.nick === 'string' ? event.nick.slice(0, 48) : '' };
    } else if (event.t === 'offline') {
      delete peers[event.id];
    } else if (event.t === 'msg') {
      if (typeof event.text !== 'string' || !event.text.trim() || event.text.length > 2000 ||
          typeof event.mid !== 'string' || !midPattern.test(event.mid)) return;
      var name = typeof event.nick === 'string' ? event.nick.slice(0, 48) : '';
      /* 控制信号只认整条精确匹配，且终止只接受「已经是好友」的人发来的 */
      if (Pigeon.blocked(event.id)) return;
      if (event.text === TERMINATE_TEXT) {
        if (!Pigeon.friend(event.id)) return;
        if (Pigeon.terminate(event.id)) refresh();
        return;
      }
      if (event.text === ACCEPT_TEXT) {
        var asked = Pigeon.get('lan-' + event.id);
        if (asked && asked.waiting) {
          Pigeon.accept(event.id, name);
          toast('对方同意了你的好友申请');
          refresh();
        }
        return;
      }
      Pigeon.receiveLan(event.id, name, event.mid, event.text);
    } else if (event.t === 'img') {
      if (typeof event.mid !== 'string' || !midPattern.test(event.mid) ||
          typeof event.name !== 'string' || !event.name) return;
      var from = typeof event.nick === 'string' ? event.nick.slice(0, 48) : '';
      if (Pigeon.blocked(event.id)) {
        /* 原生是先落盘再通知：屏蔽期间进来的图，这里补一刀删掉，别留在 media/ */
        try { if (bridge && bridge.deleteMedia) bridge.deleteMedia(event.name); } catch (error) {}
        return;
      }
      Pigeon.receiveImage(event.id, from, event.mid, event.name,
        Number(event.w) || 0, Number(event.h) || 0, Number(event.size) || 0);
    } else if (event.t === 'delivery') {
      var sid = pending[event.mid];
      var waiter = waiters[event.mid];
      if (sid) {
        if (!sid || sid !== 'lan-' + event.id) return;
        delete pending[event.mid];
        Pigeon.delivery(sid, event.mid, event.ok === true);
      }
      if (waiter) { delete waiters[event.mid]; waiter(event.ok === true); }
    } else {
      return;
    }
    refresh();
  };

  /* 设备指纹 xj-xxxxxxxxxxxx，太长不好认；只取后 12 位里的前 8 位 */
  function shortId(value) {
    return String(value || '').replace(/^xj-/, '').slice(0, 8);
  }

  var WARN_KEY = 'xj:lan:warned';

  function startLan() {
    try {
      if (bridge.start(Profile.get().nick || '')) setState(true);
      else toast('无法开启局域网，请检查网络或端口占用');
    } catch (error) { toast('无法开启局域网'); }
  }

  /* 第一次开启先讲清楚这是什么网络：提示放在决策点上，而不是藏在「关于」里 */
  function toggle() {
    if (!available) { toast('局域网需要 Android 应用'); return; }
    if (on) {
      try { bridge.stop(); } catch (error) {}
      setState(false);
      return;
    }
    var warned = true;
    try { warned = localStorage.getItem(WARN_KEY) === '1'; } catch (error) {}
    if (warned) { startLan(); return; }
    confirmBox('鸽屋只能在可信局域网使用：不做身份校验，别人可以冒充；传输是明文，同网段能抓到内容。确定在这里开启？',
      '了解，开启').then(function (ok) {
      if (!ok) return;
      try { localStorage.setItem(WARN_KEY, '1'); } catch (error) {}
      startLan();
    });
  }

  function send(session, text) {
    /* 用户手打的 \u0001/\u0002 会被对方当成控制指令，发之前剥掉 */
    text = String(text == null ? '' : text).replace(/^[\u0001\u0002]+/, '');
    if (!text.trim()) return;
    var mid = 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    Pigeon.add(session.id, text, 'out', { mid: mid, delivery: 'pending' });
    pending[mid] = session.id;
    var queued = false;
    try { queued = on && bridge.send(session.peer, mid, text); }
    catch (error) {}
    if (!queued) {
      delete pending[mid];
      Pigeon.delivery(session.id, mid, false);
    }
    refresh();
  }

  /* ---------------- 图片 ---------------- */

  function newMid() {
    return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function canSendImage() {
    return on && available && typeof bridge.sendImage === 'function';
  }

  function readMedia(name) {
    if (!available || typeof bridge.readMedia !== 'function') return '';
    try { return bridge.readMedia(name) || ''; } catch (error) { return ''; }
  }

  /* 压到 1 MB 以内：长边先压到 1600，质量 0.85 起，退到 0.4 还不够就缩边 */
  function compress(source, done) {
    var img = new Image();
    img.onload = function () {
      var longest = Math.max(img.width || 1, img.height || 1);
      var scale = Math.min(1, 1600 / longest);
      var quality = 0.85, guard = 0;
      (function attempt() {
        guard++;
        var w = Math.max(1, Math.round((img.width || 1) * scale));
        var h = Math.max(1, Math.round((img.height || 1) * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        if (!ctx) return done(null);
        ctx.drawImage(img, 0, 0, w, h);
        var url;
        try { url = canvas.toDataURL('image/jpeg', quality); } catch (error) { return done(null); }
        var data = url.slice(url.indexOf(',') + 1);
        if (data.length <= MAX_B64 || guard >= 9) return done({ data: data, w: w, h: h });
        if (quality > 0.4) quality = Math.max(0.4, quality - 0.15);
        else scale *= 0.7;
        attempt();
      })();
    };
    img.onerror = function () { done(null); };
    img.src = 'data:image/jpeg;base64,' + source;
  }

  function enqueue(job) {
    queue.push(job);
    pump();
  }

  /* 一次只跑一张；跑完按耗时留出 3 倍间隔，图片只吃约 1/4 的链路时间 */
  function pump() {
    if (busy || !queue.length) return;
    busy = true;
    var job = queue.shift();
    var started = Date.now();
    var settled = false;
    function finish() {
      if (settled) return;
      settled = true;
      busy = false;
      var spent = Math.max(80, Date.now() - started);
      setTimeout(pump, Math.min(4000, spent * 3));
    }
    run(job, finish);
  }

  function run(job, finish) {
    var session = job.session;
    if (job.mid) {
      Pigeon.delivery(session.id, job.mid, null);
    } else {
      job.mid = newMid();
    }
    var mid = job.mid;
    var timer = null;
    /* 关网后旧任务的回调一律作废，避免它们把队列重新拉起来 */
    var myEpoch = epoch;

    function fail(permanent) {
      if (timer) { clearTimeout(timer); timer = null; }
      delete inflight[mid];
      if (myEpoch !== epoch) { delete waiters[mid]; Pigeon.delivery(session.id, mid, false); refresh(); return finish(); }
      delete waiters[mid];
      Pigeon.delivery(session.id, mid, false);
      if (!permanent && job.tries < 2) {
        job.tries = (job.tries || 0) + 1;
        queue.unshift(job);
      }
      refresh();
      finish();
    }

    function deliver(payload) {
      if (myEpoch !== epoch) { delete waiters[mid]; Pigeon.delivery(session.id, mid, false); refresh(); return finish(); }
      if (!payload) return fail(true);
      job.data = payload;
      if (!job.created) {
        job.created = true;
        Pigeon.add(session.id, '', 'out', {
          kind: 'image', name: job.name, mid: mid, delivery: 'pending',
          w: payload.w, h: payload.h
        });
        refresh();
      }
      waiters[mid] = function (ok) {
        if (timer) { clearTimeout(timer); timer = null; }
        if (ok) { job.tries = 0; delete inflight[mid]; Pigeon.delivery(session.id, mid, true); refresh(); return finish(); }
        fail(false);
      };
      inflight[mid] = session.id;
      var queued = false;
      try { queued = canSendImage() && bridge.sendImage(session.peer, mid, job.name, payload.w, payload.h, payload.data); }
      catch (error) {}
      if (!queued) return waiters[mid] ? fail(false) : null;
      timer = setTimeout(function () { delete waiters[mid]; fail(false); }, 25000);
    }

    if (job.data) return deliver(job.data);
    compress(job.source, deliver);
  }

  /* 控制消息也走 mid + 回执：丢了要重发，否则对方永远停在「等回复」 */
  function sendControl(peer, text, attempt) {
    var mid = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    var settled = false;
    function finish(ok) {
      if (settled) return;
      settled = true;
      delete waiters[mid];
      if (ok) return;
      var tried = attempt || 0;
      if (tried >= 2) return;
      setTimeout(function () { sendControl(peer, text, tried + 1); }, 800);
    }
    waiters[mid] = finish;
    var queued = false;
    try { queued = on && bridge.send(peer, mid, text); } catch (error) {}
    if (!queued) return finish(false);
    setTimeout(function () { finish(false); }, 4000);
  }

  /* 通过验证时给对端一个明确信号，否则对方那条「验证消息已发出」会一直挂着 */
  function accept(peer) {
    var session = Pigeon.get('lan-' + peer);
    Pigeon.accept(peer, session ? session.name : peer);
    sendControl(peer, ACCEPT_TEXT);
    refresh();
  }

  /* 我删对方：先把话说到，再删本地。对方不在线就收不到，本地照样删。 */
  /* Pigeon.deleteFriend 通过这个钩子删盘：数据层不直接碰原生 */
  window.__xjDropMedia = function (names) {
    for (var i = 0; i < names.length; i++) {
      try { if (bridge && bridge.deleteMedia) bridge.deleteMedia(names[i]); } catch (error) {}
    }
  };

  function dropContact(peer) {
    sendControl(peer, TERMINATE_TEXT);
    Pigeon.deleteFriend(peer);
    refresh();
  }

  function shareImage(session, name) {
    if (!Pigeon.canSend(session.id).ok) { toast('等对方回复后才能继续发'); return false; }
    var source = readMedia(name);
    if (!source) { toast('读不到这张图'); return false; }
    enqueue({ session: session, name: name, source: source });
    return true;
  }

  function retry(session, message) {
    if (!message || !message.name) return false;
    var source = readMedia(message.name);
    if (!source) { toast('原图已经不在了'); return false; }
    message.delivery = 'pending';
    enqueue({ session: session, name: message.name, source: source, mid: message.mid, created: true });
    refresh();
    return true;
  }

  return {
    available: available,
    running: function () { return on; },
    id: function () { return id; },
    short: shortId,
    toggle: toggle,
    peers: function () { return Object.keys(peers).map(function (peer) { return peers[peer]; }); },
    peer: function (peer) { return peers[peer]; },
    pending: function (mid) { return !!pending[mid]; },
    send: send,
    accept: accept,
    dropContact: dropContact,
    terminateMark: function () { return TERMINATE_MARK; },
    canSendImage: canSendImage,
    shareImage: shareImage,
    retry: retry,
    observe: function (listener) {
      listeners.push(listener);
      return function () {
        var index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
})();