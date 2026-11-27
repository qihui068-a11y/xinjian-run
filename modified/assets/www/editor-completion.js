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
  var htmlTags = 'div span p a img input button section article aside audio body br canvas code details dialog em fieldset figure footer form h1 h2 h3 h4 h5 h6 head header hr html iframe label li link main meta nav ol option picture pre script select small source strong style summary table tbody td template textarea th thead title tr ul video'.split(' ');
  var voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  var htmlGlobals = 'class id style title lang hidden tabindex role dir data- aria-label aria-hidden aria-describedby aria-labelledby contenteditable draggable';
  var htmlAttributes = {
    a: 'href target rel download hreflang',
    audio: 'src controls autoplay loop muted preload',
    button: 'type name value disabled form',
    form: 'action method enctype autocomplete novalidate target',
    iframe: 'src title width height loading sandbox allow',
    img: 'src alt srcset sizes width height loading decoding',
    input: 'type name value placeholder required disabled checked readonly autocomplete autofocus min max step minlength maxlength pattern multiple accept',
    label: 'for',
    link: 'rel href media type crossorigin',
    meta: 'charset name content http-equiv',
    option: 'value selected disabled label',
    script: 'src type defer async crossorigin',
    select: 'name multiple required disabled autofocus size',
    source: 'src srcset sizes type media',
    td: 'colspan rowspan headers',
    textarea: 'name placeholder rows cols required disabled readonly maxlength autofocus wrap',
    th: 'scope colspan rowspan headers',
    video: 'src poster width height controls autoplay loop muted playsinline preload'
  };
  var booleanAttributes = new Set('hidden controls autoplay loop muted disabled novalidate required checked readonly autofocus multiple selected defer async playsinline'.split(' '));
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
    var markup = kind === 'xml';
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

  function htmlSuggestions(source, cursor, pre) {
    var offset = 0, tag = null, opaque = false;
    var open = [], earlier = new Set();
    for (var i = 0; i < pre.childNodes.length && offset <= cursor; i++) {
      var node = pre.childNodes[i], word = node.textContent, end = offset + word.length;
      var classes = node.classList;
      if (classes && node.hasAttribute('data-markup-edge') && offset < cursor) {
        if (word === '<' || word === '</') {
          tag = { closing: word === '</', start: end, end: end, name: '', attrs: new Map() };
        } else if (tag) {
          if (tag.name && tag.closing) {
            var match = open.lastIndexOf(tag.name);
            if (match >= 0) open.length = match;
          } else if (tag.name) {
            earlier.add(tag.name);
            if (word !== '/>' && !voidTags.has(tag.name)) open.push(tag.name);
          }
          tag = null;
        }
      } else if (classes && tag) {
        if (offset === tag.start && classes.contains('tk-k')) {
          tag.name = word.toLowerCase();
          tag.end = end;
        } else if (classes.contains('tk-v')) {
          tag.attrs.set(word.toLowerCase(), offset);
        } else if (cursor > offset && cursor <= end) {
          opaque = classes.contains('tk-s') || classes.contains('tk-m');
        }
      }
      offset = end;
    }
    if (!tag || cursor < tag.start || opaque) return null;

    var later = new Set(), inTag = true;
    var wantNames = cursor <= tag.end && !tag.closing;
    for (; i < pre.childNodes.length; i++) {
      var following = pre.childNodes[i];
      if (!following.classList) continue;
      if (following.hasAttribute('data-markup-edge')) {
        if (!wantNames) break;
        inTag = false;
        var nameNode = following.nextSibling;
        if (following.textContent === '<' && nameNode && nameNode.classList && nameNode.classList.contains('tk-k')) {
          later.add(nameNode.textContent.toLowerCase());
        }
      } else if (inTag && following.classList.contains('tk-v')) {
        var attribute = following.textContent.toLowerCase();
        if (!tag.attrs.has(attribute)) tag.attrs.set(attribute, -1);
      }
    }

    var start = tag.start, end = tag.end, values, label;
    if (cursor <= tag.end) {
      values = tag.closing ? open.slice().reverse().concat(htmlTags) : Array.from(earlier).concat(htmlTags, Array.from(later));
      label = '标签';
    } else {
      if (!tag.name || tag.closing) return null;
      start = cursor;
      while (start > tag.end && /[\p{ID_Continue}:.-]/u.test(source[start - 1])) start--;
      if (!/\s/.test(source[start - 1]) || /=\s*$/.test(source.slice(tag.end, start))) return null;
      markupName.lastIndex = 0;
      var stem = markupName.exec(source.slice(start, start + 128));
      if (start < cursor && (!stem || stem.index !== 0)) return null;
      end = stem && stem.index === 0 ? start + stem[0].length : cursor;
      var specific = Object.prototype.hasOwnProperty.call(htmlAttributes, tag.name) ? htmlAttributes[tag.name] : '';
      values = (specific ? specific + ' ' + htmlGlobals : htmlGlobals).split(' ');
      label = '属性';
    }
    var prefix = source.slice(start, cursor).toLowerCase();
    if (prefix.length > 80) return null;
    var next = source.slice(end);
    var existing = source.slice(start, end);
    var items = [];
    new Set(values).forEach(function (name) {
      if (items.length >= 8 || !name.startsWith(prefix) || name.length > 80) return;
      if (tag.closing && voidTags.has(name)) return;
      var suffix = '';
      if (label === '属性') {
        if (tag.attrs.has(name) && tag.attrs.get(name) !== start) return;
        if (!booleanAttributes.has(name) && name !== 'data-' && !/^\s*=/.test(next)) suffix = '=""';
      } else if (tag.closing && !/^\s*>/.test(next)) suffix = '>';
      var text = name + suffix;
      if (text === existing) return;
      items.push({ name: name, label: label, text: text,
        caret: suffix === '=""' ? text.length - 1 : text.length });
    });
    return items.length ? { start: start, end: end, cursor: cursor, items: items } : null;
  }

  function suggestions(source, cursor, ext, pre, manual) {
    var kind = aliases[ext];
    if (kind === 'html') return source.length <= limit ? htmlSuggestions(source, cursor, pre) : null;
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
      var text = item.text || item.name + (item.call ? '()' : '');
      var cursor = start + (item.caret === undefined ? item.name.length + (item.call ? 1 : 0) : item.caret);
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
