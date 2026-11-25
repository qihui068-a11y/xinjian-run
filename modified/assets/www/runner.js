/* 单文件运行与预览。用户脚本只交给 Worker 内的 QuickJS。 */
var CodeRunner = (function () {
  'use strict';
  var loading;
  function engineSource() {
    if (!loading) loading = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      function fail() {
        loading = null;
        reject(new Error('无法加载运行引擎，请更新 Android System WebView 后重试'));
      }
      script.onload = function () {
        if (typeof xjWorkerMain !== 'function') return fail();
        resolve(new Blob(['(', String(xjWorkerMain), ')()'], { type: 'text/javascript' }));
      };
      script.onerror = fail;
      script.src = 'quickjs-worker.js';
      document.head.appendChild(script);
    });
    return loading;
  }

  function preview(source) {
    // 在没有浏览上下文的文档中处理源码，再放进禁用脚本的沙盒。
    var doc = document.implementation.createHTMLDocument('');
    doc.documentElement.innerHTML = source;
    var blocked = 'script,iframe,frame,frameset,object,embed,base,meta,link,template,noscript';
    Array.prototype.forEach.call(doc.querySelectorAll('*'), function (node) {
      if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml' || node.matches(blocked)) {
        node.remove();
        return;
      }
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        var key = attr.name.toLowerCase();
        if (key === 'src' && node.localName === 'img' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(attr.value)) return;
        if (/^on|^(href|src|srcset|background|action|formaction|ping|poster|target|is|contenteditable|autofocus)$/.test(key))
          node.removeAttribute(attr.name);
      });
    });
    var policy = doc.createElement('meta');
    policy.httpEquiv = 'Content-Security-Policy';
    policy.content = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'";
    doc.head.insertBefore(policy, doc.head.firstChild);
    var frame = document.createElement('iframe');
    frame.setAttribute('sandbox', '');
    frame.title = 'HTML 静态预览';
    frame.srcdoc = '<!doctype html>' + doc.documentElement.outerHTML;
    return frame;
  }

  function attach(panel) {
    var status = panel.querySelector('.run-status');
    var body = panel.querySelector('.run-body');
    var stopButton = panel.querySelector('[data-act="stop"]');
    var worker, url, timer, generation = 0;
    var request;
    var lastInput = '';
    function remoteForm(readSource, ext) {
      status.textContent = RunFormats.compilers[ext].name;
      body.innerHTML = '<div class="run-online"><p>提交后，当前源码和标准输入将发送到 wandbox.org 编译。</p>' +
        '<label>标准输入（可留空）<textarea rows="2" placeholder="每行一组输入"></textarea></label>' +
        '<button type="button" class="run-submit"></button></div>';
      var input = body.querySelector('textarea');
      input.value = lastInput;
      var submit = body.querySelector('.run-submit');
      submit.textContent = ext === 'bfh' ? '发送并检查' : '发送并运行';
      submit.onclick = function () {
        var output = document.createElement('pre');
        var current = generation;
        lastInput = input.value;
        body.textContent = '';
        body.appendChild(output);
        function result(label, text) {
          if (generation !== current) return;
          request = null;
          stop();
          status.textContent = label;
          output.textContent = text || '';
        }
        try {
          var data = RunFormats.payload(ext, readSource(), lastInput);
          var xhr = request = new XMLHttpRequest();
          xhr.open('POST', 'https://wandbox.org/api/compile.json', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.timeout = 60000;
          xhr.onerror = function () { result('连接失败', '请检查网络或稍后重试。'); };
          xhr.ontimeout = function () { result('等待超时', '编译服务未在 60 秒内返回结果。'); };
          xhr.onload = function () {
            if (xhr.status !== 200) {
              result('编译服务不可用', 'HTTP ' + xhr.status);
              return;
            }
            try {
              var r = JSON.parse(xhr.responseText);
              if (r.status == null && !r.signal) throw new Error('服务响应缺少退出状态');
              var log = [r.compiler_message || (r.compiler_output || '') + (r.compiler_error || ''),
                r.program_message || (r.program_output || '') + (r.program_error || '')].filter(Boolean).join('\n');
              var ok = String(r.status) === '0' && !r.signal;
              if (r.signal) log += '\n' + r.signal;
              if (log.length > 65536) log = log.slice(0, 65536) + '\n（输出已截断）';
              result(ok ? (ext === 'bfh' ? '头文件编译通过' : '运行完成') : '编译或运行出错', log || (ok ? '' : '退出状态 ' + r.status));
            } catch (e) { result('服务响应异常', e.message); }
          };
          stopButton.textContent = '取消等待';
          stopButton.hidden = false;
          status.textContent = '正在等待编译结果…';
          xhr.send(JSON.stringify(data));
        } catch (e) { result('无法提交', e.message); }
      };
    }

    function localResult(source, ext) {
      var pre = document.createElement('pre');
      var label = RunFormats.label(ext);
      if (label === '校验') {
        try { status.textContent = RunFormats.validate(ext, source); }
        catch (e) { status.textContent = '校验出错'; pre.textContent = e.message; body.appendChild(pre); }
        return;
      }
      if (ext === 'txt') {
        status.textContent = '文本预览';
        pre.textContent = source;
        body.appendChild(pre);
        return;
      }
      if (ext === 'md') {
        status.textContent = 'Markdown 预览';
        body.appendChild(preview(MD.render(source)));
      } else if (ext === 'css') {
        status.textContent = 'CSS 预览 · 示例页面';
        var sample = '<main class="container"><article class="card"><h1>标题</h1><p>段落文字</p><button class="btn">按钮</button></article></main>';
        body.appendChild(preview('<style>' + source.replace(/<\/style/gi, '<\\/style') + '</style>' + sample));
      } else {
        status.textContent = 'HTML 静态预览';
        body.appendChild(preview(source));
      }
    }

    function stop() {
      generation++;
      if (request) request.abort();
      request = null;
      clearTimeout(timer);
      if (worker) worker.terminate();
      if (url) URL.revokeObjectURL(url);
      worker = url = null;
      stopButton.hidden = true;
    }
    function close() {
      stop();
      body.textContent = '';
      panel.hidden = true;
    }
    function start(readSource, name, ext) {
      close();
      panel.hidden = false;
      if (RunFormats.compilers[ext]) return remoteForm(readSource, ext);
      var source = readSource();
      if (RunFormats.label(ext) !== '运行') {
        localResult(source, ext);
        return;
      }
      stopButton.textContent = '停止';
      status.textContent = '运行中…';
      stopButton.hidden = false;
      var output = document.createElement('pre');
      body.appendChild(output);
      var current = generation;
      function finish(label) { stop(); status.textContent = label; }
      function line(s) { output.appendChild(document.createTextNode(s + '\n')); body.scrollTop = body.scrollHeight; }
      engineSource().then(function (blob) {
        if (current !== generation) return;
        url = URL.createObjectURL(blob);
        worker = new Worker(url);
        worker.onmessage = function (e) {
          if (current !== generation) return;
          if (typeof e.data.line === 'string') line(e.data.line);
          if (e.data.status) finish(e.data.status);
        };
        worker.onerror = function (e) {
          if (current !== generation) return;
          line(e.message || '请检查 Android System WebView 是否支持 WebAssembly');
          finish('运行出错');
        };
        timer = setTimeout(function () { finish('运行超时，已停止'); }, 7000);
        worker.postMessage({ source: source, name: name });
      }).catch(function (e) {
        if (current !== generation) return;
        line(e.message);
        finish('运行出错');
      });
    }
    return { start: start, close: close, cancel: function () { var remote = !!request; stop(); status.textContent = remote ? '已取消等待' : '已停止'; } };
  }
  return { attach: attach };
})();
