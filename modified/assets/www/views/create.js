/* 信笺 · 视图：新建（文件名 / 格式胶囊 / 编码 / 模板） */
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
    var niEnc = null, niFmt = null;

    el.innerHTML =
      '<div class="topbar">' +
      '<button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">新建</div>' +
      '<div style="width:40px"></div></div>' +
      '<div class="scroll"><div class="form">' +
      '<div class="field"><label>文件编码</label><div class="chips seg" data-cols="3" id="encChips"></div></div>' +
      '<div class="field"><label>文件格式</label><div class="chips seg" data-cols="3" id="fmtChips"></div></div>' +
      '<div class="field"><label>文件名</label>' +
      '<input type="text" id="nameIpt" placeholder="留空则自动命名"></div>' +
      '</div></div>' +
      '<button class="submit" data-act="ok">创建并编辑</button>';

    var encChips = el.querySelector('#encChips');
    var fmtChips = el.querySelector('#fmtChips');
    var nameIpt = el.querySelector('#nameIpt');

    /* 胶囊只建一次。每次选择都重建 innerHTML 会把节点换掉，
       transition 永远播不出来——新节点没有「起始状态」可比。 */
    function buildChips() {
      encChips.innerHTML = ENCODINGS.map(function (e) {
        return '<button class="chip" data-enc="' + e + '">' + e + '</button>';
      }).join('');
      fmtChips.innerHTML = FORMATS.map(function (f) {
        return '<button class="chip" data-fmt="' + f.id + '">' + f.label +
          '<span class="chip-detail">.' + f.ext + '</span></button>';
      }).join('');
      /* 表格模式下最后一行如果只剩 1 格，让它横跨整行，免得表里留个窟窿 */
      fillTail(encChips, 3);
      fillTail(fmtChips, 3);
    }

    function fillTail(box, cols) {
      var items = box.querySelectorAll('.chip');
      if (items.length % cols === 1) {
        items[items.length - 1].style.gridColumn = 'span ' + cols;
      }
    }

    function paintChips() {
      Array.prototype.forEach.call(encChips.querySelectorAll('[data-enc]'), function (b) {
        b.classList.toggle('on', b.dataset.enc === enc);
      });
      Array.prototype.forEach.call(fmtChips.querySelectorAll('[data-fmt]'), function (b) {
        b.classList.toggle('on', b.dataset.fmt === fmt.id);
      });
      /* 胶囊状态改完再让指示条跟上：它自己判断该滑还是该直接落位 */
      if (niEnc) niEnc.sync();
      if (niFmt) niFmt.sync();
    }

    buildChips();
    paintChips();
    /* 滑动指示条：编码组 3 格（一行）、格式组 14 格（3 列 → 5 行）。
       两格组都改成了等宽格子（.chips.seg），所以用 block 形态：
       选中的格子整块填色，块会跨行滑过去（线形态跨行不滑，块形态滑）。 */
    niEnc = NavIndicator.attach(encChips, { variant: 'block' });
    niFmt = NavIndicator.attach(fmtChips, { variant: 'block' });
    el.__cleanup = function () {
      if (niEnc) niEnc.destroy();
      if (niFmt) niFmt.destroy();
      niEnc = niFmt = null;
    };

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back();
      var ec = e.target.closest('[data-enc]');
      if (ec) { enc = ec.dataset.enc; paintChips(); return; }
      var fc = e.target.closest('[data-fmt]');
      if (fc) {
        fmt = FORMATS.filter(function (f) { return f.id === fc.dataset.fmt; })[0];
        paintChips();
        return;
      }
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
        // 创建失败时（比如重名竞态）补一次 write，两者都不行必须给提示，不能静默
        Bridge.write(name, '').then(function (ok2) {
          if (ok2) return enter();
          failed();
        }, failed);
      }, failed);
    }
  };