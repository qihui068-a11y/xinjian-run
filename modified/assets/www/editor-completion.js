/* Offline completion from the current syntax layer and a small language vocabulary. */
var EditorCompletion = (function () {
  'use strict';

  var limit = 128 * 1024;
  var nextId = 0;
  var identifier = /[\p{ID_Start}_$][\p{ID_Continue}$]*/gu;
  var markupName = /[\p{ID_Start}_][\p{ID_Continue}:.-]*/gu;
  var property = /(?:--|-)?[\p{ID_Start}_][\p{ID_Continue}-]*/gu;

  var aliases = Object.create(null);
  [
    'py pyw python', 'js javascript mjs cjs', 'c h', 'cpp cxx cc c++ hpp hxx hh',
    'java', 'cs', 'bf bfh', 'json jsonc', 'html htm xhtml', 'xml svg xsl xslt xsd rss', 'css'
  ].forEach(function (group) {
    var names = group.split(' ');
    names.forEach(function (ext) { aliases[ext] = names[0]; });
  });

  var functions = {
    js: 'parseInt parseFloat isFinite isNaN encodeURI decodeURI encodeURIComponent decodeURIComponent readline',
    c: 'printf scanf puts fgets putchar getchar snprintf malloc calloc realloc free strlen strcmp strcpy memcpy memset',
    cpp: 'printf scanf puts',
    cs: 'nameof sizeof typeof',
    bf: 'printf scanf puts'
  };
  var types = { js: 'console', c: 'size_t FILE', cpp: 'std string vector', java: 'Scanner', cs: 'Console String List Dictionary Task' };
  var keywords = { cs: 'abstract async await base byte checked decimal delegate foreach in interface internal is lock namespace object out override params ref sealed string this throw try unchecked var virtual', json: 'true false null' };
  var htmlTags = 'a article aside audio body br button code div em footer form h1 h2 h3 head header html img input label li link main meta nav ol option p pre section select small span strong style table tbody td textarea th thead tr ul video';
  var cssProperties = 'align-items animation background background-color border border-color border-radius box-shadow color display flex flex-direction font-family font-size font-weight gap grid grid-template-columns height justify-content line-height margin max-height max-width min-height min-width opacity overflow padding position text-align transform transition width z-index';
  var members = {
    js: { console: 'log info warn error debug', Math: 'abs ceil floor max min pow random round sqrt trunc', JSON: 'parse stringify',
      Object: 'assign entries keys values', Array: 'from isArray of' },
    py: { math: 'ceil floor sqrt sin cos tan pow factorial', os: 'getcwd listdir mkdir makedirs' },
    java: { 'System.out': 'print println printf', Math: 'abs ceil floor max min pow random round sqrt' },
    cs: { Console: 'ReadLine ReadKey Write WriteLine', Math: 'Abs Ceiling Floor Max Min Pow Round Sqrt' }
  };

  function context(source, cursor, kind, manual) {
    if (!kind || source.length > limit) return null;
    var markup = kind === 'html' || kind === 'xml';
    var pattern = markup ? markupName : kind === 'css' ? property : identifier;
    var at = cursor;
    var tail = markup ? /[\p{ID_Continue}:.-]/u : kind === 'css' ? /[\p{ID_Continue}-]/u : /[\p{ID_Continue}$]/u;
    while (at && tail.test(source[at - 1])) at--;
    var prefix = source.slice(at, cursor);
    pattern.lastIndex = 0;
    var stem = pattern.exec(source.slice(at, Math.min(source.length, at + 128)));
    if (prefix && (!stem || stem.index !== 0)) return null;
    if ((!manual && prefix.length < 2) || prefix.length > 80) return null;
    var before = source.slice(Math.max(0, at - 160), at);
    if (markup && !/<\/?$/.test(before)) return null;
    var member = !markup && kind !== 'css' && /(?:\.|\?\.)$/.test(before);
    var receiver = member && /([\w$]+(?:\.[\w$]+)*)(?:\?\.|\.)$/.exec(before);
    return { start: at, end: stem && stem.index === 0 ? at + stem[0].length : cursor,
      prefix: prefix, cursor: cursor, receiver: receiver && receiver[1], member: member, pattern: pattern, markup: markup };
  }

  function suggestions(source, cursor, ext, pre, manual) {
    var kind = aliases[ext];
    var info = context(source, cursor, kind, manual);
    if (!info) return null;
    var candidates = new Map();
    var existingWord = source.slice(info.start, info.end);
    var existingCall = /^\s*\(/.test(source.slice(info.end));
    var probe = info.prefix ? info.start : Math.max(0, info.cursor - 1);
    function add(name, label, call, rank) {
      if (!name || !name.startsWith(info.prefix) || name.length > 80) return;
      var appendCall = call && !existingCall;
      if (name === existingWord && !appendCall) return;
      var old = candidates.get(name);
      if (!old) candidates.set(name, { name: name, label: label, call: appendCall, rank: rank });
      else {
        old.rank = Math.min(old.rank, rank);
        if (appendCall) { old.label = label; old.call = true; }
      }
    }
    function words(list, label, call, rank) {
      if (!list) return;
      (Array.isArray(list) ? list : list.split(' ')).forEach(function (name) { add(name, label, call, rank); });
    }

    var offset = 0;
    for (var i = 0; i < pre.childNodes.length; i++) {
      var node = pre.childNodes[i], text = node.textContent;
      var end = offset + text.length;
      var css = node.classList;
      var opaque = css && (css.contains('tk-c') || css.contains('tk-s') || css.contains('tk-r'));
      if (opaque && probe >= offset && probe < end) return null;

      var code = !css || (!opaque && !css.contains('tk-k') && !css.contains('tk-n') && !css.contains('tk-o'));
      var tag = css && css.contains('tk-k') && /<\/?$/.test(source.slice(Math.max(0, offset - 2), offset));
      if (!info.member && kind !== 'json' && (info.markup ? tag : code)) {
        info.pattern.lastIndex = 0;
        var match;
        while ((match = info.pattern.exec(text))) {
          var start = offset + match.index;
          if (start < info.end && start + match[0].length > info.start) continue;
          add(match[0], '文件中', false, start < info.start ? 0 : 2);
        }
      }
      offset = end;
    }

    if (info.member) {
      var receiverNames = members[kind];
      if (receiverNames && Object.prototype.hasOwnProperty.call(receiverNames, info.receiver)) {
        words(receiverNames[info.receiver], '成员', true, 0);
      }
    } else {
      var vocabulary = HL.completionVocabulary(kind);
      words(vocabulary.functions, '函数', true, 1);
      words(functions[kind], '函数', true, 1);
      words(vocabulary.types, '类型', false, 3);
      words(types[kind], '类型', false, 3);
      words(vocabulary.keywords, '关键字', false, 3);
      words(keywords[kind], '关键字', false, 3);
      if (kind === 'html') words(htmlTags, '标签', false, 2);
      if (kind === 'css') words(cssProperties, '属性', false, 2);
    }
    var items = Array.from(candidates.values()).sort(function (a, b) {
      return a.rank - b.rank || a.name.length - b.name.length || a.name.localeCompare(b.name);
    }).slice(0, 8);
    return items.length ? { start: info.start, end: info.end, cursor: cursor, items: items } : null;
  }

  function attach(input, list, insert) {
    var pending = null, current = null, active = -1, checkedSource;
    list.id = 'xj-completions-' + (++nextId);
    input.setAttribute('aria-controls', list.id);
    input.setAttribute('aria-autocomplete', 'list');

    function hide() {
      var wasVisible = !list.hidden;
      pending = current = null;
      checkedSource = null;
      active = -1;
      list.hidden = true;
      list.textContent = '';
      input.removeAttribute('aria-activedescendant');
      return wasVisible;
    }

    function select(index) {
      if (active >= 0) list.children[active].setAttribute('aria-selected', 'false');
      active = index;
      var option = list.children[active];
      option.setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', option.id);
      if (option.scrollIntoView) option.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function accept(index) {
      if (!current || input.value !== checkedSource || input.selectionStart !== current.cursor ||
          input.selectionEnd !== current.cursor) { hide(); return; }
      var item = current.items[index];
      if (!item) return;
      var start = current.start, end = current.end;
      var text = item.name + (item.call ? '()' : '');
      var cursor = start + item.name.length + (item.call ? 1 : 0);
      hide();
      insert(text, start, end, cursor);
    }

    function render(pre, ext) {
      if (pending === null) return;
      var manual = pending;
      var source = input.value, cursor = input.selectionStart;
      hide();
      if (document.activeElement !== input || cursor !== input.selectionEnd) return;
      var result = suggestions(source, cursor, ext, pre, manual);
      if (!result) return;
      current = result;
      checkedSource = source;
      result.items.forEach(function (item, index) {
        var option = document.createElement('button');
        option.id = list.id + '-' + index;
        option.type = 'button';
        option.tabIndex = -1;
        option.dataset.completion = index;
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        var name = document.createElement('span');
        name.textContent = item.name + (item.call ? '()' : '');
        var label = document.createElement('small');
        label.textContent = item.label;
        option.append(name, label);
        list.appendChild(option);
      });
      list.hidden = false;
      list.scrollLeft = 0;
    }

    function key(event) {
      if (!current || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return false;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        var count = current.items.length;
        var next = event.key === 'ArrowDown' ? active + 1 : active < 0 ? count - 1 : active - 1;
        select((next + count) % count);
        return true;
      }
      if ((event.key === 'Enter' || event.key === 'Tab') && active >= 0 && !event.shiftKey) {
        event.preventDefault();
        accept(active);
        return true;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        hide();
        return true;
      }
      if (/^(?:ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|Enter|Tab)$/.test(event.key)) hide();
      return false;
    }

    input.addEventListener('blur', hide);
    input.addEventListener('pointerdown', hide);
    list.addEventListener('mousedown', function (event) { event.preventDefault(); });
    list.addEventListener('click', function (event) {
      var option = event.target.closest('[data-completion]');
      if (option) accept(Number(option.dataset.completion));
    });
    return { request: function (manual) { pending = !!manual; }, render: render, key: key, hide: hide };
  }

  return { attach: attach, suggestions: suggestions };
})();
