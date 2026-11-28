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
    },
    rename: function (name, destination) {
      var list = this.list().filter(function (file) { return file !== destination; });
      var at = list.indexOf(name);
      if (at < 0) return;
      list[at] = destination;
      try { localStorage.setItem('xj:shelf:recent', JSON.stringify(list)); } catch (e) {}
    }
  };

  /* ================= 视图：书架 ================= */
  VIEWS.shelf = function (el) {
    el.classList.add('shelf-view');
    var sort = 'new';
    var search = '';
    var selMode = false;
    var sel = {};
    var disposed = false, deleting = false, refreshRequest = 0;

    el.innerHTML =
      '<header class="workspace-heading" id="shelfBar"></header>' +
      '<div class="scroll workspace-content" id="shelfScroll"><div class="shelf-refresh" role="status" hidden></div>' +
      '<div class="shelf-scroll-body">' +
      '<label class="workspace-search">' + svg('search') +
      '<input type="search" id="shelfSearch" placeholder="搜索文件" aria-label="搜索文件"></label>' +
      '<div class="workspace-shortcuts">' +
      '<button type="button" data-act="create">' + svg('file-plus') + '<span><strong>新建文件</strong><small>创建代码或文稿</small></span></button>' +
      '<button type="button" data-act="import">' + svg('download') + '<span><strong>导入文件</strong><small>从设备选择文件</small></span></button>' +
      '<button type="button" class="shelf-read-shortcut" data-act="read">' + svg('book-open') + '<span><strong>阅读</strong><small>打开阅读器</small></span></button></div>' +
      '<section class="shelf-recent" hidden><h2>最近打开</h2><div class="shelf-recent-list"></div></section>' +
      '<section class="shelf-recent shelf-reading" hidden><div class="workspace-section"><h2>最近阅读</h2>' +
      '<button type="button" class="t-text" data-act="clear-reading">清理</button></div>' +
      '<div class="shelf-recent-list"></div></section>' +
      '<div class="workspace-section"><h2>全部文件</h2><button type="button" class="icon-btn" data-act="sort" aria-label="排序">' +
      svg('sort') + '</button></div><div class="grid shelf-files" id="grid"></div></div></div>' +
      '<input type="file" id="importer" multiple ' +
      'style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0">';

    var bar = el.querySelector('#shelfBar');
    var grid = el.querySelector('#grid');
    var scroll = el.querySelector('#shelfScroll');
    var scrollBody = scroll.querySelector('.shelf-scroll-body');
    var refreshHint = scroll.querySelector('.shelf-refresh');
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
      if (button.dataset.act !== 'new') perform(button.dataset.act, button);
    });

    function openFile(name) {
      if (Books.unsupported(name)) return toast('阅读器支持 TXT 和 EPUB。');
      Nav.go(Books.format(name) ? 'reader' : 'editor', { name: name, mode: 'read' });
    }

    /* 阅读入口（快捷栏第三位）：底部弹窗选书
       只列 TXT / EPUB，读过的排前面并显示「继续阅读」；
       点选后走 openFile → Nav.go('reader')，阅读器自己用 Books.record(name) 恢复上次位置。 */
    function openReadPicker(trigger) {
      var books = docs.filter(function (d) { return Books.format(d.name); })
        .map(function (d) { return { name: d.name, size: d.size || 0 }; });
      if (!books.length) { toast('书架里还没有 TXT 或 EPUB'); return; }
      books.sort(function (a, b) {
        var ra = Books.record(a.name) || {}, rb = Books.record(b.name) || {};
        var readA = ra.percent > 0 ? 1 : 0, readB = rb.percent > 0 ? 1 : 0;
        if (readA !== readB) return readB - readA;
        return (rb.openedAt || 0) - (ra.openedAt || 0) || String(a.name).localeCompare(String(b.name));
      });
      ReadSheet.open(el, trigger, books, function (name) {
        if (!disposed) openFile(name);
      });
    }

    /* 系统返回键：多选态先取消选择，不退页 */
    el.__onBack = function () {
      if (!selMode) return false;
      leaveSelection();
      return true;
    };

    function paintBar() {
      if (selMode) {
        var n = Object.keys(sel).length;
        bar.innerHTML =
          '<button class="t-text" data-act="cancel">取消</button>' +
          '<div class="t-title">已选 ' + n + ' 项</div>' +
          '<button class="icon-btn" data-act="export" aria-label="导出选中的文件">' + svg('share') + '</button>' +
          '<button class="icon-btn" data-act="del" aria-label="删除选中的文件">' + svg('trash') + '</button>';
      } else {
        bar.innerHTML =
          '<div><h1 class="t-title">书架</h1><p>管理你的代码与工程</p></div>' +
          '<div class="workspace-actions"><button type="button" class="icon-btn" data-act="more" aria-label="书架操作">' +
          svg('more') + '</button></div>';
      }
    }

    function paintList() {
      grid.classList.toggle('shelf-selecting', selMode);
      var files = docs.filter(function (d) { return d.name.toLowerCase().indexOf(search) >= 0; });
      var opened = !search && !selMode ? ShelfRecent.list().map(function (name) {
        return docs.find(function (d) { return d.name === name; });
      }).filter(Boolean).slice(0, 3) : [];
      recent.hidden = !opened.length;
      recentList.innerHTML = opened.map(function (d) {
        return '<button type="button" class="shelf-row" data-recent="' + esc(d.name) + '">' + fileBody(d) + '</button>';
      }).join('');
      var reading = el.querySelector('.shelf-reading');
      var books = !search && !selMode ? Books.recent(files.map(function (d) { return d.name; })) : [];
      reading.hidden = !books.length;
      reading.querySelector('.shelf-recent-list').innerHTML = books.map(function (name) {
        var file = docs.find(function (d) { return d.name === name; });
        return '<button type="button" class="shelf-row" data-recent="' + esc(name) + '">' + fileBody(file, true) + '</button>';
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
        html += '<button type="button" class="book shelf-row' + on + '" data-name="' + esc(d.name) + '"' +
          (selMode ? ' aria-pressed="' + !!sel[d.name] + '"' : '') + '>' +
          fileBody(d) + '<span class="b-check"></span></button>';
      });
      grid.innerHTML = html;
    }

    function fileBody(d, reading) {
      var format = FORMATS.find(function (f) { return f.ext === Bridge.extOf(d.name); });
      var book = Books.format(d.name);
      var desc = book ? book.toUpperCase() + ' 阅读' : format ? format.label : Bridge.extOf(d.name).toUpperCase() || '文件';
      if (reading) desc += ' · ' + (Books.record(d.name).percent || 0) + '%';
      else if (typeof d.size === 'number') desc += ' · ' + (d.size < 1024 ? d.size + ' B' : (d.size / 1024).toFixed(1) + ' KB');
      return svg(book ? 'bookshelf' : 'file-code') + '<span class="shelf-file-info"><strong class="b-name">' + esc(d.name) + '</strong>' +
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
      var requested = ++refreshRequest;
      return Bridge.list().then(function (list) {
        if (disposed || requested !== refreshRequest || !Array.isArray(list)) return false;
        docs = sortDocs(list);
        paintList();
        return true;
      }, function () { return false; });
    }

    function paintSelection(previous, name) {
      paintBar();
      paintList();
      if (previous !== selMode) {
        Motion.play(bar, [{ transform: 'translateY(' + (selMode ? 5 : -5) + 'px)', opacity: .45 },
          { transform: 'none', opacity: 1 }], 170);
      }
      if (!selMode) return;
      grid.querySelectorAll('.book').forEach(function (row) {
        if (!previous || row.dataset.name === name) {
          Motion.play(row.querySelector('.b-check'), [{ opacity: 0, transform: 'scale(.92)' },
            { opacity: 1, transform: 'none' }], 170);
        }
      });
    }

    function toggleSel(name) {
      var previous = selMode;
      if (sel[name]) delete sel[name]; else sel[name] = 1;
      if (!Object.keys(sel).length) selMode = false;
      paintSelection(previous, name);
    }

    function leaveSelection() {
      var previous = selMode;
      selMode = false;
      sel = {};
      paintSelection(previous);
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
        var previous = selMode;
        selMode = true;
        if (!sel[b.dataset.name]) sel[b.dataset.name] = 1;
        paintSelection(previous, b.dataset.name);
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
      if (act === 'read') return openReadPicker(anchor);
      if (act === 'more') {
        return popover([
          { ico: 'book-open', label: '阅读', value: 'read' },
          { ico: 'file-plus', label: '新建文件', value: 'create' },
          { ico: 'download', label: '导入文件', value: 'import' },
          { ico: 'sort', label: '排序', value: 'sort' }
        ], anchor).then(function (choice) { if (choice) perform(choice); });
      }
      if (act === 'back') { if (selMode) leaveSelection(); else Nav.back(); }
      else if (act === 'cancel') leaveSelection();
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
          Books.exportFile(nm).then(function (r) {
            if (r === false) badN++; else okN++;
            setTimeout(next, 260);
          }, function () { badN++; setTimeout(next, 260); });
        }
        next();
      } else if (act === 'del') {
        var ns = Object.keys(sel);
        if (!ns.length || deleting) return;
        confirmBox('删除 ' + ns.length + ' 个文件？此操作不可恢复').then(function (ok) {
          if (ok && !disposed) removeFiles(ns);
        });
      }
    }

    function removeFiles(names) {
      deleting = true;
      refreshRequest++;
      Promise.allSettled(names.map(function (name) { return Bridge.remove(name); })).then(function (results) {
        if (disposed) return;
        var removed = new Set(names.filter(function (name, i) {
          return results[i].status === 'fulfilled' && results[i].value !== false;
        }));
        removed.forEach(Books.remove);
        var rows = grid.querySelectorAll('.book');
        var exits = [];
        rows.forEach(function (row) {
          if (!removed.has(row.dataset.name)) return;
          row.disabled = true;
          var exit = Motion.play(row, [{ transform: 'none', opacity: 1 },
            { transform: 'scale(.97)', opacity: 0 }], 220);
          if (exit) exits.push(exit.finished.catch(function () {}));
        });
        return Promise.all(exits).then(function () {
          if (disposed) return;
          var before = new Map();
          rows.forEach(function (row) { before.set(row.dataset.name, row.getBoundingClientRect().top); });
          docs = docs.filter(function (doc) { return !removed.has(doc.name); });
          removed.forEach(function (name) { delete sel[name]; });
          selMode = Object.keys(sel).length > 0;
          paintBar();
          paintList();
          grid.querySelectorAll('.book').forEach(function (row) {
            if (!before.has(row.dataset.name)) return;
            var shift = before.get(row.dataset.name) - row.getBoundingClientRect().top;
            if (Math.abs(shift) > 1) Motion.play(row, [{ transform: 'translateY(' + shift + 'px)' },
              { transform: 'none' }], 220);
          });
          deleting = false;
          var failed = names.length - removed.size;
          toast(!failed ? '已删除' : removed.size ? '已删除 ' + removed.size + ' 个，' + failed + ' 个失败' : '删除失败，请重试');
        });
      });
    }

    var pull, pullFrame, refreshing = false;
    function paintPull(distance) {
      var offset = Anim.enabled() ? Math.min(76, distance) : 0;
      scrollBody.style.transform = offset ? 'translateY(' + offset + 'px)' : '';
      refreshHint.classList.toggle('floating', !offset);
    }
    scroll.addEventListener('touchstart', function (event) {
      if (pull) endPull(false);
      if (event.touches.length !== 1 || scroll.scrollTop > 0 || deleting || refreshing ||
          event.target.closest('input,textarea,[contenteditable]')) { pull = null; return; }
      var touch = event.touches[0];
      pull = { x: touch.clientX, y: touch.clientY, distance: 0, active: false };
    }, { passive: true });
    scroll.addEventListener('touchmove', function (event) {
      if (!pull) return;
      if (event.touches.length !== 1) { endPull(false); return; }
      var touch = event.touches[0];
      var dy = touch.clientY - pull.y;
      if (!pull.active && (dy < -8 || scroll.scrollTop > 0 ||
          Math.abs(touch.clientX - pull.x) > Math.max(10, dy))) { endPull(false); return; }
      if (dy < 10 && !pull.active) return;
      if (!event.cancelable) { endPull(false); return; }
      event.preventDefault();
      endPress();
      pull.active = true;
      pull.distance = Math.max(0, dy) * .47;
      if (!pullFrame) pullFrame = requestAnimationFrame(function () {
        pullFrame = 0;
        if (!pull) return;
        refreshHint.hidden = false;
        var text = pull.distance >= 52 ? '松手刷新' : '下拉刷新';
        if (refreshHint.textContent !== text) refreshHint.textContent = text;
        paintPull(pull.distance);
      });
    }, { passive: false });
    function endPull(release) {
      if (!pull) return;
      var trigger = release && pull.active && pull.distance >= 52;
      var from = scrollBody.style.transform;
      pull = null;
      cancelAnimationFrame(pullFrame);
      pullFrame = 0;
      paintPull(trigger ? 38 : 0);
      Motion.play(scrollBody, [{ transform: from || 'none' },
        { transform: scrollBody.style.transform || 'none' }], 190);
      if (!trigger) { refreshHint.hidden = true; return; }
      refreshing = true;
      refreshHint.hidden = false;
      refreshHint.textContent = '正在刷新…';
      reload().then(function (ok) {
        if (disposed) return;
        var before = scrollBody.style.transform;
        refreshing = false;
        paintPull(0);
        Motion.play(scrollBody, [{ transform: before || 'none' }, { transform: 'none' }], 190);
        refreshHint.hidden = true;
        if (!ok) toast('刷新失败，请重试');
      });
    }
    scroll.addEventListener('touchend', function () { endPull(true); }, { passive: true });
    scroll.addEventListener('touchcancel', function () { endPull(false); }, { passive: true });
    function onBackground() {
      if (document.hidden) {
        endPress();
        endPull(false);
      }
    }
    document.addEventListener('visibilitychange', onBackground);
    el.__cleanup = function () {
      disposed = true;
      endPress();
      endPull(false);
      document.removeEventListener('visibilitychange', onBackground);
    };

    /* --- 导入 --- */
    scroll.addEventListener('click', function (event) {
      if (!event.target.closest('[data-act=clear-reading]')) return;
      Books.clearRecent();
      paintList();
    });
    importer.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(importer.files || []).slice(0, 20);
      importer.value = '';
      if (!files.length) return;
      var done = 0, error = '';
      for (var file of files) {
        try {
          if (await Books.importFile(file)) done++;
          else error = '同名文件已存在或文件无法保存。';
        } catch (failure) { error = failure.message || '导入失败。'; }
      }
      if (!disposed) reload();
      if (!done && files.length === 1) toast(error);
      else toast('已导入 ' + done + ' 个文件' + (done < files.length ? '，' + (files.length - done) + ' 个失败' : ''));
    });
  };
