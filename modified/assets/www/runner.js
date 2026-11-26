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
    var worker, url, timer, terminal, outputView, generation = 0;
    var request, repeat, disposeWorker;
    var lastInput = '';
    var actions = panel.querySelector('.run-actions');
    var copy = actions.querySelector('.run-copy');
    var rerun = actions.querySelector('.run-repeat');

    function showOutput() {
      if (outputView) outputView.dispose();
      body.textContent = '';
      outputView = RunIO.output(body);
      actions.hidden = false;
      rerun.hidden = !repeat;
      rerun.disabled = true;
    }

    function copyFallback(text) {
      var previous = document.activeElement;
      var field = document.createElement('textarea');
      field.value = text;
      field.readOnly = true;
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      panel.appendChild(field);
      try {
        field.select();
        return document.execCommand('copy');
      } catch (_) {
        return false;
      } finally {
        field.remove();
        if (previous && previous.isConnected) previous.focus();
      }
    }

    copy.onclick = function () {
      var text = outputView && outputView.text();
      if (!text) return toast('暂无可复制的文本');
      function notify(success) { toast(success ? '已复制结果' : '复制失败'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { notify(true); }, function () { notify(copyFallback(text)); });
      } else notify(copyFallback(text));
    };
    actions.querySelector('.run-clear').onclick = function () { if (outputView) outputView.clear(); };
    rerun.onclick = function () { if (repeat) repeat(); };
    function remoteForm(readSource, ext) {
      status.textContent = RunFormats.compilers[ext].name;
      var intro = PythonRun.supported(ext)
        ? '<p>提交后，当前源码和「标准输入」会发送到 wandbox.org 编译。这条路<b>只能预填</b>：程序里的 input() 从「标准输入」框按行取，框空着就会 EOFError；想边运行边输入，用下面的「本地运行」。</p>'
        : '<p>提交后，当前源码和标准输入将发送到 wandbox.org 编译。</p>';
      body.innerHTML = '<div class="run-online">' + intro +
        '<label>标准输入（可留空）<textarea rows="2" placeholder="每行一组输入"></textarea></label>' +
        '<button type="button" class="run-submit"></button></div>';
      var input = body.querySelector('textarea');
      var submitError;
      input.value = lastInput;
      var submit = body.querySelector('.run-submit');
      submit.textContent = ext === 'bfh' ? '发送并检查' : '发送并运行';
      if (PythonRun.supported(ext)) addPythonOption(input, readSource);
      submit.onclick = function () {
        var current = generation;
        lastInput = input.value;
        var data;
        try { data = RunFormats.payload(ext, readSource(), RunIO.stdin(lastInput)); }
        catch (e) {
          if (submitError) body.querySelector('pre').remove();
          submitError = RunIO.output(body);
          submitError.emit({ kind: 'stderr', text: e.message });
          status.textContent = '无法提交';
          return;
        }
        showOutput();
        function result(label, message) {
          if (generation !== current) return;
          stop();
          status.textContent = label;
          if (message) outputView.emit({ kind: 'stderr', text: message });
        }
        try {
          var xhr = request = new XMLHttpRequest();
          xhr.open('POST', 'https://wandbox.org/api/compile.json', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.timeout = 60000;
          xhr.onerror = function () { result('连接失败', '请检查网络或稍后重试。'); };
          xhr.ontimeout = function () { result('等待超时', '编译服务未在 60 秒内返回结果。'); };
          xhr.onprogress = function (event) {
            if (event.loaded > 1024 * 1024) result('输出超过上限', '编译服务的响应超过 1 MB，已结束等待。');
          };
          xhr.onload = function () {
            if (generation !== current) return;
            request = null;
            if (xhr.status !== 200) {
              result('编译服务不可用', 'HTTP ' + xhr.status);
              return;
            }
            try {
              if (xhr.responseText.length > 1024 * 1024) throw new Error('输出超过 1 MB');
              var r = JSON.parse(xhr.responseText);
              if (r.status == null && !r.signal) throw new Error('服务响应缺少退出状态');
              var ok = String(r.status) === '0' && !r.signal;
              var logged = false;
              ['compiler', 'program'].forEach(function (stage) {
                var normal = r[stage + '_output'];
                var error = r[stage + '_error'];
                if (!normal && !error) normal = r[stage + '_message'];
                if (!normal && !error) return;
                if (logged) outputView.emit({ kind: 'stdout', text: '\n' });
                outputView.emit({ kind: 'stdout', text: normal });
                outputView.emit({ kind: 'stderr', text: error });
                logged = true;
              });
              var detail = r.signal ? (logged ? '\n' : '') + r.signal : (!ok && !logged ? '退出状态 ' + r.status : '');
              result(ok ? (ext === 'bfh' ? '头文件编译通过' : '运行完成') : '编译或运行出错', detail);
              if (!ok && PythonRun.supported(ext) && /EOFError/.test(xhr.responseText)) {
                outputView.emit({ kind: 'stderr', text: '\n提示：程序要读输入，但「标准输入」是空的。两条路——① 在「标准输入」框里每行写一组输入再点发送；② 用下面的「本地运行」，程序跑到 input() 时现场逐行输入。' });
              }
            } catch (e) { result('服务响应异常', e.message); }
          };
          stopButton.textContent = '取消等待';
          stopButton.hidden = false;
          status.textContent = '正在等待编译结果…';
          xhr.send(JSON.stringify(data));
        } catch (e) { result('无法提交', e.message); }
      };
    }

    function addPythonOption(input, readSource) {
      var form = body.querySelector('.run-online');
      var options = document.createElement('details');
      options.className = 'run-python-options';
      options.innerHTML = '<summary>本地 Python · 运行中可输入</summary>' +
        '<label>选择输入文件（可选）<input type="file" multiple></label>' +
        '<button type="button" class="run-python">本地运行</button><button type="button" class="run-python-batch">预填运行</button>';
      var selected = options.querySelector('input');
      var run = options.querySelector('.run-python');
      var batch = options.querySelector('.run-python-batch');
      var online = form.querySelector('.run-submit');
      // 本地运行是能逐行输入的那条路，放在在线提交前面并默认展开，省得每次去翻。
      if (online) form.insertBefore(options, online);
      else form.appendChild(options);
      options.open = true;
      var interactiveInput = PythonRun.nativeTerminal() || PythonRun.canShareInput() || typeof WebAssembly.Suspending === 'function';
      var hint = document.createElement('p');
      hint.className = 'run-hint';
      hint.textContent = interactiveInput
        ? '点「本地运行」后，程序执行到 input() 会在下面弹出输入框：填一行发送一行，按「结束输入」相当于 Ctrl+D。'
        : '此 WebView 的 input() 使用预填输入。交互程序可用 from xinjian_terminal import readline 和 await readline()。';
      options.appendChild(hint);
      function startPython(live) {
        var current = generation;
        var stdin, files;
        try {
          stdin = RunIO.stdin(input.value);
          files = PythonRun.readFiles(selected.files);
        } catch (e) { status.textContent = e.message; return; }
        // 预填运行不接实时输入：标准输入空着又调 input()，跑起来只会 EOFError，先说一声（不拦，出错分支照样能测）
        if (!live && !stdin && /input\s*\(|readline\s*\(/.test(readSource())) {
          hint.textContent = '标准输入是空的，代码里又要读输入 → 这次会 EOFError。要现场输入请点「本地运行」。';
        }
        online.disabled = run.disabled = batch.disabled = true;
        files.then(function (inputs) {
          if (generation !== current) return;
          lastInput = stdin;
          repeat = function () {
            stop();
            var job = { source: readSource(), name: 'main.py', stdin: stdin, interactive: live, files: inputs };
            startWorker(PythonRun.spawn, job, 60000, 15000, PythonRun.sendInput);
          };
          repeat();
        }).catch(function () {
          if (generation !== current) return;
          status.textContent = '读取输入文件失败';
          online.disabled = run.disabled = batch.disabled = false;
        });
      }
      run.onclick = function () { startPython(true); };
      batch.onclick = function () { startPython(false); };
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
      if (disposeWorker) disposeWorker();
      disposeWorker = null;
      if (worker) worker.terminate();
      if (url) URL.revokeObjectURL(url);
      worker = url = null;
      if (terminal) terminal.remove();
      terminal = null;
      stopButton.hidden = true;
      rerun.disabled = false;
    }
    function close() {
      stop();
      if (outputView) outputView.dispose();
      outputView = repeat = null;
      actions.hidden = true;
      delete panel.dataset.stdinMode;
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
      repeat = function () { start(readSource, name, ext); };
      startWorker(function () {
        return engineSource().then(function (blob) {
          var url = URL.createObjectURL(blob);
          try { return { worker: new Worker(url), url: url }; }
          catch (e) { URL.revokeObjectURL(url); throw e; }
        });
      }, { source: source, name: name }, 7000, 7000);
    }

    function startWorker(spawn, job, startupMs, activeMs, sendInput) {
      stopButton.textContent = '停止';
      status.textContent = '运行中…';
      stopButton.hidden = false;
      delete panel.dataset.stdinMode;
      showOutput();
      var current = generation;
      var remaining = activeMs, deadline;
      function finish(label) { stop(); status.textContent = label; }
      function timeout(delay, label) {
        clearTimeout(timer);
        timer = setTimeout(function () { finish(label); }, delay);
      }
      function activeTimeout() {
        deadline = performance.now() + remaining;
        timeout(remaining, '运行超时，已停止');
      }
      function terminalInput(event) {
        if (terminal || !Number.isInteger(event.id) || event.id < 1) return;
        status.textContent = '等待输入';
        if (deadline !== undefined) remaining = Math.max(0, deadline - performance.now());
        clearTimeout(timer);
        var form = terminal = document.createElement('form');
        form.className = 'run-terminal';
        form.innerHTML = '<label for="run-stdin"></label><input id="run-stdin" type="text" aria-label="终端输入" ' +
          'autocomplete="off" maxlength="65536"><button class="chip" type="submit">发送</button>' +
          '<button class="chip run-eof" type="button">结束输入</button><button class="chip run-cancel-input" type="button">取消输入</button>';
        form.querySelector('label').textContent = typeof event.prompt === 'string' && event.prompt ? event.prompt.slice(0, 300) : '输入一行';
        var input = form.querySelector('input');
        function reply(eof) {
          if (terminal !== form || generation !== current) return;
          try {
            var text = eof ? null : RunIO.stdin(input.value);
            if (sendInput && (event.transport === 'shared' || event.transport === 'native')) sendInput(job, event, text);
            else worker.postMessage({ kind: 'stdin', id: event.id, text: text });
            terminal.remove();
            terminal = null;
            status.textContent = '运行中…';
            activeTimeout();
          } catch (e) { status.textContent = e.message; }
        }
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault();
        });
        form.onsubmit = function (e) { e.preventDefault(); reply(false); };
        form.querySelector('.run-eof').onclick = function () { reply(true); };
        form.querySelector('.run-cancel-input').onclick = function () { finish('已取消输入'); };
        panel.insertBefore(form, actions);
        input.focus();
      }
      timeout(startupMs, '运行超时，已停止');
      spawn(job, function () { return current === generation; }).then(function (instance) {
        if (current !== generation) {
          if (instance.dispose) instance.dispose();
          instance.worker.terminate();
          if (instance.url) URL.revokeObjectURL(instance.url);
          return;
        }
        worker = instance.worker;
        disposeWorker = instance.dispose;
        url = instance.url;
        worker.onmessage = function (e) {
          if (current !== generation || !e.data) return;
          var event = e.data;
          if (event.kind === 'input') terminalInput(event);
          else if (event.kind === 'stdin-mode') panel.dataset.stdinMode = event.mode;
          else if (event.kind === 'ready' && !terminal) activeTimeout();
          else if (event.kind === 'exit') finish(event.ok ? '运行完成' : '运行出错');
          else outputView.emit(event);
        };
        worker.onerror = function (e) {
          if (current !== generation) return;
          outputView.emit({ kind: 'stderr', text: e.message || '请检查 Android System WebView 是否支持 WebAssembly' });
          finish('运行出错');
        };
        worker.postMessage(job);
      }).catch(function (e) {
        if (current !== generation) return;
        outputView.emit({ kind: 'stderr', text: e.message });
        finish('运行出错');
      });
    }
    return { start: start, close: close, cancel: function () { var remote = !!request; stop(); status.textContent = remote ? '已取消等待' : '已停止'; } };
  }
  return { attach: attach };
})();
