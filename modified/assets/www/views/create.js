/* 信笺 · 视图：新建（一级页：文件名 / 格式 / 编码 / 模板）
   文件格式使用选择列表，编码使用三项分段控件。 */
'use strict';



  /* ================= 视图：新建 ================= */
  var FORMATS = [
    { id: 'txt', label: 'TXT', ext: 'txt' },
    { id: 'md', label: 'Markdown', ext: 'md' },
    { id: 'py', label: 'Python', ext: 'py' },
    { id: 'html', label: 'HTML', ext: 'html' },
    { id: 'css', label: 'CSS', ext: 'css' },
    { id: 'java', label: 'Java', ext: 'java' },
    { id: 'json', label: 'JSON', ext: 'json' },
    { id: 'js', label: 'JavaScript', ext: 'js' },
    { id: 'xml', label: 'XML', ext: 'xml' },
    { id: 'c', label: 'C', ext: 'c' },
    { id: 'cpp', label: 'C++', ext: 'cpp' },
    { id: 'cs', label: 'C#', ext: 'cs' },
    { id: 'bf', label: 'BF', ext: 'bf' },
    { id: 'bfh', label: 'BFH', ext: 'bfh' }
  ];

  var ENCODINGS = ['UTF-8', 'UTF-16', 'GBK'];


  VIEWS.create = function (el) {
    var enc = 'UTF-8';
    var fmt = FORMATS[0];
    var niEnc;

    el.innerHTML =
      '<div class="topbar" id="shelfBar"><div class="t-gap"></div>' +
      '<div class="t-title">新建</div><div class="t-gap"></div></div>' +
      '<div class="scroll create-scroll"><div class="form">' +
      '<div class="rows">' +
      '<div class="row create-name"><label for="nameIpt">文件名</label>' +
      '<input type="text" id="nameIpt" placeholder="留空则自动命名"></div>' +
      '<button type="button" class="row choice-row" data-act="fmt" id="fmtSum" aria-haspopup="dialog" aria-expanded="false"></button>' +
      '</div><div><div class="section-label" id="encLabel">文件编码</div>' +
      '<div class="chips seg" data-cols="3" id="encChips" role="group" aria-labelledby="encLabel"></div></div>' +
      '</div></div>' +
      '<button class="submit create-submit" data-act="ok">创建并编辑</button>' +
      tabbar('create');

    var encChips = el.querySelector('#encChips');
    var fmtSum = el.querySelector('#fmtSum');
    var nameIpt = el.querySelector('#nameIpt');

    encChips.innerHTML = ENCODINGS.map(function (e) {
      return '<button type="button" class="chip" data-enc="' + e + '">' + e + '</button>';
    }).join('');

    function paintFormat() {
      fmtSum.innerHTML = '<span class="row-t">文件格式</span><span class="row-v">' + esc(fmt.label) +
        ' · .' + esc(fmt.ext) + '</span><span class="row-arrow">' + svg('chevron') + '</span>';
    }

    function paintEncoding() {
      Array.prototype.forEach.call(encChips.querySelectorAll('[data-enc]'), function (button) {
        var selected = button.dataset.enc === enc;
        button.classList.toggle('on', selected);
        button.setAttribute('aria-pressed', selected);
      });
      if (niEnc) niEnc.sync();
    }

    function chooseFormat() {
      if (fmtSum.getAttribute('aria-expanded') === 'true') return;
      fmtSum.setAttribute('aria-expanded', 'true');
      sheet('文件格式', FORMATS.map(function (f) {
        return { label: f.label, side: '.' + f.ext, value: f, key: f.id, current: fmt === f };
      })).then(function (choice) {
        fmtSum.setAttribute('aria-expanded', 'false');
        if (choice) { fmt = choice; paintFormat(); }
      });
    }

    paintFormat();
    paintEncoding();
    niEnc = NavIndicator.attach(encChips, { variant: 'block' });
    el.__cleanup = function () { if (niEnc) niEnc.destroy(); };

    el.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) return Nav.tab(tab.dataset.tab);
      if (e.target.closest('[data-act=fmt]')) return chooseFormat();
      var ec = e.target.closest('[data-enc]');
      if (ec) { enc = ec.dataset.enc; paintEncoding(); return; }
      if (e.target.closest('[data-act=ok]')) create();
    });

    function create() {
      var base = (nameIpt.value || '').trim() || '未命名';
      base = base.replace(/[\\/:*?"<>|]/g, '_');
      var name = /\.[A-Za-z0-9]+$/.test(base) ? base : base + '.' + fmt.ext;

      Bridge.exists(name).then(function (has) {
        if (!has) return doCreate(name);
        sheet('文件已存在', [
          { label: '取消', value: 'cancel' },
          { label: '覆盖', value: 'overwrite', danger: true },
          { label: '补充序号', value: 'seq' }
        ]).then(function (v) {
          if (v === 'overwrite') return doCreate(name);
          if (v === 'seq') {
            var stem = name.replace(/\.[A-Za-z0-9]+$/, '');
            var ext = name.slice(stem.length);
            var i = 1;
            (function tryNext() {
              var cand = stem + '(' + i + ')' + ext;
              Bridge.exists(cand).then(function (h) {
                if (h) { i++; return tryNext(); }
                doCreate(cand);
              });
            })();
          }
        });
      });
    }

    function doCreate(name) {
      function enter() {
        Nav.stack[Nav.stack.length - 1] = { name: 'editor', params: { name: name, mode: 'edit', enc: enc } };
        Nav.render();
      }
      function failed() {
        toast('创建失败：名称不可用（不能含路径符号，也不能超过 200 字）');
      }
      Bridge.create(name, '').then(function (ok) {
        if (ok) return enter();
        Bridge.write(name, '').then(function (ok2) {
          if (ok2) return enter();
          failed();
        }, failed);
      }, failed);
    }
  };
