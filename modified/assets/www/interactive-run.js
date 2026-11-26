/* Interactive WebSocket adapter for a user-configured Piston service. */
var InteractiveRun = (function () {
  'use strict';

  var languages = {
    cpp: { language: 'c++', filename: 'main.cpp' },
    java: { language: 'java', filename: 'Main' },
    cs: { language: 'csharp', filename: 'Program.cs' }
  };
  var limit = 65536;
  var memory = 512 * 1024 * 1024;

  function language(ext) {
    return /^(cpp|cxx|cc|c\+\+)$/.test(ext) ? languages.cpp : languages[ext];
  }

  function endpoint(value) {
    var address;
    try { address = new URL(value.trim()); }
    catch (_) { throw new Error('请输入 WebSocket 服务地址'); }
    var local = address.protocol === 'ws:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(address.hostname) &&
      /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    if ((!local && address.protocol !== 'wss:') || address.username || address.password || address.search || address.hash) {
      throw new Error('请使用不含账号或参数的 wss:// 服务地址');
    }
    if (address.pathname === '/') address.pathname = '/api/v2/connect';
    return address.href;
  }

  function connect(job, emit) {
    var runtime = language(job.ext);
    if (new Blob([job.source]).size > 256 * 1024) throw new Error('源码不能超过 256 KB');
    var socket = new WebSocket(job.endpoint);
    var done = false, live = false, remaining = limit;

    function finish(kind, fields) {
      if (done) return;
      done = true;
      emit(kind, fields);
    }

    function send(text) {
      if (!live || done || socket.readyState !== WebSocket.OPEN) throw new Error('运行会话已结束');
      if (socket.bufferedAmount > limit) throw new Error('输入仍在发送，请稍后重试');
      socket.send(JSON.stringify({ type: 'data', stream: 'stdin', data: text }));
    }

    socket.onopen = function () {
      if (done) return;
      socket.send(JSON.stringify({
        type: 'init',
        language: runtime.language,
        version: '*',
        files: [{ name: runtime.filename, content: job.source }],
        run_timeout: 60000,
        compile_memory_limit: memory,
        run_memory_limit: memory
      }));
    };
    socket.onmessage = function (message) {
      if (done) return;
      if (typeof message.data !== 'string' || message.data.length > limit * 2) {
        return finish('error', { text: '运行服务返回的消息过大或格式不受支持' });
      }
      var event;
      try { event = JSON.parse(message.data); }
      catch (_) { return finish('error', { text: '运行服务返回了无效消息' }); }
      if (!event || typeof event !== 'object') return finish('error', { text: '运行服务返回了无效消息' });
      if (event.type === 'data' && (event.stream === 'stdout' || event.stream === 'stderr') && typeof event.data === 'string') {
        var text = event.data.slice(0, remaining);
        remaining -= text.length;
        if (text) emit(event.stream, { text: text });
        if (remaining === 0) finish('error', { text: '输出已超过上限' });
      } else if (event.type === 'stage' && event.stage === 'compile') {
        emit('compile');
      } else if (event.type === 'stage' && event.stage === 'run' && !live) {
        live = true;
        try {
          if (job.stdin) send(job.stdin.endsWith('\n') ? job.stdin : job.stdin + '\n');
        } catch (error) { return finish('error', { text: error.message }); }
        emit('ready');
      } else if (event.type === 'exit') {
        var ok = event.code != null && String(event.code) === '0' && !event.signal && !event.status && !event.error;
        if (event.stage === 'run' || (event.stage === 'compile' && !ok)) {
          var detail = event.message || event.error || event.signal || '';
          finish('exit', { ok: ok, detail: typeof detail === 'string' ? detail.slice(0, 2000) : '运行服务报错' });
        }
      } else if (event.type === 'error') {
        finish('error', { text: typeof event.message === 'string' ? event.message.slice(0, 2000) : '运行服务报错' });
      }
    };
    socket.onerror = function () { finish('error', { text: '连接交互运行服务失败' }); };
    socket.onclose = function () { finish('error', { text: '运行服务已断开' }); };
    return {
      send: function (line) { send(line + '\n'); },
      close: function () {
        done = true;
        socket.close();
      }
    };
  }

  return { supported: function (ext) { return !!language(ext) && typeof WebSocket === 'function'; },
    endpoint: endpoint, connect: connect };
})();
