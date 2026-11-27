/* 信笺 · 视图：书架（列表 / 多选 / 长按 / 导入导出 / 排序）

   注意长按那段：8px 容差和「卡片波纹走 click」都是修 bug 得来，
   改动前先读那段注释，否则会再次把长按改坏。 */
'use strict';



  var ShelfRecent = {
    list: function () {
      try {
        var saved = JSON.parse(localStorage.getItem('xj:shelf:recent'));
        return Array.isArray(saved) ? saved : [];
      } catch (e) { return []; }
    },
    record: function (name, previous) {
      var list = this.list().filter(function (file) { return file !== name && file !== previous; });
      list.unshift(name);
      try { localStorage.setItem('xj:shelf:recent', JSON.stringify(list.slice(0, 8))); } catch (e) {}
    }
  };

  /* ================= 视图：书架 ================= */
  VIEWS.shelf = function (el) {
    el.classList.add('shelf-view');
    var sort = 'new';
    var search = '';
    var selMode = false;
    var sel = {};

    el.innerHTML =
      '<header class="workspace-heading" id="shelfBar"></header>' +
      '<div class="scroll workspace-content" id="shelfScroll">' +
      '<label class="workspace-search">' + svg('search') +
      '<input type="search" id="shelfSearch" placeholder="搜索文件" aria-label="搜索文件"></label>' +
      '<div class="workspace-shortcuts">' +
      '<button type="button" data-act="create">' + svg('file-plus') + '<span><strong>新建文件</strong><small>创建代码或文稿</small></span></button>' +
      '<button type="button" data-act="import">' + svg('download') + '<span><strong>导入文件</strong><small>从设备选择文件</small></span></button></div>' +
      '<section class="shelf-recent" hidden><h2>最近打开</h2><div class="shelf-recent-list"></div></section>' +
      '<div class="workspace-section"><h2>全部文件</h2><button type="button" class="icon-btn" data-act="sort" aria-label="排序">' +
      svg('sort') + '</button></div><div class="grid shelf-files" id="grid"></div></div>' +
      '<input type="file" id="importer" multiple ' +
      'style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0">';

    var bar = el.querySelector('#shelfBar');
    var grid = el.querySelector('#grid');
    var scroll = el.querySelector('#shelfScroll');
    var importer = el.querySelector('#importer');
    var docs = [];
    var recent = el.querySelector('.shelf-recent');
    var recentList = recent.querySelector('.shelf-recent-list');
    el.querySelector('#shelfSearch').addEventListener('input', function (event) {
      search = event.target.value.trim().toLowerCase();
      paintList();
    });
    scroll.addEventListener('click', function (event) {
      var button = event.target.closest('[data-act], [data-recent]');
      if (!button) return;
      if (button.hasAttribute('data-recent')) return openFile(button.dataset.recent);
      if (button.dataset.act !== 'new') perform(button.dataset.act);
    });

    function openFile(name) { Nav.go('editor', { name: name, mode: 'read' }); }

    /* 系统返回键：多选态先取消选择，不退页 */
    el.__onBack = function () {
      if (!selMode) return false;
      selMode = false;
      sel = {};
      paintBar();
      paintList();
      return true;
    };

    function paintBar() {
      if (selMode) {
        var n = Object.keys(sel).length;
        bar.innerHTML =
          '<button class="t-text" data-act="cancel">取消</button>' +
          '<div class="t-title">已选 ' + n + ' 项</div>' +
          '<button class="icon-btn" data-act="export">' + svg('share') + '</button>' +
          '<button class="icon-btn" data-act="del">' + svg('trash') + '</button>';
      } else {
        bar.innerHTML =
          '<div><h1 class="t-title">书架</h1><p>管理你的代码与工程</p></div>' +
          '<div class="workspace-actions"><button type="button" class="icon-btn" data-act="more" aria-label="书架操作">' +
          svg('more') + '</button></div>';
      }
    }

    function paintList() {
      var files = docs.filter(function (d) { return d.name.toLowerCase().indexOf(search) >= 0; });
      var opened = !search && !selMode ? ShelfRecent.list().map(function (name) {
        return docs.find(function (d) { return d.name === name; });
      }).filter(Boolean).slice(0, 3) : [];
      recent.hidden = !opened.length;
      recentList.innerHTML = opened.map(function (d) {
        return '<button type="button" class="shelf-row" data-recent="' + esc(d.name) + '">' + fileBody(d) + '</button>';
      }).join('');
      if (!files.length) {
        /* 空态必须画在 #grid 里面，不能覆盖 scroll.innerHTML：
           一旦把 #grid 换掉，闭包里的 grid 变量就指向一个脱离文档的节点，
           之后 reload() 往它写什么都看不见（导入成功后书架仍显示“还空着”）。
           而且 #grid 上挂了 3 个监听，换节点等于监听全丢。 */
        grid.classList.add('is-empty');
        grid.innerHTML =
          '<div class="empty"><p>' + (search ? '未找到文件' : '书架还空着') + '</p>' +
          (search ? '' : '<button data-act="new">新建一篇</button>') + '</div>';
        var add = grid.querySelector('[data-act=new]');
        if (add) add.onclick = function () { Nav.go('create'); };
        return;
      }
      grid.classList.remove('is-empty');
      var html = '';
      files.forEach(function (d) {
        var on = selMode && sel[d.name] ? ' selected' : '';
        html += '<button type="button" class="book shelf-row' + on + '" data-name="' + esc(d.name) + '">' +
          fileBody(d) + '<span class="b-check"></span></button>';
      });
      grid.innerHTML = html;
    }

    function fileBody(d) {
      var format = FORMATS.find(function (f) { return f.ext === Bridge.extOf(d.name); });
      var desc = format ? format.label : Bridge.extOf(d.name).toUpperCase() || '文件';
      if (typeof d.size === 'number') desc += ' · ' + (d.size < 1024 ? d.size + ' B' : (d.size / 1024).toFixed(1) + ' KB');
      return svg('file-code') + '<span class="shelf-file-info"><strong class="b-name">' + esc(d.name) + '</strong>' +
        '<small class="b-excerpt">' + esc(desc) + '</small></span>' +
        '<time>' + (d.mtime ? fmtTime(d.mtime) : '') + '</time>';
    }

    function sortDocs(list) {
      var out = list.slice();
      if (sort === 'new') out.sort(function (a, b) { return b.mtime - a.mtime; });
      else if (sort === 'old') out.sort(function (a, b) { return a.mtime - b.mtime; });
      else out.sort(function (a, b) { return a.name.localeCompare(b.name, 'zh'); });
      return out;
    }

    function reload() {
      Bridge.list().then(function (list) {
        docs = sortDocs(list || []);
        paintList();
      });
    }

    /* 多选错峰：进入多选时所有格子从下往上逐个升起；
       单选时只动被点的那一格（一格没法错峰）。 */
    function staggerCells(onlyName) {
      var cells = grid.querySelectorAll('.book');
      if (!cells.length) return;
      var list = onlyName
        ? Array.prototype.filter.call(cells, function (c) { return c.dataset.name === onlyName; })
        : cells;
      /* 步长只在 anim.js 里写一次（默认 24ms），这里不再覆盖 */
      Anim.stagger(list);
    }

    function toggleSel(name) {
      if (sel[name]) delete sel[name]; else sel[name] = 1;
      if (!Object.keys(sel).length) selMode = false;
      paintBar();
      paintList();
      staggerCells(name);
    }

    paintBar();
    reload();

    /* --- 长按选择 ---
       这条链路被微交互打断过一次，改这里之前先看下面两条：
       1) 真机手指「按住不动」时仍会持续派发 1~4px 的 pointermove。
          原来的实现收到任何一次 pointermove 就 clearTimeout，
          PRESS_MS 永远熬不到，长按必然失效。现在给 8px 容差兜住抖动。
       2) 波纹不在这里画。pointerdown 时往卡片里插节点，部分 WebView 会
          认为手势期间 DOM 变动而派发 pointercancel，把计时器一起掐掉。
          卡片波纹改到 click 阶段补（见文件末尾），长按成功时单独补一次。 */
    var pressTimer = null, longFired = false, pressFrom = null;
    var PRESS_SLOP = 8;
    /* 长按多久算数。产品约束：**最长 0.5s**（本值由 600 下调到 450，
       600 在真机上「按下去要等半拍」）。要再调就改这一处，测试里有上限护栏 */
    var PRESS_MS = 450;

    function endPress() {
      clearTimeout(pressTimer);
      pressTimer = null;
      pressFrom = null;
    }

    grid.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.book');
      if (!b) return;
      longFired = false;
      endPress();
      pressFrom = { x: e.clientX, y: e.clientY };
      pressTimer = setTimeout(function () {
        pressTimer = null;
        pressFrom = null;
        longFired = true;
        var entering = !selMode;
        if (!selMode) { selMode = true; }
        if (!sel[b.dataset.name]) sel[b.dataset.name] = 1;
        paintBar();
        paintList();
        if (entering) staggerCells();
        /* 长按成功的确认反馈原先是「从卡片中心起一圈波纹」，点击泛光已整体删除，
           现在靠 .stg-run 的错峰升起 + 顶栏计数变化表达。 */
      }, PRESS_MS);
    });

    /* 只有位移真的超过容差才取消，抖动不算「手指在动」 */
    grid.addEventListener('pointermove', function (e) {
      if (!pressTimer || !pressFrom) return;
      var dx = e.clientX - pressFrom.x;
      var dy = e.clientY - pressFrom.y;
      if (dx * dx + dy * dy > PRESS_SLOP * PRESS_SLOP) endPress();
    });

    /* 抬起和系统取消仍然无条件取消 */
    grid.addEventListener('pointerup', endPress);
    grid.addEventListener('pointercancel', endPress);
    /* 原来还有个 scroll 监听，挂在 #grid 上：真正滚的是父级 .scroll，
       而 scroll 不冒泡、#grid 也不在事件路径上，所以那条从来没触发过。
       已经删掉——长按期间真滚动必然产生 pointermove，上面的 8px 容差会接住。 */

    /* 兜底：万一 pointercancel 之后 click 永远不来，longFired 会一直为 true，
       下一次正常点击就被自己吞掉（观感是「点了没反应」）。300ms 后强制复位。 */
    grid.addEventListener('pointerup', function () {
      if (!longFired) return;
      setTimeout(function () { longFired = false; }, 300);
    });
    grid.addEventListener('pointercancel', function () {
      if (!longFired) return;
      setTimeout(function () { longFired = false; }, 300);
    });

    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.book');
      if (!b) return;
      if (longFired) { longFired = false; return; }
      var name = b.dataset.name;
      if (selMode) return toggleSel(name);
      openFile(name);
    });

    /* --- 顶栏动作 --- */
    bar.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      perform(t.dataset.act, t);
    });

    function perform(act, anchor) {
      if (act === 'create') return Nav.go('create');
      if (act === 'more') {
        return popover([
          { ico: 'file-plus', label: '新建文件', value: 'create' },
          { ico: 'download', label: '导入文件', value: 'import' },
          { ico: 'sort', label: '排序', value: 'sort' }
        ], anchor).then(function (choice) { if (choice) perform(choice); });
      }
      if (act === 'back') { if (selMode) { selMode = false; sel = {}; paintBar(); paintList(); } else Nav.back(); }
      else if (act === 'cancel') { selMode = false; sel = {}; paintBar(); paintList(); }
      else if (act === 'sort') {
        sheet('排序', [
          { label: '最新在前', value: 'new' },
          { label: '最早在前', value: 'old' },
          { label: '按名称 A-Z', value: 'name' }
        ]).then(function (v) {
          if (!v) return;
          sort = v;
          docs = sortDocs(docs);
          paintList();
        });
      } else if (act === 'import') {
        importer.value = '';
        importer.click();
      } else if (act === 'export') {
        var names = Object.keys(sel);
        if (!names.length) return toast('还没选');
        var i = 0, okN = 0, badN = 0;
        function next() {
          if (i >= names.length) {
            toast(badN ? ('导出 ' + okN + ' 个，' + badN + ' 个失败') : ('已导出 ' + names.length + ' 个文件'));
            return;
          }
          var nm = names[i++];
          Bridge.read(nm).then(function (txt) {
            return Bridge.exportOne(nm, txt).then(function (r) {
              if (r === false) badN++; else okN++;
              setTimeout(next, 260);
            }, function () { badN++; setTimeout(next, 260); });
          }, function () { badN++; setTimeout(next, 260); });
        }
        next();
      } else if (act === 'del') {
        var ns = Object.keys(sel);
        if (!ns.length) return toast('还没选');
        confirmBox('删除 ' + ns.length + ' 个文件？此操作不可恢复').then(function (ok) {
          if (!ok) return;
          Promise.all(ns.map(function (n) { return Bridge.remove(n); })).then(function () {
            selMode = false; sel = {};
            paintBar();
            reload();
            toast('已删除');
          });
        });
      }
    }

    /* --- 导入 --- */
    importer.addEventListener('change', function () {
      var files = Array.prototype.slice.call(importer.files || []).slice(0, 20);
      if (!files.length) return;
      var done = 0;
      files.forEach(function (f) {
        var r = new FileReader();
        r.onload = function () {
          Bridge.create(f.name, String(r.result || '')).then(function () {
            done++;
            if (done === files.length) { reload(); toast('已导入 ' + done + ' 个文件'); }
          });
        };
        r.readAsText(f);
      });
    });
  };
