/* 信笺 · 视图：编辑器（代码实时高亮 / .md 阅读态渲染 / 字数 / 目录） */
'use strict';



  var openEditorFiles = [];

  /* ================= 视图：编辑器 ================= */
  VIEWS.editor = function (el, p) {
    el.classList.add('editor-view', 'ide-view');
    var name = p.name;
    var mode = p.mode || 'read';
    var ext = Bridge.extOf(name);
    var plain = ['txt', 'md'].indexOf(ext) >= 0;
    var text = '';
    var dirty = false;
    var timer = null;
    var showGutter = true;
    var loaded = false;
    var leaving = false;
    var disposed = false;
    var expanded = false;
    var running = false, cancelRunMorph, cancelSaveMorph, saveFeedbackTimer;
    var playPoints = '7,4 20,12 20,12 7,20';
    var stopPoints = '5,5 19,5 19,19 5,19';
    var diskPoints = '5,5 18,5 18,19 5,19 5,5';
    var checkPoints = '5,12 10,17 19,7 19,7 19,7';

    el.innerHTML =
      '<header class="workspace-heading ide-heading"><h1>信笺</h1>' +
      '<span class="ide-saved" role="status" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="' +
      diskPoints + '"/></svg>已保存</span><div class="workspace-actions">' +
      '<button type="button" class="icon-btn" data-act="find" aria-label="在文件中查找">' + svg('search') + '</button>' +
      '<button type="button" class="icon-btn" data-act="newFile" aria-label="新建文件">' + svg('plus') + '</button>' +
      '<button type="button" class="icon-btn" data-act="openFile" aria-label="打开书架文件">' + svg('more') + '</button></div></header>' +
      '<div class="ide-tabs" role="group" aria-label="已打开的文件"></div>' +
      '<div class="editor-workspace"><div class="editor-code-card">' +
      '<div class="topbar editor-bar" id="edBar"></div><div class="editor-wrap">' +
      '<div class="gutter"><div class="gutter-inner" id="gin"></div></div>' +
      '<div class="code-area' + (plain ? ' plain' : '') + '" id="ca">' +
      '<span class="editor-error-line" aria-hidden="true" hidden></span>' +
      '<pre id="pre" aria-hidden="true"></pre><textarea id="ta" aria-label="文本编辑区" ' +
      'spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" ' +
      'wrap="' + (plain ? 'soft' : 'off') + '"></textarea>' +
      '</div></div><div class="md-view hidden" id="mdView"></div>' +
      '<button type="button" class="editor-diagnostic" data-act="diagnostic" hidden><span aria-live="polite"></span></button>' +
      '<div class="editor-completion" role="listbox" aria-label="代码补全" hidden></div>' +
      '<div class="editor-symbols" role="group" aria-label="常用符号" hidden>' +
      '<div class="editor-symbol-list"></div>' +
      '<button type="button" class="indent-key" data-act="indent" aria-label="插入缩进">Tab</button>' +
      '<button type="button" data-act="manageSymbols" aria-label="添加或管理符号" title="添加或管理符号">' +
      svg('more') + '</button></div></div>' +
      '<div class="ide-run-tools" hidden>' +
      '<button type="button" class="ide-run" data-act="run"><svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<polygon points="' + playPoints + '"/></svg><span>运行</span></button>' +
      '<button type="button" data-act="stop" disabled>' + svg('stop') + '<span>停止</span></button>' +
      '<button type="button" data-act="runConfig">' + svg('terminal') + '<span>运行配置</span></button></div>' +
      '<section class="ide-output-idle" aria-label="运行结果"><strong>' + svg('terminal') + '运行结果</strong><p>等待运行</p></section>' +
      '<section class="run-panel" hidden>' +
      '<div class="run-resize" tabindex="0" role="separator" aria-orientation="horizontal" aria-label="调整运行面板高度" aria-valuemin="20" aria-valuemax="82" aria-valuenow="45"></div>' +
      '<div class="run-bar"><strong class="ide-output-title">' + svg('terminal') + '运行结果</strong>' +
      '<span class="run-status" role="status"></span>' +
      '<button type="button" data-act="closeRun">关闭</button></div>' +
      '<div class="run-body"></div><div class="run-actions" hidden>' +
      '<button type="button" class="run-clear" aria-label="清空终端">' + svg('trash') + '</button>' +
      '<button type="button" class="run-copy" aria-label="复制结果">' + svg('copy') + '</button>' +
      '<button type="button" data-act="expandRun" aria-label="放大结果区">' + svg('expand') + '</button>' +
      '<button type="button" class="run-repeat" hidden>重新运行</button></div></section></div>' +
      '<div class="statusbar"><span id="stPos">1:1</span><span id="stWords">0 字</span>' +
      '<span class="sp" id="stEnc">' + esc(p.enc || 'UTF-8') + '</span><span id="stSyn">' +
      esc(languageLabel()) + '</span></div>';

    var bar = el.querySelector('#edBar');
    var ta = el.querySelector('#ta');
    var pre = el.querySelector('#pre');
    var gin = el.querySelector('#gin');
    var ca = el.querySelector('#ca');
    var wrap = el.querySelector('.editor-wrap');
    var mdView = el.querySelector('#mdView');
    var symbols = el.querySelector('.editor-symbols');
    var symbolList = symbols.querySelector('.editor-symbol-list');
    var symbolsExt;
    var composing = false;
    var issue = null;
    var errorLine = el.querySelector('.editor-error-line');
    var errorHint = el.querySelector('.editor-diagnostic');
    var diagnostics = EditorDiagnostics.attach(showIssue);
    var completion = EditorCompletion.attach(ta, el.querySelector('.editor-completion'), function (value, start, end, caret) {
      replaceRange(value, start, end, caret, caret);
    });
    var isMd = (ext === 'md');

    var tabList = el.querySelector('.ide-tabs');
    var runTools = el.querySelector('.ide-run-tools');
    var runControl = el.querySelector('[data-act="run"]');
    var runShape = runControl.querySelector('polygon');
    var saveFeedback = el.querySelector('.ide-saved');
    var saveShape = saveFeedback.querySelector('polyline');
    var stopControl = el.querySelector('[data-act="stop"]');
    var configControl = el.querySelector('[data-act="runConfig"]');
    var panel = el.querySelector('.run-panel');
    var outputIdle = el.querySelector('.ide-output-idle');
    var runner = CodeRunner.attach(panel, function (visible) {
      el.classList.toggle('editor-run-open', visible);
      outputIdle.hidden = visible || !RunFormats.label(ext);
      if (!visible) {
        expanded = false;
        el.classList.remove('ide-output-expanded');
        panel.querySelector('[data-act="expandRun"]').setAttribute('aria-label', '放大结果区');
      }
      if (visible) {
        diagnostics.pause();
        completion.hide();
      } else if (!issue) checkSyntax();
      paintSymbols();
    }, stopControl, function (result, source) {
      if (!disposed && source === ta.value) showIssue(result);
    }, function (active) {
      if (active === running) return;
      running = active;
      if (cancelRunMorph) cancelRunMorph();
      cancelRunMorph = Motion.morph(runShape, active ? stopPoints : playPoints, 210);
      runControl.querySelector('span').textContent = active ? '停止' : '运行';
      runControl.setAttribute('aria-label', active ? '停止运行' : RunFormats.label(ext) || '运行');
    });
    var grip = panel.querySelector('.run-resize');
    var workspace = panel.parentElement;
    var drag;
    var scale = 1;
    var pinch;

    function resizePanel(percent) {
      var size = Math.max(20, Math.min(82, Math.round(percent)));
      panel.style.setProperty('--run-size', size + '%');
      grip.setAttribute('aria-valuenow', size);
    }

    grip.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || drag || !workspace.clientHeight) return;
      e.preventDefault();
      drag = { id: e.pointerId, top: e.clientY, height: panel.offsetHeight };
      grip.setPointerCapture(e.pointerId);
    });
    grip.addEventListener('pointermove', function (e) {
      if (!drag || drag.id !== e.pointerId || !workspace.clientHeight) return;
      resizePanel(100 * (drag.height + drag.top - e.clientY) / workspace.clientHeight);
    });
    grip.addEventListener('lostpointercapture', function (e) {
      if (drag && drag.id === e.pointerId) drag = null;
    });
    grip.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      resizePanel(100 * panel.offsetHeight / workspace.clientHeight + (e.key === 'ArrowUp' ? 5 : -5));
    });

    function zoomCode(next, clientX, clientY) {
      next = Math.max(.65, Math.min(2.4, next));
      if (next === scale) return;
      var rect = ta.getBoundingClientRect();
      var x = Math.max(0, clientX - rect.left), y = Math.max(0, clientY - rect.top);
      var left = (ta.scrollLeft + x) * next / scale - x;
      var top = (ta.scrollTop + y) * next / scale - y;
      scale = next;
      wrap.style.setProperty('--editor-font-size', (14 * scale) + 'px');
      ta.scrollLeft = left;
      ta.scrollTop = top;
      syncScroll();
    }

    function touchDistance(touches) {
      return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    }

    wrap.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 2 || !wrap.contains(e.touches[0].target) || !wrap.contains(e.touches[1].target)) return;
      var distance = touchDistance(e.touches);
      if (!distance) return;
      pinch = { distance: distance, scale: scale };
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    wrap.addEventListener('touchmove', function (e) {
      if (!pinch) return;
      if (e.cancelable) e.preventDefault();
      if (e.touches.length !== 2) return;
      var a = e.touches[0], b = e.touches[1];
      zoomCode(pinch.scale * touchDistance(e.touches) / pinch.distance,
        (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    }, { passive: false });
    wrap.addEventListener('touchend', function (e) {
      if (!pinch) return;
      if (e.cancelable) e.preventDefault();
      if (!e.touches.length) pinch = null;
    }, { passive: false });
    wrap.addEventListener('touchcancel', function () { pinch = null; });
    wrap.addEventListener('wheel', function (e) {
      if (!e.ctrlKey || !e.deltaY) return;
      e.preventDefault();
      zoomCode(scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX, e.clientY);
    }, { passive: false });
    function paintBar() {
      var label = RunFormats.label(ext);
      var format = mode === 'edit' && EditorTools.canFormat(ext)
        ? '<button type="button" class="t-text" data-act="format">格式化</button>' : '';
      runTools.hidden = !label;
      outputIdle.hidden = !label || !panel.hidden;
      runControl.setAttribute('aria-label', running ? '停止运行' : label || '运行');
      configControl.hidden = !label;
      var version = languageLabel() + (languageLabel() === 'Python' ? ' 3' : '');
      var title = mode === 'edit'
        ? '<button type="button" class="t-title" data-act="rename" aria-label="重命名文件">' + esc(name) + '</button>'
        : '<div class="t-title">' + esc(name) + '</div>';
      var editing = mode === 'edit'
        ? '<button type="button" class="icon-btn ide-history" data-act="undo" aria-label="撤销">' + svg('undo') + '</button>' +
          '<button type="button" class="icon-btn ide-history" data-act="redo" aria-label="重做">' + svg('redo') + '</button>' +
          '<button type="button" class="t-text" data-act="done">完成</button>'
        : '<button type="button" class="icon-btn" data-act="edit" aria-label="编辑">' + svg('pencil') + '</button>';
      bar.innerHTML = '<button type="button" class="icon-btn" data-act="leave" aria-label="返回">' + svg('back') +
        '</button>' + title + '<span class="ide-language">' + esc(version) + '</span>' +
        format + editing + '<button type="button" class="icon-btn" data-act="menu" aria-label="文件操作">' + svg('more') + '</button>';
    }

    function paintTabs() {
      tabList.innerHTML = openEditorFiles.map(function (file) {
        return '<div class="ide-tab' + (file === name ? ' current' : '') + '">' +
          '<button type="button" data-act="fileTab" data-file="' + esc(file) + '" aria-pressed="' + (file === name) + '">' +
          esc(file) + '</button><button type="button" data-act="closeFileTab" data-file="' + esc(file) +
          '" aria-label="关闭 ' + esc(file) + '">×</button></div>';
      }).join('');
    }

    function focusEditor() {
      if (!disposed && document.activeElement !== ta) ta.focus({ preventScroll: true });
    }

    function leaveWorkspace(continuation) {
      if (!loaded || leaving) return;
      if (!stopControl.disabled) return toast('请先停止当前运行');
      leaving = true;
      (dirty ? save(true) : Promise.resolve(true)).then(function (ok) {
        leaving = false;
        if (ok && !dirty && !disposed) continuation();
      });
    }

    el.__leaveForTab = leaveWorkspace;

    function switchFile(file) {
      var entry = Nav.stack[Nav.stack.length - 1];
      entry.params = { name: file, mode: mode };
      Nav.render();
    }

    function chooseFile() {
      Bridge.list().then(function (files) {
        var choices = files.filter(function (file) { return file.name !== name; }).map(function (file) {
          return { label: file.name, value: file.name };
        });
        if (!choices.length) return toast('书架没有其他文件');
        sheet('打开书架文件', choices).then(function (file) {
          if (file) leaveWorkspace(function () { switchFile(file); });
        });
      });
    }

    function findText() {
      inputBox('在文件中查找', '', '输入要查找的内容').then(function (query) {
        if (!query || disposed) return;
        var start = ta.value.indexOf(query, ta.selectionEnd);
        if (start < 0) start = ta.value.indexOf(query);
        if (start < 0) return toast('未找到匹配内容');
        focusEditor();
        ta.setSelectionRange(start, start + query.length);
        var line = ta.value.slice(0, start).split('\n').length - 1;
        ta.scrollTop = Math.max(0, (line - 2) * (parseFloat(getComputedStyle(ta).lineHeight) || 21));
        syncScroll();
        updateStatus();
      });
    }

    function paintSymbols(refresh) {
      symbols.hidden = mode !== 'edit' || !panel.hidden;
      if (symbols.hidden || (!refresh && symbolsExt === ext)) return;
      var scrollLeft = symbolsExt === ext ? symbolList.scrollLeft : 0;
      symbolsExt = ext;
      symbolList.textContent = '';
      EditorTools.keys(ext).forEach(function (key) {
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.act = 'symbol';
        button.dataset.key = key;
        button.textContent = key;
        button.setAttribute('aria-label', '插入 ' + key.trim());
        button.title = key;
        symbolList.appendChild(button);
      });
      symbolList.scrollLeft = scrollLeft;
    }

    function manageSymbols() {
      var currentExt = ext;
      var language = languageLabel();
      var custom = EditorTools.customKeys(currentExt);
      var options = [{ label: '添加符号', value: { add: true } }];
      custom.forEach(function (key) {
        options.push({ label: '移除 ' + key, value: { key: key } });
      });
      var choice = custom.length ? sheet(language + ' 自定义符号', options) : Promise.resolve(options[0].value);
      choice.then(function (action) {
        if (!action) return;
        if (!action.add) return update(action.key, false);
        return inputBox('添加 ' + language + ' 符号', '', '例如  &&  或  →', true).then(function (key) {
          if (key !== null) update(key, true);
        });
      });

      function update(key, add) {
        if (mode !== 'edit' || ext !== currentExt || !document.body.contains(el)) return;
        try { EditorTools.changeKey(currentExt, key, add); }
        catch (error) { toast(error.message); return; }
        paintSymbols(true);
        if (add) symbolList.scrollLeft = symbolList.scrollWidth;
        toast(add ? '已添加符号' : '已移除符号');
      }
    }

    function canComplete() {
      return loaded && !disposed && mode === 'edit' && !plain && !composing && panel.hidden;
    }

    function textChanged(event) {
      if (canComplete() && event && !event.isComposing &&
          /^(?:insertText|insertReplacementText|insertFromComposition|deleteContentBackward|deleteContentForward)$/.test(event.inputType)) {
        completion.request(false);
      } else completion.hide();
      dirty = true;
      showIssue(null);
      checkSyntax();
      scheduleHL();
      updateStatus();
    }

    function replaceRange(value, start, end, selectionStart, selectionEnd, direction) {
      focusEditor();
      ta.setSelectionRange(start, end);
      // WebView 将 insertText 放进原生撤销历史。其他浏览器可直接修改选区。
      var inserted = false;
      if (typeof document.execCommand === 'function') {
        try { inserted = document.execCommand(value ? 'insertText' : 'delete', false, value); } catch (e) {}
      }
      if (!inserted) ta.setRangeText(value, start, end, 'end');
      ta.setSelectionRange(selectionStart, selectionEnd, direction);
      textChanged();
    }

    function applyIndent(change) {
      if (change.caret !== undefined) {
        focusEditor();
        ta.setSelectionRange(change.caret, change.caret);
        updateStatus();
      } else {
        replaceRange(change.text, change.start, change.end, change.selectionStart, change.selectionEnd, ta.selectionDirection);
      }
    }

    function changeIndent(action, event) {
      if (!loaded || mode !== 'edit' || composing || (event && event.isComposing)) return;
      if (plain) {
        if (!event && action === 'tab') insertSymbol('    ');
        return;
      }
      var change = EditorTools.indentEdit(ta.value, ta.selectionStart, ta.selectionEnd, action, ext);
      if (!change) return;
      if (event) event.preventDefault();
      applyIndent(change);
    }

    ta.addEventListener('keydown', function (event) {
      if (canComplete() && !event.isComposing) {
        if (event.ctrlKey && !event.altKey && !event.metaKey && (event.code === 'Space' || event.key === ' ')) {
          event.preventDefault();
          completion.request(true);
          scheduleHL();
          return;
        }
        if (completion.key(event)) return;
      }
      if (event.key !== 'Tab' || event.ctrlKey || event.altKey || event.metaKey) return;
      changeIndent(event.shiftKey ? 'outdent' : 'tab', event);
    });

    ta.addEventListener('beforeinput', function (event) {
      if (!event.cancelable) return;
      var type = event.inputType;
      if (type === 'insertLineBreak' || type === 'insertParagraph') changeIndent('enter', event);
      else if (type === 'insertText' && event.data === ' ') changeIndent('space', event);
      else if (type === 'deleteContentBackward') changeIndent('backspace', event);
    });

    function insertSymbol(key) {
      var parts = EditorTools.parts(key);
      var start = ta.selectionStart, end = ta.selectionEnd, direction = ta.selectionDirection;
      var selected = parts[1] ? ta.value.slice(start, end) : '';
      var inside = start + parts[0].length;
      replaceRange(parts[0] + selected + parts[1], start, end, inside, inside + selected.length, direction);
      if (!selected && /^(?:html|htm|xhtml)$/.test(ext) && /^<\/?$/.test(parts[0]) && canComplete()) {
        completion.request(false);
      }
    }

    function mapOffset(source, formatted, offset) {
      if (!offset) return 0;
      if (offset >= source.length) return formatted.length;
      var count = source.slice(0, offset).replace(/\s/g, '').length;
      var at = 0;
      while (at < formatted.length && count) {
        if (!/\s/.test(formatted[at])) count--;
        at++;
      }
      return at;
    }

    function formatText() {
      var source = ta.value, formatted;
      try { formatted = EditorTools.format(source, ext); }
      catch (error) {
        toast(error.name === 'SyntaxError' && ext === 'json' ? 'JSON 语法有误，请检查后再格式化' : (error.message || '无法格式化当前文件'));
        return;
      }
      if (formatted === source) { toast('无需调整格式'); return; }
      var start = mapOffset(source, formatted, ta.selectionStart);
      var end = mapOffset(source, formatted, ta.selectionEnd);
      var scrollTop = ta.scrollTop, scrollLeft = ta.scrollLeft;
      replaceRange(formatted, 0, source.length, start, end, ta.selectionDirection);
      ta.scrollTop = scrollTop;
      ta.scrollLeft = scrollLeft;
      syncScroll();
      toast('已格式化');
    }

    function renderGutter() {
      var n = ta.value.split('\n').length;
      if (n === gin.__n) return;
      gin.__n = n;
      var s = '';
      for (var i = 1; i <= n; i++) s += i + '<br>';
      gin.innerHTML = s;
    }

    var hlFrame = 0;
    function languageLabel() {
      if (ext === 'py' || ext === 'pyw' || ext === 'python') return 'Python';
      if (ext === 'java') return 'Java';
      if (/^(html|htm|xhtml)$/.test(ext)) return 'HTML';
      if (/^(js|mjs|cjs|javascript)$/.test(ext)) return 'JavaScript';
      if (/^(json|jsonc)$/.test(ext)) return 'JSON';
      if (/^(xml|svg|xsl|xslt|xsd|rss)$/.test(ext)) return 'XML';
      return ext.toUpperCase() || 'TXT';
    }
    function refreshLanguage() {
      plain = ['txt', 'md'].indexOf(ext) >= 0;
      isMd = (ext === 'md');
      diagnostics.pause();
      completion.hide();
      showIssue(null);
      ca.classList.toggle('plain', plain);
      ta.setAttribute('wrap', plain ? 'soft' : 'off');
      el.querySelector('#stSyn').textContent = languageLabel();
      renderHL();
      updateStatus();
    }
    function renderHL() {
      if (plain) { pre.textContent = ''; return; }
      /* 零宽结尾让空文件和末尾空行也有行框，源码本身保持原样。 */
      pre.innerHTML = HL.highlight(ta.value, ext) + '\u200b';
      if (canComplete()) completion.render(pre, ext);
      syncScroll();
    }
    function scheduleHL() {
      if (plain || hlFrame) return;
      hlFrame = requestAnimationFrame(function () {
        hlFrame = 0;
        renderHL();
      });
    }

    function checkSyntax() {
      if (loaded && !disposed && !composing && mode === 'edit' && panel.hidden) diagnostics.schedule(ext, ta.value);
    }

    function showIssue(result) {
      issue = !plain && result && Number.isInteger(result.line) && result.line > 0 && result.line <= gin.__n ? result : null;
      errorHint.hidden = errorLine.hidden = !issue;
      if (issue) {
        errorHint.dataset.line = issue.line;
        errorHint.firstElementChild.textContent = '第 ' + issue.line + ' 行 · ' + issue.message;
        ta.setAttribute('aria-invalid', 'true');
        positionIssue();
      } else {
        delete errorHint.dataset.line;
        errorHint.firstElementChild.textContent = '';
        ta.removeAttribute('aria-invalid');
      }
    }

    function positionIssue() {
      if (!issue) return;
      var style = getComputedStyle(ta);
      var height = parseFloat(style.lineHeight);
      if (height < 4) height *= parseFloat(style.fontSize);
      if (!height) return;
      errorLine.style.height = height + 'px';
      errorLine.style.transform = 'translateY(' + (parseFloat(style.paddingTop) + (issue.line - 1) * height - ta.scrollTop) + 'px)';
    }

    function jumpToIssue() {
      if (!issue) return;
      var rows = ta.value.split('\n');
      var offset = rows.slice(0, issue.line - 1).reduce(function (sum, line) { return sum + line.length + 1; }, 0);
      offset += Math.min(rows[issue.line - 1].length, Math.max(0, (issue.column || 1) - 1));
      focusEditor();
      ta.setSelectionRange(offset, offset);
      var height = errorLine.offsetHeight;
      ta.scrollTop = Math.max(0, (issue.line - 2) * height);
      syncScroll();
      updateStatus();
    }

    function syncScroll() {
      var st = ta.scrollTop, sl = ta.scrollLeft;
      pre.scrollTop = st; pre.scrollLeft = sl;
      gin.style.transform = 'translateY(' + (-st) + 'px)';
      positionIssue();
    }

    var statusTimer = null, gutterTimer = null;

    function updateStatus() {
      var upto = ta.value.slice(0, ta.selectionStart);
      var lines = upto.split('\n');
      el.querySelector('#stPos').textContent = lines.length + ':' + (lines[lines.length - 1].length + 1);
      el.querySelector('#stWords').textContent = ta.value.replace(/\s/g, '').length + ' 字';
      renderGutter();

      /* 状态栏刚更新过：轻轻提亮一下再落回常态（规范第 2 条「状态」的轻量用法） */
      var bar = el.querySelector('.statusbar');
      if (bar && typeof Anim !== 'undefined' && Anim.enabled()) {
        bar.classList.add('tick');
        clearTimeout(statusTimer);
        statusTimer = setTimeout(function () { bar.classList.remove('tick'); }, 220);
      }
    }

    function save(silent, showFeedback) {
      var savedName = name, savedText = ta.value;
      function failed() {
        toast('保存失败，请保留当前内容后重试');
        return false;
      }
      return Bridge.write(savedName, savedText).then(function (ok) {
        if (ok === false) return failed();
        dirty = (name !== savedName || ta.value !== savedText);
        if (!silent) toast('已保存');
        if (showFeedback && !disposed && !dirty) {
          clearTimeout(saveFeedbackTimer);
          if (cancelSaveMorph) cancelSaveMorph();
          saveShape.setAttribute('points', diskPoints);
          saveFeedback.hidden = false;
          cancelSaveMorph = Motion.morph(saveShape, checkPoints, 230);
          saveFeedbackTimer = setTimeout(function () { saveFeedback.hidden = true; }, 950);
        }
        return true;
      }, failed);
    }

    /* 阅读态才渲染。编辑态永远是原始源码，不然没法改。 */
    function renderMd() {
      mdView.innerHTML = '<div class="md-body">' + MD.render(ta.value) + '</div>';
      mdView.scrollTop = 0;
    }

    function setMode(m) {
      completion.hide();
      mode = m;
      paintBar();
      paintSymbols();
      ta.readOnly = (m === 'read');
      ca.classList.toggle('readonly', m === 'read');

      /* .md 在阅读态显示渲染后的正文，编辑态和其余格式一律走原来的源码视图 */
      var showMd = isMd && m === 'read';
      if (showMd) renderMd();
      mdView.classList.toggle('hidden', !showMd);
      wrap.classList.toggle('hidden', showMd);
      /* 渲染后没有光标，行:列 那一格留着会误导 */
      el.querySelector('#stPos').classList.toggle('hidden', showMd);
      el.querySelector('#stWords').textContent =
        ta.value.replace(/\s/g, '').length + ' 字';

      if (m === 'edit') {
        checkSyntax();
        if (panel.hidden) focusEditor();
      } else diagnostics.pause();
    }

    /* 目录里的 [第一章](#第一章风雨欲来上) 要能跳。
       标题 id 和链接目标都先过 MD.slug 规范化（去掉空格标点和「（）」这类），
       所以「第一章　风雨欲来（上）」能对上「第一章风雨欲来上」。 */
    function jumpTo(raw) {
      var target = MD.slug(raw);
      if (!target) return;
      var heads = mdView.querySelectorAll('h1,h2,h3,h4,h5,h6');
      for (var i = 0; i < heads.length; i++) {
        var id = heads[i].id || MD.slug(heads[i].textContent);
        if (!id) continue;
        if (id === target || id.indexOf(target) === 0 || target.indexOf(id) === 0) {
          heads[i].scrollIntoView({ block: 'start' });
          return;
        }
      }
      toast('找不到这一节');
    }

    mdView.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      e.preventDefault();
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') { toast('外部链接暂不打开'); return; }
      jumpTo(href.slice(1));
    });

    /* 事件 */
    el.addEventListener('mousedown', function (e) {
      if (e.target.closest('[data-act="symbol"], [data-act="indent"], [data-act="format"], .ide-history')) e.preventDefault();
    });
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.dataset.act;
      if (act === 'run' || act === 'runConfig') {
        if (!loaded) return;
        if (act === 'run' && running) return runner.cancel();
        ta.blur();
        function run() { runner.start(function () { return ta.value; }, name, ext); }
        if (act === 'runConfig' && !RunFormats.compilers[ext]) {
          sheet('运行配置', [{ title: languageLabel() + ' · ' + RunFormats.label(ext) },
            { label: RunFormats.label(ext), value: 'run' }]).then(function (v) { if (v && !disposed) run(); });
        } else run();

      } else if (act === 'expandRun') {
        expanded = !expanded;
        el.classList.toggle('ide-output-expanded', expanded);
        t.setAttribute('aria-label', expanded ? '还原结果区' : '放大结果区');
      } else if (act === 'newFile') {
        leaveWorkspace(function () { Nav.go('create'); });
      } else if (act === 'openFile') {
        chooseFile();
      } else if (act === 'find') {
        findText();
      } else if (act === 'fileTab' && t.dataset.file !== name) {
        leaveWorkspace(function () { switchFile(t.dataset.file); });
      } else if (act === 'closeFileTab') {
        var file = t.dataset.file;
        function removeTab() {
          openEditorFiles = openEditorFiles.filter(function (other) { return other !== file; });
          if (file !== name) paintTabs();
          else if (openEditorFiles.length) switchFile(openEditorFiles[openEditorFiles.length - 1]);
          else Nav.tab('shelf');
        }
        if (file === name) leaveWorkspace(removeTab);
        else removeTab();
      } else if ((act === 'undo' || act === 'redo') && mode === 'edit' && !composing) {
        focusEditor();
        if (typeof document.execCommand === 'function') document.execCommand(act);
      } else if (act === 'diagnostic') {
        jumpToIssue();
      } else if (act === 'indent') {
        changeIndent('tab');
      } else if (act === 'format' && mode === 'edit' && !composing) {
        formatText();
      } else if (act === 'symbol' && mode === 'edit' && !composing) {
        insertSymbol(t.dataset.key);
      } else if (act === 'manageSymbols' && mode === 'edit') {
        manageSymbols();
      } else if (act === 'closeRun') {
        runner.close();
      } else if (act === 'stop') {
        runner.cancel();
      } else if (act === 'leave') {
        if (mode === 'edit') {
          save(true).then(function (ok) {
            if (!ok) return;
            setMode('read');
            Nav.back();
          });
        } else {
          Nav.back();
        }
      } else if (act === 'edit') {
        setMode('edit');
      } else if (act === 'done') {
        save(true, true).then(function (ok) { if (ok && !disposed && !dirty) setMode('read'); });
      } else if (act === 'rename') {
        inputBox('重命名', name, '新文件名').then(function (nv) {
          if (!nv || nv === name) return;
          if (!/\.[A-Za-z0-9]+$/.test(nv)) nv = nv + '.' + ext;
          Bridge.rename(name, nv).then(function (ok) {
            if (!ok) return toast('该名称已存在');
            runner.close();
            openEditorFiles = openEditorFiles.map(function (file) { return file === name ? nv : file; });
            ShelfRecent.record(nv, name);
            Books.rename(name, nv);
            name = nv;
            p.name = name;
            paintTabs();
            ext = Bridge.extOf(name);
            refreshLanguage();
            setMode(mode);
            toast('已重命名');
          });
        });
      } else if (act === 'menu') {
        openMenu(t);
      }
    });

    function openMenu(anchor) {
      popover([
        { title: '编码 · ' + (p.enc || 'UTF-8') },
        { ico: 'lineStart', label: '跳转到行首', value: 'ls' },
        { ico: 'lineEnd', label: '跳转到行尾', value: 'le' },
        'sep',
        { ico: 'share', label: '分享 / 导出', value: 'share' },
        'sep',
        { ico: 'send', label: '发布（未接入）', value: 'pub' }
      ], anchor, '文件').then(function (v) {
        if (v === 'ls' || v === 'le') {
          setMode('edit');
          setTimeout(function () {
            var pos = ta.selectionStart;
            var lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
            if (v === 'ls') { ta.setSelectionRange(lineStart, lineStart); }
            else {
              var lineEnd = ta.value.indexOf('\n', pos);
              if (lineEnd === -1) lineEnd = ta.value.length;
              ta.setSelectionRange(lineEnd, lineEnd);
            }
            updateStatus();
          }, 80);
        } else if (v === 'share') {
          Bridge.exportOne(name, ta.value).then(function (r) {
            toast(r === false ? '导出失败，检查存储权限' : '已导出');
          }, function () { toast('导出失败，检查存储权限'); });
        } else if (v === 'pub') {
          toast('服务器未配置');
        }
      });
    }

    ta.addEventListener('input', textChanged);
    ta.addEventListener('compositionstart', function () {
      composing = true;
      diagnostics.pause();
      completion.hide();
    });
    ta.addEventListener('compositionend', function () {
      composing = false;
      if (canComplete()) completion.request(false);
      checkSyntax();
      scheduleHL();
    });
    /* 滚动时行号栏淡下去一点，停下 400ms 再回来：编辑器里唯一的动效 */
    ta.addEventListener('scroll', function (e) {
      syncScroll(e);
      var gutter = el.querySelector('.gutter');
      if (!gutter || typeof Anim === 'undefined' || !Anim.enabled()) return;
      gutter.classList.add('dim');
      clearTimeout(gutterTimer);
      clearTimeout(saveFeedbackTimer);
      if (cancelRunMorph) cancelRunMorph();
      if (cancelSaveMorph) cancelSaveMorph();
      gutterTimer = setTimeout(function () { gutter.classList.remove('dim'); }, 400);
    });
    ta.addEventListener('click', updateStatus);
    ta.addEventListener('keyup', updateStatus);

    document.addEventListener('visibilitychange', onVis);
    function onVis() {
      if (document.hidden && dirty) save(true);
    }

    timer = setInterval(function () { if (dirty) save(true); }, 5 * 60 * 1000);

    /* 系统返回键：编辑态先存盘并退回阅读态，再按一次才离开这篇 */
    el.__onBack = function () {
      if (!panel.hidden) { runner.close(); return true; }
      if (completion.hide()) return true;
      if (mode !== 'edit') return false;
      save(true).then(function (ok) { if (ok) setMode('read'); });
      return true;
    };

    el.__cleanup = function () {
      disposed = true;
      completion.hide();
      diagnostics.pause();
      runner.close();
      clearInterval(timer);
      clearTimeout(statusTimer);
      clearTimeout(gutterTimer);
      cancelAnimationFrame(hlFrame);
      hlFrame = 0;
      document.removeEventListener('visibilitychange', onVis);
      if (dirty) Bridge.write(name, ta.value);
    };

    /* 载入 */
    Bridge.read(name).then(function (t) {
      if (disposed) return;
      loaded = true;
      if (openEditorFiles.indexOf(name) === -1) openEditorFiles.push(name);
      ShelfRecent.record(name);
      paintTabs();
      text = t || '';
      ta.value = text;
      gin.__n = -1;
      if (!plain) renderHL();
      updateStatus();
      setMode(mode);
      syncScroll();
    }).catch(function () {
      if (!disposed) {
        toast('读取失败');
        Nav.back();
      }
    });
  };
