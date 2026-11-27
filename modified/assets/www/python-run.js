var PythonRun = (function () {
  'use strict';

  var workerPath = 'python-worker.js';
  var nativeCompilers = {
    c: { name: 'C', engine: 'xcc' },
    cpp: { name: 'C++', engine: 'clang' }
  };

  function manifest(engine) { return 'python-runtime/' + engine + '/runtime.json'; }

  function nativeCompilerAvailable(language) {
    if (typeof Worker !== 'function' || typeof WebAssembly !== 'object') return Promise.resolve(false);
    return fetch(manifest(nativeCompilers[language].engine)).then(function (response) { return response.ok; }).catch(function () { return false; });
  }
  function policy() {
    var assets = new URL('python-runtime/', location.href).href;
    return "default-src 'none'; script-src 'wasm-unsafe-eval' " + assets + "; connect-src " + assets + "; worker-src 'none'";
  }

  function supported(ext) {
    return /^(py|pyw|python)$/.test(ext) && typeof Worker === 'function' && typeof WebAssembly === 'object';
  }

  function canShareInput() {
    return window.crossOriginIsolated === true && typeof SharedArrayBuffer === 'function' &&
      typeof Atomics.wait === 'function' && typeof Atomics.notify === 'function';
  }

  function nativeTerminal() {
    var bridge = window.XinJianPythonTerminal;
    return bridge && typeof bridge.open === 'function' && typeof bridge.send === 'function' &&
      typeof bridge.close === 'function' ? bridge : null;
  }

  function spawn(job, isCurrent) {
    var compiler = nativeCompilers[job.language];
    var name = compiler ? compiler.name : 'Python';
    return Promise.all([fetch(workerPath), fetch(compiler ? manifest(compiler.engine) : 'python-runtime/runtime.json')]).then(function (responses) {
      if (!responses[1].ok) throw new Error('此安装包未包含本地 ' + name + '，请使用在线运行');
      if (!responses[0].ok || responses[0].headers.get('Content-Security-Policy') !== policy()) {
        throw new Error('当前环境无法隔离本地 ' + name + '，请使用在线运行');
      }
      return responses[1].json();
    }).then(function (runtime) {
      var valid = compiler ? runtime.engine === compiler.engine && runtime.version === 1 : runtime.version === '0.29.3' && runtime.memoryMB === 256;
      if (!valid) throw new Error('本地 ' + name + ' 运行时版本不匹配');
      return new Promise(function (resolve, reject) {
        var worker = new Worker(workerPath);
        function fail() {
          clearTimeout(timer);
          worker.terminate();
          reject(new Error('无法启动本地 ' + name + ' Worker'));
        }
        var timer = setTimeout(fail, 5000);
        worker.onerror = fail;
        worker.onmessage = function (e) {
          if (!e.data || e.data.kind !== 'input-capabilities') return;
          clearTimeout(timer);
          job.channel = job.interactive && e.data.shared && canShareInput() ? new SharedArrayBuffer(8 + 65536) : null;
          var native = job.interactive && !job.channel && isCurrent() && nativeTerminal();
          if (native) {
            try { job.nativeToken = native.open(); }
            catch (_) { /* Use Pyodide's other input modes if the app service is unavailable. */ }
          }
          var session = job.nativeToken;
          resolve({
            worker: worker,
            dispose: session ? function () { native.close(session); } : null
          });
        };
      });
    });
  }

  function syntaxSession(report) {
    var worker, pending, active, timer, ready = false, closed = false;

    function close() {
      closed = true;
      clearTimeout(timer);
      if (worker) worker.terminate();
      worker = pending = active = null;
    }

    function sendPending() {
      if (!ready || active || !pending) return;
      active = pending;
      pending = null;
      timer = setTimeout(close, 5000);
      worker.postMessage(active);
    }

    timer = setTimeout(close, 20000);
    spawn({}, function () { return !closed; }).then(function (instance) {
      if (closed) { instance.worker.terminate(); return; }
      worker = instance.worker;
      worker.onerror = close;
      worker.onmessage = function (event) {
        var data = event.data || {};
        if (data.kind === 'exit') { close(); return; }
        if (data.kind === 'syntax-ready') {
          clearTimeout(timer);
          ready = true;
        } else if (data.kind === 'syntax-result' && active && data.id === active.id) {
          clearTimeout(timer);
          active = null;
          report(data.id, data.issue);
        }
        sendPending();
      };
      worker.postMessage({ kind: 'syntax-session' });
    }, close);
    return {
      check: function (id, source) {
        if (closed) return;
        pending = { kind: 'syntax-check', id: id, source: source };
        sendPending();
      },
      close: close
    };
  }

  function sendInput(job, event, text) {
    if (event.transport === 'native') {
      var native = nativeTerminal();
      if (!native || !native.send(job.nativeToken, event.number, text === null ? '' : text, text === null)) {
        throw new Error('无法发送输入，请停止后重试');
      }
      return;
    }
    var header = new Int32Array(job.channel, 0, 2);
    var bytes = text === null ? null : new TextEncoder().encode(text);
    if (bytes) new Uint8Array(job.channel, 8).set(bytes);
    Atomics.store(header, 1, bytes ? bytes.length : -1);
    Atomics.store(header, 0, 1);
    Atomics.notify(header, 0);
  }

  function readFiles(files) {
    var total = 0, names = Object.create(null);
    var inputs = Array.from(files);
    if (inputs.length > 4) throw new Error('每次最多选择 4 个输入文件');
    inputs.forEach(function (file) {
      total += file.size;
      if (total > RunIO.fileLimit) throw new Error('输入文件合计不能超过 4 MB');
      if (!RunIO.filename(file.name) || names[file.name]) throw new Error('请使用有效且互不重复的文件名');
      names[file.name] = true;
    });
    return Promise.all(inputs.map(function (file) {
      return file.arrayBuffer().then(function (data) { return { name: file.name, data: data }; });
    }));
  }

  return { supported: supported, nativeCompilerAvailable: nativeCompilerAvailable, spawn: spawn, canShareInput: canShareInput, nativeTerminal: nativeTerminal, syntaxSession: syntaxSession, sendInput: sendInput, readFiles: readFiles };
})();
