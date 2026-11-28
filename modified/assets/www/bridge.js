/* 信笺 · 文件桥
   原生（APK）注入 window.XinJianBridge 时走原生；
   否则退化为浏览器本地存储，用于演示。 */
(function (global) {
  'use strict';

  var KEY = 'xj:docs:v1';
  var LOG_KEY = 'xj:logs:files';
  var LOG_MODE_KEY = 'xj:logs:mode';
  var hasNative = !!(global.XinJianBridge && global.XinJianBridge.list);

  function memStore() {
    var data = {};
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) { /* file:// 下可能不可用 */ }
    return {
      get: function () { return data; },
      put: function (d) {
        data = d;
        try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
      }
    };
  }
  var store = memStore();

  function extOf(name) {
    var m = /\.([^.\\/]+)$/.exec(name);
    return m ? m[1].toLowerCase() : '';
  }
  function logModeFallback() {
    try {
      var mode = localStorage.getItem(LOG_MODE_KEY);
      if (mode === 'full' || mode === 'error' || mode === 'off') return mode;
    } catch (e) {}
    return 'error';
  }
  function logFiles() {
    try {
      var data = JSON.parse(localStorage.getItem(LOG_KEY) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch (e) { return {}; }
  }
  function logSaveFiles(data) {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function logListFallback() {
    var data = logFiles(), out = [];
    Object.keys(data).forEach(function (name) {
      out.push({ name: name, size: String(data[name].text || '').length, mtime: data[name].mtime || 0 });
    });
    out.sort(function (a, b) { return b.mtime - a.mtime; });
    return out;
  }

  function excerptOf(text) {
    var lines = String(text || '').split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (t) return t.slice(0, 60);
    }
    return '';
  }

  function callNative(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (resolve, reject) {
      try {
        var out = global.XinJianBridge[fn].apply(global.XinJianBridge, args);
        /* read 返回源码原文：例如 "hello"、false、null 都是文件内容。 */
        if (typeof out === 'string' && fn !== 'read') {
          try { out = JSON.parse(out); } catch (e) {}
        }
        resolve(out);
      } catch (e) { reject(e); }
    });
  }

  var Bridge = {
    isNative: hasNative,
    extOf: extOf,
    /* ===== 相册 / 拍摄 / 文件 / 位置 =====
       这四个都是异步的：调用立刻返回，结果由原生回调
       window.__xjPick(json) / window.__xjLoc(json)。
       返回 false 表示当前环境（浏览器演示）没有这个能力。 */
    pickImage: function () {
      if (!hasNative) return false;
      try { window.XinJianBridge.pickImage(); return true; } catch (e) { return false; }
    },
    pickFile: function () {
      if (!hasNative) return false;
      try { window.XinJianBridge.pickFile(); return true; } catch (e) { return false; }
    },
    capture: function () {
      if (!hasNative) return false;
      try { window.XinJianBridge.capture(); return true; } catch (e) { return false; }
    },
    locate: function () {
      if (!hasNative) return false;
      try { window.XinJianBridge.locate(); return true; } catch (e) { return false; }
    },
    /* 打开系统的「本应用权限页」：已授予的权限只能由用户在那里关掉 */
    openAppSettings: function () {
      if (!hasNative) return false;
      try { window.XinJianBridge.openAppSettings(); return true; } catch (e) { return false; }
    },
    /* 安装未知应用（应用内更新用）。26 以下没有逐应用开关，返回 null 表示不显示这一行。 */
    installStatus: function () {
      if (!hasNative || typeof window.XinJianBridge.installStatus !== 'function') return null;
      try { return window.XinJianBridge.installStatus() === true; } catch (e) { return null; }
    },
    openInstallSettings: function () {
      if (!hasNative) return false;
      try {
        if (typeof window.XinJianBridge.openInstallSettings === 'function') {
          window.XinJianBridge.openInstallSettings();
          return true;
        }
      } catch (e) { return false; }
      return Bridge.openAppSettings();
    },
    /* 拉起 QQ：WebView 会拦掉 mqqwpa://，只能交给原生 Intent */
    openQQ: function (qq) {
      if (!hasNative || typeof window.XinJianBridge.openQQ !== 'function') return false;
      try { window.XinJianBridge.openQQ(String(qq)); return true; } catch (e) { return false; }
    },
    /* 某个原生命中是否存在（演示模式下四个媒体功能都没有） */
    can: function (fn) {
      try { return !!(hasNative && window.XinJianBridge && window.XinJianBridge[fn]); }
      catch (e) { return false; }
    },
    /* 深色开关同步给原生窗口。浏览器里没有窗口可改，直接跳过。 */
    theme: function (isDark) {
      if (!hasNative) return;
      try { window.XinJianBridge.theme(isDark ? '1' : '0'); } catch (e) { }
    },

    /* 系统栏占位（同步返回）：'{"top":96,"bottom":48}'
       状态栏透明后，顶部这块高度要自己让出来 —— 见 app.js applyInsets()。
       演示模式（没有原生）返回空串，那边就退回 CSS 的 env()。 */
    insets: function () {
      if (!hasNative) return '';
      if (typeof global.XinJianBridge.insets !== 'function') return '';
      try { return global.XinJianBridge.insets(); } catch (e) { return ''; }
    },

    /* [{name, size, mtime, excerpt, ext}] */
    list: function () {
      if (hasNative) return callNative('list');
      return Promise.resolve().then(function () {
        var d = store.get(), out = [];
        Object.keys(d).forEach(function (n) {
          out.push({
            name: n, size: d[n].text.length, mtime: d[n].mtime,
            excerpt: excerptOf(d[n].text), ext: extOf(n)
          });
        });
        return out;
      });
    },

    read: function (name) {
      if (hasNative) return callNative('read', name);
      return Promise.resolve().then(function () {
        var d = store.get();
        if (!d[name]) throw new Error('文件不存在');
        return d[name].text;
      });
    },

    /* 返回 true=成功，false=已存在 */
    create: function (name, text) {
      if (hasNative) return callNative('create', name, text);
      return Promise.resolve().then(function () {
        var d = store.get();
        if (d[name]) return false;
        d[name] = { text: text || '', mtime: Date.now() };
        store.put(d);
        return true;
      });
    },

    write: function (name, text) {
      if (hasNative) return callNative('write', name, text);
      return Promise.resolve().then(function () {
        var d = store.get();
        d[name] = { text: text, mtime: Date.now() };
        store.put(d);
        return true;
      });
    },

    remove: function (name) {
      if (hasNative) return callNative('remove', name);
      return Promise.resolve().then(function () {
        var d = store.get();
        if (!d[name]) return false;
        delete d[name];
        store.put(d);
        return true;
      });
    },

    rename: function (oldName, newName) {
      if (hasNative) return callNative('rename', oldName, newName);
      return Promise.resolve().then(function () {
        var d = store.get();
        if (!d[oldName] || d[newName]) return false;
        d[newName] = d[oldName];
        delete d[oldName];
        store.put(d);
        return true;
      });
    },

    /* ===== 权限（只有原生态才有真数据） ===== */
    permStatus: function () {
      if (hasNative && typeof global.XinJianBridge.permStatus === 'function') {
        return callNative('permStatus');
      }
      return Promise.resolve({ demo: true, items: [] });
    },

    /* 原生会异步回调 window.__xjPerm(key, ok)，这里只扔请求 */
    askPerm: function (key) {
      if (hasNative && typeof global.XinJianBridge.askPerm === 'function') {
        try { global.XinJianBridge.askPerm(String(key)); } catch (e) {}
      }
      return true;
    },

    exists: function (name) {
      if (hasNative) return callNative('exists', name);
      return Promise.resolve(!!store.get()[name]);
    },

    /* 背景图：调系统裁剪页，裁完回 __xjCrop({ok,name})。 */
    pickBackground: function () {
      if (!hasNative || !global.XinJianCrop || typeof global.XinJianCrop.pick !== 'function') return false;
      try { global.XinJianCrop.pick(); return true; } catch (e) { return false; }
    },

    /* 删掉原生 media/ 里的文件；鸽屋图片和会话背景都用它 */
    deleteMedia: function (name) {
      if (!hasNative || !global.XinJianLan || typeof global.XinJianLan.deleteMedia !== 'function') return false;
      try { return global.XinJianLan.deleteMedia(String(name)) === true; } catch (e) { return false; }
    },

    /* AI 请求交给原生发：WebView 直接 fetch 会被 CORS 拦住。 */
    aiRequest: function (id, url, headers, body) {
      if (!hasNative || !global.XinJianAi || typeof global.XinJianAi.request !== 'function') return false;
      try {
        global.XinJianAi.request(String(id), String(url), String(headers), String(body));
        return true;
      } catch (e) { return false; }
    },

    /* ===== 日志（崩溃/报错记录） =====
       原生用 XinJianLog 写 /0/xinjian/wrong；浏览器演示退回 localStorage。 */
    logState: function () {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.state === 'function') {
          return Promise.resolve(JSON.parse(global.XinJianLog.state()));
        }
      } catch (e) {}
      return Promise.resolve({
        demo: true, public: false, path: '浏览器演示模式（localStorage）', mode: logModeFallback()
      });
    },
    logList: function () {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.list === 'function') {
          return Promise.resolve(JSON.parse(global.XinJianLog.list()));
        }
      } catch (e) {}
      return Promise.resolve(logListFallback());
    },
    logRead: function (name) {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.read === 'function') {
          return Promise.resolve(global.XinJianLog.read(String(name)) || '');
        }
      } catch (e) {}
      var data = logFiles();
      return Promise.resolve(data[name] ? String(data[name].text || '') : '');
    },
    logWrite: function (name, text) {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.write === 'function') {
          return global.XinJianLog.write(String(name), String(text == null ? '' : text)) === true;
        }
      } catch (e) { return false; }
      var data = logFiles();
      data[name] = { text: String(text == null ? '' : text), mtime: Date.now() };
      var names = Object.keys(data).sort(function (a, b) { return data[a].mtime - data[b].mtime; });
      while (names.length > 30) delete data[names.shift()];
      logSaveFiles(data);
      return true;
    },
    logRemove: function (name) {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.remove === 'function') {
          return global.XinJianLog.remove(String(name)) === true;
        }
      } catch (e) { return false; }
      var data = logFiles();
      if (!data[name]) return false;
      delete data[name];
      logSaveFiles(data);
      return true;
    },
    logClear: function () {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.clear === 'function') {
          return global.XinJianLog.clear() === true;
        }
      } catch (e) { return false; }
      logSaveFiles({});
      return true;
    },
    logSetMode: function (mode) {
      try { localStorage.setItem(LOG_MODE_KEY, mode); } catch (e) {}
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.setMode === 'function') {
          global.XinJianLog.setMode(String(mode));
        }
      } catch (e) {}
      return true;
    },
    logRequestStorage: function () {
      try {
        if (hasNative && global.XinJianLog && typeof global.XinJianLog.requestStorage === 'function') {
          return global.XinJianLog.requestStorage() === true;
        }
      } catch (e) {}
      return false;
    },

    /* 导出：代码版写到系统「下载/信笺代码版/」，否则触发浏览器下载 */
    exportOne: function (name, text) {
      if (hasNative && typeof global.XinJianBridge.export === 'function') {
        return callNative('export', name, text);
      }
      return Promise.resolve().then(function () {
        var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 800);
        return true;
      });
    }
  };

  global.Bridge = Bridge;
})(window);