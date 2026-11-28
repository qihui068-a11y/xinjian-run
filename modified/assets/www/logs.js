/* 信笺 · 本地日志
   错误/崩溃写入 /0/xinjian/wrong（无权限时退回应用私有目录）。
   仅记录错误 / 完整记录 / 完全不记录，默认仅记录错误。 */
var Logs = (function () {
  'use strict';

  var MODE_KEY = 'xj:logs:mode';
  var SEEN_KEY = 'xj:logs:seen';
  var LABELS = { full: '完整记录', error: '仅记录错误', off: '完全不记录' };
  var mode = 'error';
  var buffer = [];
  var flushTimer = null;
  var crumbsReady = false;
  var recording = false;
  var started = false;

  function readMode() {
    try {
      var value = localStorage.getItem(MODE_KEY);
      if (value === 'full' || value === 'error' || value === 'off') return value;
    } catch (e) {}
    return 'error';
  }

  function pad(value) { return value < 10 ? '0' + value : '' + value; }

  function now() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }

  function stamp() {
    var d = new Date();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
      pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '-' +
      ('00' + d.getMilliseconds()).slice(-3);
  }

  function version() {
    try { return AppUpdate.status().current || '未知'; } catch (e) { return '未知'; }
  }

  function route() {
    try {
      var stack = Nav.stack, entry = stack[stack.length - 1];
      return entry ? entry.name : '';
    } catch (e) { return ''; }
  }

  function label(value) { return LABELS[value] || LABELS.error; }

  function write(name, text) {
    try { return Bridge.logWrite(name, text); } catch (e) { return false; }
  }

  function record(type, message, detail) {
    if (mode === 'off' || recording) return;
    if (type !== 'error' && type !== 'crash') return;
    recording = true;
    try {
      var prefix = type === 'crash' ? 'crash-' : 'error-';
      var text = '时间: ' + now() + '\n' +
        '类型: ' + (type === 'crash' ? '崩溃' : '错误') + '\n' +
        '模式: ' + label(mode) + '\n' +
        '页面: ' + route() + '\n' +
        '版本: ' + version() + '\n' +
        '设备: ' + (navigator.userAgent || '') + '\n\n' +
        (message ? message + '\n\n' : '') + (detail || '');
      if (mode === 'full' && buffer.length) text += '\n最近操作:\n' + buffer.join('\n') + '\n';
      write(prefix + stamp() + '.log', text);
    } finally {
      recording = false;
    }
  }

  function crumb(kind, detail) {
    if (mode !== 'full') return;
    buffer.push(now() + ' ' + kind + ' ' + detail);
    if (buffer.length > 60) buffer.shift();
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      write('breadcrumbs.txt', buffer.join('\n') + '\n');
    }, 600);
  }

  function installCrumbs() {
    if (crumbsReady) return;
    crumbsReady = true;
    if (window.Nav) {
      ['go', 'back', 'reset', 'tab'].forEach(function (key) {
        var original = Nav[key];
        if (typeof original !== 'function') return;
        Nav[key] = function () {
          var result = original.apply(this, arguments);
          crumb('页面', key + (arguments[0] ? ' ' + arguments[0] : ''));
          return result;
        };
      });
    }
    document.addEventListener('click', function (event) {
      var node = event.target;
      if (!node || !node.closest) return;
      var target = node.closest('[data-act],[data-tab],[data-go],[data-code],[data-qq]');
      if (!target) return;
      var value = target.dataset.act || target.dataset.tab || target.dataset.go ||
        target.dataset.code || target.dataset.qq || '';
      if (value) crumb('点击', value);
    }, true);
    var originalError = console.error;
    console.error = function () {
      crumb('控制台', Array.prototype.map.call(arguments, function (value) { return String(value); }).join(' '));
      return originalError.apply(console, arguments);
    };
  }

  function showCrash(name, text) {
    var mask = document.createElement('div');
    mask.className = 'mask';
    mask.innerHTML = '<div class="sheet crash-sheet">' +
      '<div class="sheet-title">上次运行发生崩溃</div>' +
      '<pre class="crash-log"></pre>' +
      '<button type="button" class="sheet-item" data-crash="open">查看完整日志</button>' +
      '<button type="button" class="sheet-item" data-crash="close">关闭</button></div>';
    mask.querySelector('.crash-log').textContent = String(text || '').slice(0, 8000);
    document.body.appendChild(mask);

    var layer = null, settled = false;
    function close(open) {
      if (settled) return;
      settled = true;
      mask.remove();
      if (layer && window.Back) Back.done(layer);
      if (open) Nav.go('logDetail', { name: name });
    }
    if (window.Back) layer = Back.open(function () { close(false); });
    mask.addEventListener('click', function (event) {
      if (event.target === mask) return close(false);
      var button = event.target.closest('[data-crash]');
      if (!button) return;
      close(button.dataset.crash === 'open');
    });
  }

  function announceCrash() {
    if (mode === 'off') return;
    Bridge.logList().then(function (list) {
      var crash = null;
      for (var i = 0; i < list.length; i++) {
        if (/^crash-/.test(list[i].name)) { crash = list[i]; break; }
      }
      if (!crash) return;
      var seen = '';
      try { seen = localStorage.getItem(SEEN_KEY) || ''; } catch (e) {}
      if (seen === crash.name) return;
      try { localStorage.setItem(SEEN_KEY, crash.name); } catch (e) {}
      Bridge.logRead(crash.name).then(function (text) { showCrash(crash.name, text); });
    });
  }

  function setMode(value) {
    if (value !== 'full' && value !== 'error' && value !== 'off') value = 'error';
    mode = value;
    try { localStorage.setItem(MODE_KEY, value); } catch (e) {}
    try { Bridge.logSetMode(value); } catch (e) {}
    if (value === 'full') installCrumbs();
    if (value !== 'full' && flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  }

  function init() {
    mode = readMode();
    try { Bridge.logSetMode(mode); } catch (e) {}
    if (mode === 'full') installCrumbs();
    if (started) return;
    started = true;
    announceCrash();
  }

  window.addEventListener('error', function (event) {
    if (!event || !event.message) return;
    var detail = '来源: ' + (event.filename || '') + ':' + (event.lineno || 0) + ':' + (event.colno || 0) + '\n' +
      (event.error && event.error.stack ? event.error.stack : '');
    record('error', event.message, detail);
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var detail = reason && reason.stack ? reason.stack : String(reason);
    record('error', '未处理的 Promise 拒绝', detail);
  });

  return {
    init: init,
    mode: function () { return mode; },
    label: label,
    setMode: setMode,
    record: record,
    list: function () { return Bridge.logList(); },
    read: function (name) { return Bridge.logRead(name); },
    remove: function (name) { return Bridge.logRemove(name); },
    clear: function () { return Bridge.logClear(); },
    state: function () { return Bridge.logState(); },
    requestStorage: function () { return Bridge.logRequestStorage(); }
  };
})();
