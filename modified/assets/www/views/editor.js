/* 信笺 · 视图：编辑器（代码实时高亮 / .md 阅读态渲染 / 字数 / 目录） */
'use strict';



  /* ================= 视图：编辑器 ================= */
  VIEWS.editor = function (el, p) {
    var name = p.name;
    var mode = p.mode || 'read';
    var ext = Bridge.extOf(name);
    var plain = ['txt', 'md'].indexOf(ext) >= 0;
    var text = '';
    var dirty = false;
    var timer = null;
    var showGutter = true;

    el.innerHTML =
      '<div class="topbar" id="edBar"></div>' +
      '<div class="editor-wrap">' +
      '<div class="gutter"><div class="gutter-inner" id="gin"></div></div>' +
      '<div class="code-area' + (plain ? ' plain' : '') + '" id="ca">' +
      '<pre id="pre" aria-hidden="true"></pre><textarea id="ta" aria-label="文本编辑区" ' +
      'spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" ' +
      'wrap="' + (plain ? 'soft' : 'off') + '"></textarea>' +
      '</div></div>' +
      '<div class="md-view hidden" id="mdView"></div>' +
      '<section class="run-panel" hidden><div class="run-bar">' +
      '<strong class="run-status" role="status"></strong>' +
      '<button data-act="stop" hidden>停止</button><button data-act="closeRun">关闭</button>' +
      '</div><div class="run-body"></div></section>' +
      '<div class="statusbar">' +
      '<span id="stPos">1:1</span>' +
      '<span id="stWords">0 字</span>' +
      '<span class="sp" id="stEnc">' + esc(p.enc || 'UTF-8') + '</span>' +
      '<span id="stSyn">' + esc(languageLabel()) + '</span>' +
      '</div>';

    var bar = el.querySelector('#edBar');
    var ta = el.querySelector('#ta');
    var pre = el.querySelector('#pre');
    var gin = el.querySelector('#gin');
    var ca = el.querySelector('#ca');
    var wrap = el.querySelector('.editor-wrap');
    var mdView = el.querySelector('#mdView');
    var isMd = (ext === 'md');

    var panel = el.querySelector('.run-panel');
    var runner = CodeRunner.attach(panel);
    function paintBar() {
      var label = RunFormats.label(ext);
      var runButton = label ? '<button class="t-text" data-act="run">' + label + '</button>' : '';
      if (mode === 'read') {
        bar.innerHTML =
          '<button class="icon-btn" data-act="leave">' + svg('back') + '</button>' +
          '<div class="t-title">' + esc(name) + '</div>' +
          runButton + '<button class="icon-btn" data-act="edit">' + svg('pencil') + '</button>' +
          '<button class="icon-btn" data-act="menu">' + svg('menu') + '</button>';
      } else {
        bar.innerHTML =
          '<button class="icon-btn" data-act="leave">' + svg('back') + '</button>' +
          '<div class="t-title" data-act="rename">' + esc(name) + '</div>' +
          runButton + '<button class="t-text" data-act="done" style="font-weight:600">完成</button>';
      }
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
      syncScroll();
    }
    function scheduleHL() {
      if (plain || hlFrame) return;
      hlFrame = requestAnimationFrame(function () {
        hlFrame = 0;
        renderHL();
      });
    }

    function syncScroll() {
      var st = ta.scrollTop, sl = ta.scrollLeft;
      pre.scrollTop = st; pre.scrollLeft = sl;
      gin.style.transform = 'translateY(' + (-st) + 'px)';
    }

    function updateStatus() {
      var upto = ta.value.slice(0, ta.selectionStart);
      var lines = upto.split('\n');
      el.querySelector('#stPos').textContent = lines.length + ':' + (lines[lines.length - 1].length + 1);
      el.querySelector('#stWords').textContent = ta.value.replace(/\s/g, '').length + ' 字';
      renderGutter();
    }

    function save(silent) {
      var savedName = name, savedText = ta.value;
      function failed() {
        toast('保存失败，请保留当前内容后重试');
        return false;
      }
      return Bridge.write(savedName, savedText).then(function (ok) {
        if (ok === false) return failed();
        dirty = (name !== savedName || ta.value !== savedText);
        if (!silent) toast('已保存');
        return true;
      }, failed);
    }

    /* 阅读态才渲染。编辑态永远是原始源码，不然没法改。 */
    function renderMd() {
      mdView.innerHTML = '<div class="md-body">' + MD.render(ta.value) + '</div>';
      mdView.scrollTop = 0;
    }

    function setMode(m) {
      mode = m;
      paintBar();
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

      if (m === 'edit') setTimeout(function () { ta.focus(); }, 60);
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
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.dataset.act;
      if (act === 'run') {
        ta.blur();
        runner.start(function () { return ta.value; }, name, ext);
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
        save(true).then(function (ok) { if (ok) setMode('read'); });
      } else if (act === 'rename') {
        inputBox('重命名', name, '新文件名').then(function (nv) {
          if (!nv || nv === name) return;
          if (!/\.[A-Za-z0-9]+$/.test(nv)) nv = nv + '.' + ext;
          Bridge.rename(name, nv).then(function (ok) {
            if (!ok) return toast('该名称已存在');
            runner.close();
            name = nv;
            p.name = name;
            ext = Bridge.extOf(name);
            refreshLanguage();
            paintBar();
            setMode(mode);
            toast('已重命名');
          });
        });
      } else if (act === 'menu') {
        openMenu();
      }
    });

    function openMenu() {
      sheet('文件', [
        { title: '编码 · ' + (p.enc || 'UTF-8') },
        { label: '跳转到行首', value: 'ls' },
        { label: '跳转到行尾', value: 'le' },
        'sep',
        { label: '分享 / 导出', value: 'share' },
        'sep',
        { label: '发布（未接入）', value: 'pub' }
      ]).then(function (v) {
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

    ta.addEventListener('input', function () {
      dirty = true;
      scheduleHL();
      updateStatus();
    });
    ta.addEventListener('compositionend', scheduleHL);
    ta.addEventListener('scroll', syncScroll);
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
      if (mode !== 'edit') return false;
      save(true).then(function (ok) { if (ok) setMode('read'); });
      return true;
    };

    el.__cleanup = function () {
      runner.close();
      clearInterval(timer);
      cancelAnimationFrame(hlFrame);
      hlFrame = 0;
      document.removeEventListener('visibilitychange', onVis);
      if (dirty) Bridge.write(name, ta.value);
    };

    /* 载入 */
    Bridge.read(name).then(function (t) {
      text = t || '';
      ta.value = text;
      gin.__n = -1;
      if (!plain) renderHL();
      updateStatus();
      setMode(mode);
      syncScroll();
    }).catch(function () {
      toast('读取失败');
      Nav.back();
    });
  };
