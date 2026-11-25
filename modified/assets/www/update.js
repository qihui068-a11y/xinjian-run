'use strict';

var AppUpdate = (function () {
  var bridge = window.XinJianUpdate;
  var status = { state: bridge ? 'idle' : 'demo', current: '', latest: '', percent: 0, message: '' };
  var subscribers = [];
  var lastCheck = 0;
  var notifiedVersion = '';
  var automatic = false;

  function read(raw) {
    try {
      var next = JSON.parse(raw);
      if (next && typeof next.state === 'string') status = next;
    } catch (_) {}
  }

  if (bridge) read(bridge.info());
  window.__xjUpdate = function (raw) {
    read(raw);
    if (automatic && status.state === 'available' && notifiedVersion !== status.latest && !subscribers.length) {
      notifiedVersion = status.latest;
      toast('发现信笺 ' + status.latest + '，可在设置中更新');
    }
    if (status.state !== 'checking') automatic = false;
    subscribers.forEach(function (render) { render(status); });
  };

  function busy() {
    return ['checking', 'downloading', 'verifying'].indexOf(status.state) !== -1;
  }

  function check(auto) {
    if (!bridge || busy()) return;
    if (auto && (document.hidden || status.state === 'ready' || Date.now() - lastCheck < 6 * 60 * 60 * 1000)) return;
    lastCheck = Date.now();
    automatic = auto;
    bridge.check();
  }

  return {
    status: function () { return status; },
    check: function () { check(false); },
    act: function () {
      if (!bridge) return;
      if (status.state === 'ready') bridge.install();
      if (status.state === 'available' || status.state === 'downloadError') bridge.download();
    },
    watch: function (render) {
      subscribers.push(render);
      render(status);
      return function () { subscribers = subscribers.filter(function (fn) { return fn !== render; }); };
    },
    start: function () {
      if (!bridge) return;
      setTimeout(function () { check(true); }, 800);
      document.addEventListener('visibilitychange', function () { check(true); });
    }
  };
})();
