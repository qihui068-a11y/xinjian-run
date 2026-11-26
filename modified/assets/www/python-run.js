var PythonRun = (function () {
  'use strict';

  var workerPath = 'python-worker.js';
  function policy() {
    var assets = new URL('python-runtime/', location.href).href;
    return "default-src 'none'; script-src 'wasm-unsafe-eval' " + assets + "; connect-src " + assets + "; worker-src 'none'";
  }

  function supported(ext) {
    return /^(py|pyw|python)$/.test(ext) && typeof Worker === 'function' && typeof WebAssembly === 'object';
  }

  function spawn() {
    return Promise.all([fetch(workerPath), fetch('python-runtime/runtime.json')]).then(function (responses) {
      if (!responses[1].ok) throw new Error('此安装包未包含本地 Python，请使用在线运行');
      if (!responses[0].ok || responses[0].headers.get('Content-Security-Policy') !== policy()) {
        throw new Error('当前环境无法隔离本地 Python，请使用在线运行');
      }
      return responses[1].json();
    }).then(function (runtime) {
      if (runtime.version !== '0.29.3' || runtime.memoryMB !== 256) throw new Error('本地 Python 运行时版本不匹配');
      return { worker: new Worker(workerPath) };
    });
  }

  function channel() {
    return window.crossOriginIsolated && typeof SharedArrayBuffer === 'function' ? new SharedArrayBuffer(8 + 65536) : null;
  }

  function sendInput(job, text) {
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

  return { supported: supported, spawn: spawn, channel: channel, sendInput: sendInput, readFiles: readFiles };
})();
