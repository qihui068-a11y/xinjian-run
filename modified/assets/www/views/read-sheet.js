/* 信笺 · 选择阅读文件。只列书架里的 TXT / EPUB；读过的显示「继续阅读」。
   点一行 → 关弹窗 → onPick(name) → openFile → Nav.go('reader')，
   阅读器自己按 Books.record(name) 回到上次位置。 */
'use strict';

var ReadSheet = (function () {
  var FILE_ICON = '<svg class="ui-icon read-book-glyph" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M13.4 3.2H7.4a2 2 0 0 0-2 2v13.6a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V8.4z"/>' +
    '<path d="M13.4 3.2v5.2h5.2"/><path d="M8.6 13h6.8M8.6 16.4h4.4"/></svg>';
  var BOOK_ICON = '<svg class="ui-icon read-book-glyph" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 6.6C10.4 5 7.8 4.4 4.5 5v13.3c3.3-.6 5.9 0 7.5 1.6 1.6-1.6 4.2-2.2 7.5-1.6V5c-3.3-.6-5.9 0-7.5 1.6z"/>' +
    '<path d="M12 6.6v13.3"/></svg>';
  var ARROW = '<svg class="ui-icon read-book-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6"/></svg>';

  function size(bytes) {
    var n = Number(bytes) || 0;
    if (n >= 1048576) return (n / 1048576).toFixed(1) + ' MB';
    if (n >= 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
    return n + ' B';
  }

  function open(owner, trigger, books, onPick) {
    if (Nav.finishTransition) {
      Nav.finishTransition();
      Nav.finishTransition = null;
    }
    popover.close();
    var mask = document.createElement('div');
    mask.className = 'mask workspace-sheet-mask read-mask';
    var rows = books.map(function (book) {
      var format = Books.format(book.name).toUpperCase();
      var record = Books.record(book.name) || {};
      var percent = record.percent || 0;
      var meta = format + ' · ' + size(book.size);
      return '<button type="button" class="read-book" data-book="' + esc(book.name) + '">' +
        (format === 'EPUB' ? BOOK_ICON : FILE_ICON) +
        '<span class="read-book-text"><strong>' + esc(book.name) + '</strong>' +
        '<small>' + esc(meta) + '</small></span>' +
        '<span class="read-book-go">' + (percent > 0 ? '继续阅读' : '开始阅读') + ARROW + '</span>' +
        '</button>';
    }).join('');
    mask.innerHTML =
      '<section class="sheet workspace-sheet read-sheet" role="dialog" aria-modal="true" aria-labelledby="readSheetTitle">' +
      '<header class="workspace-sheet-header read-sheet-header"><div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="read-sheet-bar"><h1 id="readSheetTitle">选择阅读文件</h1>' +
      '<button type="button" class="workspace-sheet-close" aria-label="关闭选择阅读文件">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></header>' +
      '<div class="read-sheet-body" role="group" aria-label="书架里的书">' + rows + '</div></section>';

    var panel = mask.querySelector('.read-sheet');
    var closeButton = mask.querySelector('.workspace-sheet-close');
    var savedInert = $app.inert;
    var closing = false, destination, layer;
    document.body.appendChild(mask);
    $app.inert = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'true');

    function systemBack() { layer = Back.open(systemBack); close(); }
    layer = Back.open(systemBack);

    function close(immediate) {
      if (closing) {
        if (immediate) { destination = null; mask.__dismiss(null, true); }
        return;
      }
      closing = true;
      panel.classList.remove('is-open');
      mask.__dismiss(function () {
        Back.done(layer);
        $app.inert = savedInert;
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        if (destination) onPick(destination);
        else if (!immediate && trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
      }, immediate);
    }

    GestureMotion.workspaceSheet(mask, close.bind(null, false), owner, function () { return Back.isTop(layer); });
    closeButton.onclick = function () { close(); };
    mask.addEventListener('click', function (event) {
      if (event.target === mask) close();
      if (closing) return;
      var button = event.target.closest('[data-book]');
      if (!button) return;
      destination = button.dataset.book;
      close();
    });
    mask.addEventListener('keydown', function (event) {
      if (!Back.isTop(layer)) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      var buttons = mask.querySelectorAll('button:not(:disabled)');
      var first = buttons[0], last = buttons[buttons.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
    closeButton.focus({ preventScroll: true });
    return {
      dispose: function () { destination = null; close(true); },
      isOpen: function () { return mask.isConnected; }
    };
  }

  return { open: open, size: size };
})();
