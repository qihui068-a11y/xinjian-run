/* 信笺 · 新建文件弹窗 */
'use strict';



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

var FileCreate = (function () {
  var active;
  var EXTENSION = /\.[A-Za-z0-9]+$/;
  var ENCODINGS = ['UTF-8', 'UTF-16', 'GBK'];

  function open() {
    if (active) return;
    var owner = $app.firstElementChild;
    if (!owner) return;
    if (Nav.finishTransition) {
      Nav.finishTransition();
      Nav.finishTransition = null;
    }
    popover.close();
    var focus = document.activeElement;
    var wasInert = $app.inert;
    var format = FORMATS[0], encoding = ENCODINGS[0], suffixMotion;
    var busy = false, composing = false, committing = false, closing = false, next, layer;
    var mask = document.createElement('div');
    mask.className = 'mask workspace-sheet-mask create-mask';
    mask.innerHTML =
      '<section class="sheet workspace-sheet create-sheet" role="dialog" aria-modal="true" aria-labelledby="createTitle">' +
      '<header class="workspace-sheet-header"><div class="sheet-grab" aria-hidden="true"></div>' +
      '<h1 id="createTitle">新建文件</h1><button class="workspace-sheet-close create-close" type="button" aria-label="关闭新建文件">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
      '<form class="create-form">' +
      '<div class="create-scroll"><label class="create-label" for="nameIpt">文件名</label>' +
      '<div class="create-name"><input id="nameIpt" type="text" placeholder="留空则自动命名" autocomplete="off" ' +
      'aria-describedby="createSuffix"><span id="createSuffix">.txt</span></div>' +
      '<h2 class="create-label" id="createFormatsLabel">文件格式</h2>' +
      '<div class="create-format-grid" id="fmtChips" role="group" aria-labelledby="createFormatsLabel">' +
      FORMATS.map(function (item) {
        return '<button type="button" class="chip" data-fmt="' + item.id + '">' +
          svg(item.id === 'txt' || item.id === 'md' ? 'book' : 'file-code') +
          '<span>' + item.label + '</span></button>';
      }).join('') + '</div>' +
      '<h2 class="create-label" id="encLabel">文件编码</h2>' +
      '<div class="chips seg" data-cols="3" id="encChips" role="group" aria-labelledby="encLabel">' +
      ENCODINGS.map(function (item) {
        return '<button type="button" class="chip" data-enc="' + item + '">' + item + '</button>';
      }).join('') + '</div></div>' +
      '<footer class="workspace-sheet-footer"><button type="submit" class="workspace-sheet-action create-submit">创建并编辑</button></footer></form></section>';

    var field = mask.querySelector('#nameIpt');
    var suffix = mask.querySelector('#createSuffix');
    var formats = mask.querySelector('#fmtChips');
    var encodings = mask.querySelector('#encChips');
    var submit = mask.querySelector('.create-submit');
    var closeButton = mask.querySelector('.create-close');
    document.body.appendChild(mask);
    $app.inert = true;

    function select(group, key, value) {
      group.querySelectorAll('button').forEach(function (button) {
        var on = button.dataset[key] === value;
        button.classList.toggle('on', on);
        button.setAttribute('aria-pressed', on);
      });
    }
    select(formats, 'fmt', format.id);
    select(encodings, 'enc', encoding);
    var formatIndicator = NavIndicator.attach(formats, { variant: 'block', duration: 290 });
    var encodingIndicator = NavIndicator.attach(encodings, { variant: 'block', duration: 280 });

    function updateSuffix() {
      var manual = field.value.trim().match(EXTENSION);
      var text = manual ? manual[0] : '.' + format.ext;
      if (text === suffix.textContent) return;
      var opacity = suffixMotion && suffixMotion.playState === 'running' ? Number(getComputedStyle(suffix).opacity) : .48;
      if (suffixMotion) suffixMotion.cancel();
      suffix.textContent = text;
      suffixMotion = Motion.play(suffix, [{ opacity: opacity }, { opacity: 1 }], 160);
    }

    function setBusy(value) {
      busy = value;
      submit.disabled = value;
      submit.textContent = value ? '正在创建…' : '创建并编辑';
    }

    function onBack() {
      layer = Back.open(onBack);
      close();
    }
    layer = Back.open(onBack);

    function close(immediate) {
      if (!immediate && (committing || closing)) return;
      if (closing) {
        mask.__dismiss(null, true);
        return;
      }
      closing = true;
      mask.__dismiss(function () {
        Back.done(layer);
        formatIndicator.destroy();
        encodingIndicator.destroy();
        if (suffixMotion) suffixMotion.cancel();
        $app.inert = wasInert;
        active = null;
        if (next) Nav.go('editor', next);
        else if (focus && focus.isConnected && !focus.matches('input,textarea')) focus.focus({ preventScroll: true });
      }, immediate);
    }
    active = function () {
      next = null;
      close(true);
    };

    GestureMotion.workspaceSheet(mask, close.bind(null, false), owner, function () {
      return !committing && Back.isTop(layer);
    });
    closeButton.focus({ preventScroll: true });
    closeButton.onclick = function () { close(); };
    mask.addEventListener('click', function (event) {
      if (event.target === mask) close();
      if (closing || busy) return;
      var choice = event.target.closest('[data-fmt]');
      if (choice && choice.dataset.fmt !== format.id) {
        format = FORMATS.find(function (item) { return item.id === choice.dataset.fmt; });
        select(formats, 'fmt', format.id);
        formatIndicator.sync();
        updateSuffix();
      }
      var enc = event.target.closest('[data-enc]');
      if (enc && enc.dataset.enc !== encoding) {
        encoding = enc.dataset.enc;
        select(encodings, 'enc', encoding);
        encodingIndicator.sync();
      }
    });
    mask.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && Back.isTop(layer)) {
        event.preventDefault();
        close();
      }
      if (event.key !== 'Tab' || !Back.isTop(layer)) return;
      var controls = mask.querySelectorAll('button:not(:disabled), input');
      var first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    field.addEventListener('input', updateSuffix);
    field.addEventListener('compositionstart', function () { composing = true; });
    field.addEventListener('compositionend', function () { composing = false; });
    mask.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      if (closing || busy || composing) return;
      var base = (field.value.trim() || '未命名').replace(/[\\/:*?"<>|]/g, '_');
      var name = EXTENSION.test(base) ? base : base + '.' + format.ext;
      setBusy(true);
      Bridge.exists(name).then(function (exists) {
        if (closing) return;
        if (!exists) return write(name, false);
        sheet('文件已存在', [
          { label: '取消', value: 'cancel' },
          { label: '覆盖', value: 'overwrite', danger: true },
          { label: '补充序号', value: 'seq' }
        ]).then(function (choice) {
          if (closing) return;
          if (choice === 'overwrite') return write(name, true);
          if (choice === 'seq') return suffixName(name);
          setBusy(false);
        });
      }, failed);
    });

    function suffixName(name) {
      var stem = name.replace(EXTENSION, '');
      var ext = name.slice(stem.length);
      var index = 1;
      function nextName() {
        if (closing) return;
        var candidate = stem + '(' + index++ + ')' + ext;
        Bridge.exists(candidate).then(function (exists) {
          if (exists) nextName();
          else write(candidate, false);
        }, failed);
      }
      nextName();
    }
    function failed() {
      if (closing) return;
      committing = false;
      setBusy(false);
      toast('创建失败：名称不可用，请检查文件名后重试');
    }
    function write(name, overwrite) {
      if (closing) return;
      committing = true;
      var writeFile = overwrite ? Bridge.write : Bridge.create;
      writeFile(name, '').then(function (ok) {
        if (closing) return;
        committing = false;
        if (!ok) return failed();
        next = { name: name, mode: 'edit', enc: encoding };
        close();
      }, failed);
    }
  }

  return { open: open, dismiss: function () { if (active) active(); } };
})();
