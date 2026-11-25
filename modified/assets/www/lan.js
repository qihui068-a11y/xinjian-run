/* 鸽屋的 WebView 接口。只有用户开启局域网后才会开始发现和收发。 */
'use strict';

var Lan = (function () {
  var bridge = window.XinJianLan;
  var available = !!(bridge && typeof bridge.start === 'function');
  var on = false;
  var peers = Object.create(null);
  var pending = Object.create(null);
  var listeners = [];
  var idPattern = /^xj-[0-9a-f]{12}$/;
  var midPattern = /^[A-Za-z0-9_-]{1,80}$/;
  var id = '';
  if (available) {
    try { id = bridge.deviceId(); } catch (error) {}
  }

  function refresh() { listeners.slice().forEach(function (listener) { listener(); }); }

  function setState(active) {
    on = active;
    if (!on) {
      peers = Object.create(null);
      Object.keys(pending).forEach(function (mid) {
        Pigeon.delivery(pending[mid], mid, false);
        delete pending[mid];
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
      Pigeon.receiveLan(event.id, name, event.mid, event.text);
    } else if (event.t === 'delivery') {
      var sid = pending[event.mid];
      if (!sid || sid !== 'lan-' + event.id) return;
      delete pending[event.mid];
      Pigeon.delivery(sid, event.mid, event.ok === true);
    } else {
      return;
    }
    refresh();
  };

  function toggle() {
    if (!available) return;
    if (on) {
      try { bridge.stop(); } catch (error) {}
      setState(false);
    } else {
      try {
        if (bridge.start(Profile.get().nick || '')) setState(true);
      } catch (error) { toast('无法开启局域网'); }
    }
  }

  function send(session, text) {
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

  return {
    available: available,
    running: function () { return on; },
    id: function () { return id; },
    toggle: toggle,
    peers: function () { return Object.keys(peers).map(function (peer) { return peers[peer]; }); },
    peer: function (peer) { return peers[peer]; },
    pending: function (mid) { return !!pending[mid]; },
    send: send,
    observe: function (listener) {
      listeners.push(listener);
      return function () {
        var index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
})();
