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

  function attach(panel, onVisibility, stopButton, onIssue, onRunning) {
    var status = panel.querySelector('.run-status');
    var body = panel.querySelector('.run-body');
    var stopLabel = stopButton.querySelector('span');

    function setStop(label) {
      stopLabel.textContent = label || '停止';
      stopButton.disabled = !label;
      if (onRunning) onRunning(!!label);
    }
    function setStatus(label, stage) {
      status.textContent = label;
      status.dataset.stage = stage || '';
    }
    var worker, url, timer, terminal, outputView, generation = 0;
    var request, interactive, repeat, disposeWorker;
    var lastInput = '';
    var actions = panel.querySelector('.run-actions');
    var copy = actions.querySelector('.run-copy');
    var rerun = actions.querySelector('.run-repeat');

    function setVisible(visible) {
      if (panel.hidden === !visible) return;
      panel.hidden = !visible;
      onVisibility(visible);
    }

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
      var python = PythonRun.supported(ext);
      setStatus(RunFormats.compilers[ext].name);
      body.innerHTML = '<div class="run-online">' +
        '<label>标准输入（可留空）<textarea rows="2" placeholder="每行一组输入"></textarea></label>' +
        '<div class="run-submit-row"><button type="button" class="run-submit run-option-button"></button>' +
        '<span class="run-hint">源码和输入会发送至 wandbox.org。' +
        (python ? '请提前填写程序所需的输入。' : '') + '</span></div></div>';
      var input = body.querySelector('textarea');
      var submitError;
      input.value = lastInput;
      var submit = body.querySelector('.run-submit');
      submit.textContent = ext === 'bfh' ? '发送并检查' : '发送并运行';
      if (python) addPythonOption(input, readSource);
      else if (ext === 'c' || /^(cpp|cxx|cc|c\+\+)$/.test(ext)) addCOption(input, readSource, ext === 'c' ? 'c' : 'cpp');
      if (InteractiveRun.supported(ext)) addInteractiveOption(input, readSource, ext);
      submit.onclick = function () {
        var current = generation;
        lastInput = input.value;
        var data;
        var source = readSource();
        try { data = RunFormats.payload(ext, source, RunIO.stdin(lastInput)); }
        catch (e) {
          if (submitError) body.querySelector('pre').remove();
          submitError = RunIO.output(body);
          submitError.emit({ kind: 'stderr', text: e.message });
          setStatus('无法提交', 'failed');
          return;
        }
        showOutput();
        function result(label, message, ok) {
          if (generation !== current) return;
          stop();
          setStatus(label, ok ? 'success' : 'failed');
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
              var filenames = data.codes ? data.codes.map(function (file) { return file.file; }) :
                ext === 'java' ? ['prog.java'] : ext === 'cs' ? ['prog.cs'] : ext === 'c' ? ['prog.c'] :
                /^(?:cpp|cxx|cc|c\+\+)$/.test(ext) ? ['prog.cc', 'prog.cpp', 'prog.cxx'] : [];
              var issue = !ok && EditorDiagnostics.compilerIssue(r.compiler_error || r.compiler_message, filenames);
              if (!ok && python) {
                issue = EditorDiagnostics.runtimeIssue(r.program_error, 'prog.py') ||
                  EditorDiagnostics.runtimeIssue(r.program_error, 'main.py');
              }
              if (onIssue) onIssue(issue || null, source);
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
              result(ok ? (ext === 'bfh' ? '头文件编译通过' : '运行完成') : '编译或运行出错', detail, ok);
              if (!ok && python && /EOFError/.test(xhr.responseText)) {
                outputView.emit({ kind: 'stderr', text: '\n请补充标准输入，或选「本地运行」逐行输入。' });
              }
            } catch (e) { result('服务响应异常', e.message); }
          };
          setStop('取消等待');
          setStatus('正在等待编译结果…', 'compiling');
          xhr.send(JSON.stringify(data));
        } catch (e) { result('无法提交', e.message); }
      };
    }

    function addPythonOption(input, readSource) {
      var form = body.querySelector('.run-online');
      var options = document.createElement('details');
      options.className = 'run-python-options';
      options.innerHTML = '<summary>本地 Python</summary>' +
        '<div class="run-python-actions">' +
        '<button type="button" class="run-python run-option-button">本地运行</button>' +
        '<button type="button" class="run-python-batch run-option-button">预填运行</button></div>' +
        '<p class="run-hint"></p>' +
        '<label class="run-file-input">输入文件（可选）<input type="file" multiple></label>';
      var selected = options.querySelector('input');
      var run = options.querySelector('.run-python');
      var batch = options.querySelector('.run-python-batch');
      var online = form.querySelector('.run-submit');
      form.appendChild(options);
      options.open = true;
      var interactiveInput = PythonRun.nativeTerminal() || PythonRun.canShareInput() || typeof WebAssembly.Suspending === 'function';
      var hint = options.querySelector('.run-hint');
      hint.textContent = interactiveInput
        ? '本地运行时可逐行输入。'
        : 'input() 需要预填，交互可用 xinjian_terminal 的 await readline()。';
      function startPython(live) {
        var current = generation;
        var stdin, files;
        try {
          stdin = RunIO.stdin(input.value);
          files = PythonRun.readFiles(selected.files);
        } catch (e) { setStatus(e.message, 'failed'); return; }
        // 预填运行不接实时输入：标准输入空着又调 input()，跑起来只会 EOFError，先说一声（不拦，出错分支照样能测）
        if (!live && !stdin && /input\s*\(|readline\s*\(/.test(readSource())) {
          hint.textContent = '标准输入为空。现场输入请选择「本地运行」。';
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
          setStatus('读取输入文件失败', 'failed');
          online.disabled = run.disabled = batch.disabled = false;
        });
      }
      run.onclick = function () { startPython(true); };
      batch.onclick = function () { startPython(false); };
    }

    function addCOption(input, readSource, language) {
      var current = generation;
      var form = body.querySelector('.run-online');
      PythonRun.nativeCompilerAvailable(language).then(function (available) {
        if (!available || generation !== current || !form.isConnected) return;
        var options = document.createElement('div');
        options.className = 'run-c-options';
        options.innerHTML = '<button type="button" class="run-c run-option-button"></button>' +
          '<p class="run-hint">支持常见单文件控制台程序。</p>';
        options.querySelector('button').textContent = language === 'cpp' ? '本地运行 C++' : '本地运行 C';
        form.appendChild(options);
        options.querySelector('button').onclick = function () {
          var stdin;
          try { stdin = RunIO.stdin(input.value); }
          catch (error) { setStatus(error.message, 'failed'); return; }
          lastInput = stdin;
          repeat = function () {
            stop();
            var job = { language: language, source: readSource(), stdin: stdin, interactive: true };
            startWorker(PythonRun.spawn, job, language === 'cpp' ? 45000 : 20000, 7000, PythonRun.sendInput);
          };
          repeat();
        };
      });
    }

    function terminalForm(prompt, send, eof, cancel) {
      var form = terminal = document.createElement('form');
      form.className = 'run-terminal';
      form.innerHTML = '<label for="run-stdin"></label><input id="run-stdin" type="text" aria-label="终端输入" ' +
        'autocomplete="off" maxlength="65536"><button class="chip" type="submit">发送</button>' +
        (eof ? '<button class="chip run-eof" type="button">结束输入</button>' : '') +
        (cancel ? '<button class="chip run-cancel-input" type="button">取消输入</button>' : '');
      form.querySelector('label').textContent = prompt;
      var input = form.querySelector('input');
      function reply(atEnd) {
        if (terminal !== form) return;
        try {
          if (atEnd) eof();
          else {
            send(RunIO.stdin(input.value));
            input.value = '';
          }
        } catch (error) { setStatus(error.message, 'failed'); }
      }
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) event.preventDefault();
      });
      form.onsubmit = function (event) { event.preventDefault(); reply(false); };
      if (eof) form.querySelector('.run-eof').onclick = function () { reply(true); };
      if (cancel) form.querySelector('.run-cancel-input').onclick = cancel;
      panel.insertBefore(form, actions);
      if (eof) input.focus();
    }

    function addInteractiveOption(input, readSource, ext) {
      var options = document.createElement('details');
      options.className = 'run-interactive-options';
      options.innerHTML = '<summary>在线交互</summary>' +
        '<label>Piston 服务地址<input class="run-service-address" type="url" placeholder="wss://…" autocomplete="off"></label>' +
        '<button type="button" class="run-interactive-start run-option-button">连接并运行</button>' +
        '<p class="run-hint">源码和输入会发送到你设置的服务。</p>';
      body.querySelector('.run-online').appendChild(options);
      var address = options.querySelector('input');
      try { address.value = localStorage.getItem('xj-interactive-service') || ''; } catch (_) {}
      options.querySelector('button').onclick = function () {
        var endpoint, stdin;
        try {
          endpoint = InteractiveRun.endpoint(address.value);
          stdin = RunIO.stdin(input.value);
        } catch (error) { setStatus(error.message, 'failed'); return; }
        try { localStorage.setItem('xj-interactive-service', endpoint); } catch (_) {}
        lastInput = stdin;
        repeat = function () { startInteractive({ source: readSource(), ext: ext, endpoint: endpoint, stdin: stdin }); };
        repeat();
      };
    }

    function startInteractive(job) {
      stop();
      showOutput();
      delete panel.dataset.stdinMode;
      var current = generation;
      setStatus('正在连接…', 'initializing');
      setStop('取消等待');
      function finish(label, text, ok) {
        if (text) outputView.emit({ kind: 'stderr', text: text });
        stop();
        setStatus(label, ok ? 'success' : 'failed');
      }
      function timeout(delay) {
        clearTimeout(timer);
        timer = setTimeout(function () { finish('运行服务超时'); }, delay);
      }
      timeout(30000);
      try {
        interactive = InteractiveRun.connect(job, function (kind, value) {
          if (generation !== current) return;
          if (kind === 'compile') setStatus('正在编译…', 'compiling');
          else if (kind === 'ready') {
            setStatus('运行中，可输入', 'running');
            timeout(65000);
            terminalForm('输入一行并发送', function (text) {
              interactive.send(text);
              setStatus('运行中，可输入', 'running');
            });
          } else if (kind === 'exit') finish(value.ok ? '运行完成' : '运行出错', value.detail, value.ok);
          else if (kind === 'error') finish('运行出错', value.text);
          else outputView.emit({ kind: kind, text: value.text });
        });
      } catch (error) { finish('运行出错', error.message); }
    }

    function localResult(source, ext) {
      var pre = document.createElement('pre');
      var label = RunFormats.label(ext);
      if (label === '校验') {
        try {
          status.textContent = RunFormats.validate(ext, source);
          if (onIssue) onIssue(null, source);
        } catch (e) {
          status.textContent = '校验出错';
          pre.textContent = e.message;
          body.appendChild(pre);
          if (onIssue) onIssue(EditorDiagnostics.validationIssue(e, source, ext), source);
        }
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
      if (interactive) interactive.close();
      interactive = null;
      clearTimeout(timer);
      if (disposeWorker) disposeWorker();
      disposeWorker = null;
      if (worker) worker.terminate();
      if (url) URL.revokeObjectURL(url);
      worker = url = null;
      if (terminal) terminal.remove();
      terminal = null;
      setStop('');
      rerun.disabled = false;
    }
    function close() {
      stop();
      if (outputView) outputView.dispose();
      outputView = repeat = null;
      actions.hidden = true;
      delete panel.dataset.stdinMode;
      body.textContent = '';
      setVisible(false);
      setStatus('');
    }
    function start(readSource, name, ext) {
      close();
      setVisible(true);
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
      setStop('停止');
      setStatus('正在初始化环境…', 'initializing');
      delete panel.dataset.stdinMode;
      showOutput();
      var current = generation;
      var remaining = activeMs, deadline;
      var stderr = '', started = false;
      function finish(label, stage) { stop(); setStatus(label, stage || 'failed'); }
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
        setStatus('等待输入', 'input');
        if (deadline !== undefined) remaining = Math.max(0, deadline - performance.now());
        clearTimeout(timer);
        function send(text) {
          if (sendInput && (event.transport === 'shared' || event.transport === 'native')) sendInput(job, event, text);
          else worker.postMessage({ kind: 'stdin', id: event.id, text: text });
          terminal.remove();
          terminal = null;
          setStatus('运行中…', 'running');
          activeTimeout();
        }
        var prompt = typeof event.prompt === 'string' && event.prompt ? event.prompt.slice(0, 300) : '输入一行';
        terminalForm(prompt, send, function () { send(null); }, function () { finish('已取消输入', 'cancelled'); });
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
          else if (event.kind === 'compiling') setStatus('正在编译…', 'compiling');
          else if (event.kind === 'ready' && !terminal) {
            started = true;
            setStatus('运行中…', 'running');
            activeTimeout();
          }
          else if (event.kind === 'exit') {
            var issue = null;
            if (!event.ok) {
              if (job.language && !started) issue = EditorDiagnostics.compilerIssue(stderr, ['main.' + job.language]);
              else issue = EditorDiagnostics.runtimeIssue(stderr, job.name);
            }
            if (onIssue) onIssue(issue, job.source);
            finish(event.ok ? '运行完成' : '运行出错', event.ok ? 'success' : 'failed');
          } else {
            if (event.kind === 'stderr' && typeof event.text === 'string') stderr = (stderr + event.text).slice(-8192);
            outputView.emit(event);
          }
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
    return { start: start, close: close, cancel: function () {
      var remote = !!(request || interactive);
      stop();
      setStatus(remote ? '已取消等待' : '已停止', 'cancelled');
    } };
  }
  return { attach: attach };
})();
