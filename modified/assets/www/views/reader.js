/* Bookshelf reader. Positions are relative to the chapter or TXT segment. */
'use strict';

VIEWS.reader = function (el, params) {
  var name = params.name, format = Books.format(name);
  var encoding = Books.record(name).encoding || 'auto';
  var preferences = Books.settings();
  var book, index = 0, loadId = 0, disposed = false, ready = false;
  var saveTimer, urls = [], motion = null, gesture = null, layoutPosition = null;
  var settingsLabels = { system: '跟随应用', light: '浅色', dark: '深色', warm: '暖色' };
  el.classList.add('reader-view');
  el.innerHTML =
    '<header class="topbar reader-bar"><button type="button" class="icon-btn" data-act="back" aria-label="返回">' +
      svg('back') + '</button><div class="reader-book-title"><div class="t-title"></div><small></small></div>' +
      '<button type="button" class="t-text" data-act="toc">目录</button>' +
      '<button type="button" class="t-text" data-act="settings">设置</button>' +
      '<button type="button" class="icon-btn" data-act="more" aria-label="阅读操作">' + svg('more') + '</button></header>' +
    '<div class="scroll reader-scroll" tabindex="0" aria-label="正文">' +
      '<div class="reader-frame"><p class="reader-status" role="status"></p><article class="reader-content"></article></div></div>' +
    '<footer class="reader-controls" hidden><button type="button" class="t-text" data-act="previous"></button>' +
      '<div class="reader-progress"><span></span><progress max="100" value="0" aria-label="阅读进度"></progress></div>' +
      '<button type="button" class="t-text" data-act="next"></button></footer>';

  var title = el.querySelector('.t-title'), author = el.querySelector('.reader-book-title small');
  var scroll = el.querySelector('.reader-scroll'), frame = el.querySelector('.reader-frame');
  var status = el.querySelector('.reader-status'), content = el.querySelector('.reader-content');
  var controls = el.querySelector('.reader-controls'), progress = controls.querySelector('progress');
  var positionLabel = controls.querySelector('span');
  var previous = controls.querySelector('[data-act=previous]'), next = controls.querySelector('[data-act=next]');
  var observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateLayout) : null;
  if (observer) { observer.observe(scroll); observer.observe(frame); }

  function applyPreferences() {
    el.dataset.readerTheme = preferences.theme;
    el.dataset.readerMode = preferences.mode;
    el.style.setProperty('--reader-size', preferences.size + 'px');
    el.style.setProperty('--reader-line', preferences.line);
  }

  function maxScroll() { return Math.max(0, scroll.scrollHeight - scroll.clientHeight); }
  function pageStep() { return Math.max(48, scroll.clientHeight - 32); }
  function ratio() { return maxScroll() ? Math.max(0, Math.min(1, scroll.scrollTop / maxScroll())) : 0; }
  function position() {
    if (layoutPosition) return layoutPosition;
    return { index: index, fraction: ratio() };
  }

  function updateControls() {
    if (!book || !ready) return;
    var pages = preferences.mode === 'page', count = book.sections.length;
    var fraction = ratio();
    var overall = Math.round((index + (index === count - 1 && !maxScroll() ? 1 : fraction)) / count * 100);
    var unit = format === 'epub' ? '章' : '段';
    var label = (index + 1) + ' / ' + count + ' ' + unit;
    if (pages) {
      var maxPage = Math.ceil(maxScroll() / pageStep()) + 1;
      var page = fraction >= .999 ? maxPage : Math.floor(scroll.scrollTop / pageStep()) + 1;
      label += ' · ' + page + ' / ' + maxPage + ' 页';
    }
    positionLabel.textContent = label + ' · ' + overall + '%';
    progress.value = overall;
    previous.textContent = pages ? '上一页' : '上一' + unit;
    next.textContent = pages ? '下一页' : '下一' + unit;
    previous.disabled = index === 0 && (!pages || scroll.scrollTop < 1);
    next.disabled = index === count - 1 && (!pages || maxScroll() - scroll.scrollTop < 1);
  }

  function persist() {
    clearTimeout(saveTimer);
    if (!book || !ready) return;
    var pin = position();
    var section = book.sections[index];
    var percent = (index + (index === book.sections.length - 1 && !maxScroll() ? 1 : pin.fraction)) / book.sections.length;
    Books.save(name, {
      index: index, fraction: pin.fraction, anchor: pin.anchor || '', path: section.path || '',
      mode: preferences.mode, percent: Math.round(percent * 100), openedAt: Date.now()
    });
  }

  function moveTo(pin) {
    var fraction = Number(pin.fraction);
    var value = maxScroll() * (Number.isFinite(fraction) ? Math.max(0, Math.min(fraction, 1)) : 0);
    if (pin.anchor) {
      var marker = Array.from(content.querySelectorAll('[data-book-anchor]')).find(function (node) {
        return node.dataset.bookAnchor === pin.anchor;
      });
      if (marker) value = scroll.scrollTop + marker.getBoundingClientRect().top - scroll.getBoundingClientRect().top;
    }
    scroll.scrollTop = Math.max(0, Math.min(value, maxScroll()));
  }

  function updateLayout() {
    if (!ready || disposed) return;
    if (layoutPosition) moveTo(layoutPosition);
    updateControls();
  }

  function releaseImages() {
    urls.forEach(function (url) { URL.revokeObjectURL(url); });
    urls = [];
  }

  function activate(pin, direction) {
    if (!book || disposed) return;
    index = Math.min(book.sections.length - 1, Math.max(0, Number(pin.index) | 0));
    var section = book.sections[index];
    ready = false;
    releaseImages();
    content.textContent = '';
    status.hidden = true;
    if (format === 'txt') {
      content.classList.add('reader-text');
      content.textContent = section.text;
      if (!section.text) { status.textContent = '这本书没有正文。'; status.hidden = false; }
    } else {
      try {
        content.appendChild(book.chapter(index, function (url) { urls.push(url); }, function (target, anchor) {
          activate({ index: target, anchor: anchor, fraction: 0 }, target < index ? -1 : 1);
        }));
      } catch (error) {
        releaseImages();
        status.textContent = error.message || '无法显示这一章。';
        status.hidden = false;
      }
    }
    ready = true;
    controls.hidden = false;
    layoutPosition = { index: index, fraction: Number(pin.fraction) || 0, anchor: pin.anchor || '' };
    scroll.scrollTop = 0;
    updateLayout();
    animate(direction);
    persist();
  }

  function animate(direction) {
    if (!direction) return;
    if (motion) motion.cancel();
    motion = Motion.play(content, [
      { opacity: .72, transform: 'translateX(' + (direction * 7) + 'px)' },
      { opacity: 1, transform: 'none' }
    ], 150);
  }

  async function open() {
    var token = ++loadId;
    ready = false;
    book = null;
    controls.hidden = true;
    releaseImages();
    content.textContent = '';
    status.hidden = false;
    status.textContent = '正在打开…';
    title.textContent = name;
    author.textContent = '';
    var current = function () { return !disposed && token === loadId; };
    try {
      // Let the loading state paint before opening a local archive or reading several chunks.
      await new Promise(function (resolve) { setTimeout(resolve, 0); });
      if (!current()) return;
      var active = format === 'epub' ? EpubReader.open(name) : await Books.textBook(name, encoding, current);
      if (!active || !current()) return;
      book = active;
      title.textContent = book.title;
      author.textContent = book.author || '';
      var old = Books.record(name), start = old.index || 0;
      if (old.path) {
        var matching = book.sections.findIndex(function (section) { return section.path === old.path; });
        if (matching >= 0) start = matching;
      }
      activate({ index: start, fraction: old.fraction || 0, anchor: old.anchor });
    } catch (error) {
      if (current()) status.textContent = error.message || '无法打开书籍。';
    }
  }

  function userPosition() { layoutPosition = null; }

  function turn(direction) {
    if (!ready) return;
    userPosition();
    if (preferences.mode === 'page') {
      var max = maxScroll(), current = scroll.scrollTop;
      if (direction > 0 ? current < max - 1 : current > 1) {
        scroll.scrollTop = Math.max(0, Math.min(max, current + direction * pageStep()));
        updateControls();
        animate(direction);
        persist();
        return;
      }
    }
    var target = index + direction;
    if (target >= 0 && target < book.sections.length) {
      activate({ index: target, fraction: direction < 0 && preferences.mode === 'page' ? 1 : 0 }, direction);
    }
  }

  function choose(title, key, pairs) {
    return sheet(title, pairs.map(function (pair) {
      return { label: pair[1], value: pair[0], current: preferences[key] === pair[0] };
    })).then(function (value) {
      if (disposed || value == null) return;
      var pin = position();
      preferences[key] = value;
      Books.saveSettings(preferences);
      applyPreferences();
      layoutPosition = pin;
      updateLayout();
      persist();
    });
  }

  async function settings() {
    var options = [
      { label: '字号', side: preferences.size + ' px', value: 'size' },
      { label: '行距', side: '× ' + preferences.line, value: 'line' },
      { label: '阅读主题', side: settingsLabels[preferences.theme], value: 'theme' },
      { label: '阅读模式', side: preferences.mode === 'page' ? '分页' : '滚动', value: 'mode' }
    ];
    if (format === 'txt') {
      var current = Books.encodings.find(function (option) { return option[0] === encoding; });
      options.push({ label: '文件编码', side: current ? current[1] : '自动识别', value: 'encoding' });
    }
    var selected = await sheet('阅读设置', options);
    if (disposed) return;
    if (selected === 'size') return choose('字号', 'size', [14, 16, 18, 20, 24, 28, 32].map(function (size) { return [size, size + ' px']; }));
    if (selected === 'line') return choose('行距', 'line', [[1.45, '紧凑'], [1.75, '默认'], [2.05, '宽松']]);
    if (selected === 'theme') return choose('阅读主题', 'theme', Object.entries(settingsLabels));
    if (selected === 'mode') return choose('阅读模式', 'mode', [['scroll', '滚动'], ['page', '分页']]);
    if (selected === 'encoding') {
      var value = await sheet('文件编码', Books.encodings.map(function (pair) {
        return { label: pair[1], value: pair[0], current: encoding === pair[0] };
      }));
      if (!disposed && value && value !== encoding) {
        persist();
        encoding = value;
        Books.save(name, { encoding: value });
        open();
      }
    }
  }

  function tableOfContents() {
    if (!book) return;
    sheet('目录', book.toc.map(function (item, i) {
      return { label: item.title, value: i, current: item.index === index };
    })).then(function (choice) {
      if (choice != null && !disposed) {
        var item = book.toc[choice];
        activate({ index: item.index, anchor: item.anchor, fraction: 0 }, item.index < index ? -1 : 1);
      }
    });
  }

  function addBookmark() {
    if (!ready) return;
    var list = (Books.record(name).bookmarks || []).slice();
    var pin = Object.assign({ title: book.sections[index].title, savedAt: Date.now() }, position());
    if (list.some(function (item) { return item.index === index && Math.abs(item.fraction - pin.fraction) < .002 &&
        (item.anchor || '') === (pin.anchor || ''); })) return toast('此位置已有书签');
    list.unshift(pin);
    Books.save(name, { bookmarks: list.slice(0, 100) });
    toast('已添加书签');
  }

  async function bookmarks() {
    if (!ready) return;
    var list = Books.record(name).bookmarks || [];
    if (!list.length) return toast('还没有书签');
    var selection = await sheet('书签', list.map(function (pin, i) {
      return { label: pin.title, value: i, side: Math.round(pin.fraction * 100) + '%' };
    }));
    if (disposed || selection == null) return;
    var action = await sheet('书签操作', [{ label: '跳转到书签', value: 'open' }, { label: '删除书签', value: 'remove' }]);
    if (disposed || !action) return;
    if (action === 'open') activate(list[selection]);
    else Books.save(name, { bookmarks: list.filter(function (_, i) { return i !== selection; }) });
  }

  async function rename() {
    var extension = '.' + name.split('.').pop();
    var value = await inputBox('重命名书籍', name.slice(0, -extension.length), '书名');
    if (disposed || value == null) return;
    value = value.trim();
    if (!value || /[/\\\u0000-\u001f]/.test(value) || value.length + extension.length > 200) return toast('书名无效');
    var destination = value + extension;
    if (destination === name) return;
    persist();
    if (!await Bridge.rename(name, destination)) return toast('重命名失败，可能已有同名文件');
    Books.rename(name, destination);
    ShelfRecent.rename(name, destination);
    name = params.name = destination;
    if (!disposed) { open(); toast('已重命名'); }
  }

  async function more(anchor) {
    var actions = [
      { ico: 'plus', label: '添加书签', value: 'add' }, { ico: 'book', label: '书签', value: 'bookmarks' },
      { ico: 'share', label: '导出原文件', value: 'export' }, { ico: 'pencil', label: '重命名', value: 'rename' }
    ];
    if (format === 'txt' && book && book.encoding === 'utf-8') {
      actions.push({ ico: 'file-code', label: '编辑纯文本', value: 'edit' });
    }
    var action = await popover(actions, anchor);
    if (disposed) return;
    if (action === 'add') return addBookmark();
    if (action === 'bookmarks') return bookmarks();
    if (action === 'rename') return rename().catch(function () { toast('重命名失败'); });
    if (action === 'export') {
      try { toast(await Books.exportFile(name) ? '已导出' : '导出失败'); }
      catch (error) { toast('导出失败'); }
    }
    if (action === 'edit') Nav.go('editor', { name: name, mode: 'read' });
  }

  el.addEventListener('click', function (event) {
    var button = event.target.closest('[data-act]');
    if (!button) return;
    switch (button.dataset.act) {
      case 'back': Nav.back(false); break;
      case 'toc': tableOfContents(); break;
      case 'settings': settings(); break;
      case 'more': more(button); break;
      case 'previous': turn(-1); break;
      case 'next': turn(1); break;
    }
  });
  scroll.addEventListener('scroll', function () {
    updateControls();
    clearTimeout(saveTimer);
    if (ready) saveTimer = setTimeout(persist, 650);
  }, { passive: true });
  scroll.addEventListener('wheel', userPosition, { passive: true });
  scroll.addEventListener('keydown', function (event) {
    if (event.target !== scroll) return;
    userPosition();
    if (preferences.mode !== 'page') return;
    if (['ArrowLeft', 'PageUp', 'ArrowRight', 'PageDown', ' '].indexOf(event.key) < 0) return;
    event.preventDefault();
    turn(event.key === 'ArrowLeft' || event.key === 'PageUp' || event.shiftKey ? -1 : 1);
  });
  scroll.addEventListener('pointerdown', function (event) {
    if (!event.isPrimary || event.target.closest('button')) return;
    userPosition();
    if (preferences.mode !== 'page' || event.clientX <= 24 || innerWidth - event.clientX <= 24) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  scroll.addEventListener('pointerup', function (event) {
    var start = gesture;
    gesture = null;
    if (!start || start.id !== event.pointerId) return;
    var dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.25) return turn(dx < 0 ? 1 : -1);
    var selection = window.getSelection();
    if (Math.abs(dx) > 9 || Math.abs(dy) > 9 || selection && !selection.isCollapsed) return;
    var area = scroll.getBoundingClientRect(), point = event.clientX - area.left;
    if (point < area.width * .28) turn(-1);
    else if (point > area.width * .72) turn(1);
  });
  scroll.addEventListener('pointercancel', function () { gesture = null; });

  function background() { if (document.hidden) persist(); }
  document.addEventListener('visibilitychange', background);
  el.__cleanup = function () {
    persist();
    disposed = true;
    if (observer) observer.disconnect();
    if (motion) motion.cancel();
    releaseImages();
    document.removeEventListener('visibilitychange', background);
  };
  applyPreferences();
  open();
};
