/* 编辑器的本地格式化与符号键。格式化保留字符串、注释和词法单元。 */
var EditorTools = (function () {
  'use strict';

  var formats = Object.create(null);
  var symbolStore = 'xj:custom-symbols:v1';
  var pairs = Object.assign(Object.create(null), {
    '""': ['"', '"'], "''": ["'", "'"], '()': ['(', ')'], '[]': ['[', ']'],
    '{}': ['{', '}'], '<>': ['<', '>'], '\x60\x60': ['\x60', '\x60'], '\u0024{}': ['\u0024{', '}'],
    '/* */': ['/* ', ' */'], '/( )': ['/(', ')'], '<!-- -->': ['<!-- ', ' -->'],
    '**': ['**', '**'], '「」': ['「', '」']
  });

  function register(extensions, kind, keys) {
    var config = { kind: kind, keys: keys };
    extensions.split(' ').forEach(function (ext) { formats[ext] = config; });
  }

  var cKeys = ['""', '{}', '[]', ';', '()', "''", ',', '=', '.', '#', '/* */'];
  var tagKeys = ['<>', '</', '/>', '=', '""', '&', '<!-- -->'];
  register('java', 'java', cKeys);
  register('c h', 'c', cKeys.concat(['->', '*', '&']));
  register('cpp cxx cc c++ hpp hxx hh', 'cpp', cKeys.concat(['::', '->', '*', '&']));
  register('cs', 'cs', cKeys.concat(['=>', '?', '$']));
  register('bf bfh', 'bf', cKeys.concat(['/( )', '#hand ', '$']));
  register('js javascript mjs cjs', 'js', ['""', '{}', '[]', ';', '()', "''", '\x60\x60', '\u0024{}', '=', '=>', '.', ',']);
  register('py pyw python', 'py', [':', '()', '[]', '{}', '""', "''", '=', ',', '.', '#']);
  register('css', 'css', ['{}', ':', ';', '()', '[]', '""', '.', '#', '-', '/* */']);
  register('html htm xhtml', 'html', tagKeys);
  register('xml svg xsl xslt xsd rss', 'xml', tagKeys);
  register('json', 'json', ['""', '{}', '[]', ':', ',']);
  register('jsonc', 'jsonc', formats.json.keys.concat(['//', '/* */']));
  register('md', 'md', ['# ', '**', '\x60\x60', '[]', '()', '- ', '> ', '!', '|']);
  register('txt', 'txt', ['，', '。', '、', '：', '；', '？', '！', '「」', '()']);

  function preferences() {
    var result = Object.create(null);
    try {
      var saved = JSON.parse(localStorage.getItem(symbolStore));
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) Object.assign(result, saved);
    } catch (error) {}
    return result;
  }

  function savedKeys(config, saved) {
    var keys = saved[config.kind];
    if (!Array.isArray(keys)) return [];
    return keys.filter(function (key, index) {
      return typeof key === 'string' && key.trim() && !/[\r\n]/.test(key) &&
        keys.indexOf(key) === index && config.keys.indexOf(key) < 0;
    });
  }

  function changeKey(ext, key, add) {
    var config = formats[ext] || formats.txt;
    var saved = preferences();
    var keys = savedKeys(config, saved);
    var index = keys.indexOf(key);
    if (add) {
      if (!key.trim() || /[\r\n]/.test(key)) throw new Error('请输入单行符号');
      if (index >= 0 || config.keys.indexOf(key) >= 0) throw new Error('符号已存在');
      keys.push(key);
    } else {
      if (index < 0) return;
      keys.splice(index, 1);
    }
    if (keys.length) saved[config.kind] = keys;
    else delete saved[config.kind];
    try { localStorage.setItem(symbolStore, JSON.stringify(saved)); }
    catch (error) { throw new Error('无法保存自定义符号'); }
  }

  var SPACE = /\s*/y;
  var WORD = /[\w$\u0080-\uffff]+/y;
  var OP = /(?:=>|==|!=|<=|>=|[-+*/%&|^!?<>]=|<<=?|>>=?|\+\+|--|&&|\|\||\?\?|::|->|:=)/y;
  var RAW_CPP = /R"([^ ()\\\t\n]{0,16})\(/y;
  var CPP_NUMBER = /\d\w*(?:'\w+)+/y;
  var CS_INTERPOLATED = /(?:\$@?|@\$)(?=")/y;
  var PY_INTERPOLATED = /(?:fr|rf|f)(?=["'])/iy;
  var CSS_URL = /url\(/iy;
  var HAS_BREAK = /[\n\r\u2028\u2029]/;

  function quotedEnd(src, start, quote, verbatim) {
    for (var i = start + quote.length; i < src.length;) {
      if (!verbatim && src[i] === '\\') { i += 2; continue; }
      if (verbatim && src.slice(i, i + 2) === '""') { i += 2; continue; }
      if (src.slice(i, i + quote.length) === quote) return i + quote.length;
      if (!verbatim && quote.length === 1 && HAS_BREAK.test(src[i])) break;
      i++;
    }
    throw new Error('请检查未闭合的字符串');
  }

  function lineEnd(src, start, continuation) {
    var end = start;
    do {
      if (end !== start) end++;
      while (end < src.length && !HAS_BREAK.test(src[end])) end++;
    } while (end < src.length && continuation && src[end - 1] === '\\');
    return end;
  }

  function interpolationPrefix(src, start, kind) {
    var pattern = kind === 'py' ? PY_INTERPOLATED : CS_INTERPOLATED;
    pattern.lastIndex = start;
    var match = pattern.exec(src);
    return match ? match[0] : '';
  }

  function interpolationEnd(src, start, prefix, kind) {
    var at = start + prefix.length;
    var quote = src[at], verbatim = prefix.indexOf('@') >= 0;
    if (src.slice(at, at + 3) === quote.repeat(3)) quote = quote.repeat(3);
    var depth = 0;
    for (var i = at + quote.length; i < src.length; i++) {
      var c = src[i], next = src[i + 1];
      if (!depth) {
        if ((!verbatim && c === '\\' && (kind !== 'py' || !/[{}]/.test(next))) ||
            (verbatim && c === '"' && next === '"') ||
            ((c === '{' || c === '}') && c === next)) { i++; continue; }
        if (src.slice(i, i + quote.length) === quote) return i + quote.length;
        if (c === '{') depth++;
        continue;
      }
      var nested = interpolationPrefix(src, i, kind);
      if (nested) i = interpolationEnd(src, i, nested, kind) - 1;
      else if (c === '"' || c === "'") {
        var delimiter = src.slice(i, i + 3) === c.repeat(3) ? c.repeat(3) : c;
        i = quotedEnd(src, i, delimiter, false) - 1;
      } else if (kind === 'cs' && c === '@' && next === '"') {
        i = quotedEnd(src, i + 1, '"', true) - 1;
      } else if ((kind === 'py' && c === '#') || (kind === 'cs' && c === '/' && next === '/')) {
        i = lineEnd(src, i) - 1;
      } else if (kind === 'cs' && c === '/' && next === '*') {
        var end = src.indexOf('*/', i + 2);
        if (end < 0) break;
        i = end + 1;
      } else if (c === '{') depth++;
      else if (c === '}') depth--;
    }
    throw new Error('请检查未闭合的插值字符串');
  }

  function cssUrlEnd(src, start) {
    for (var i = start; i < src.length; i++) {
      if (src[i] === '\\') i++;
      else if (src[i] === '"' || src[i] === "'") i = quotedEnd(src, i, src[i], false) - 1;
      else if (src[i] === ')') return i + 1;
    }
    throw new Error('请检查 CSS 中未闭合的 url()');
  }

  function lex(src, kind) {
    var out = [], i = 0, literals = kind === 'js' ? HL.javascriptLiterals(src) : null;
    var cStyle = /^(c|cpp|cs|bf)$/.test(kind);
    while (i < src.length) {
      SPACE.lastIndex = i;
      var gap = SPACE.exec(src)[0];
      i += gap.length;
      if (i === src.length) break;
      var c = src[i], next = src[i + 1], end, type = 'code';
      var prefix = (kind === 'cs' || kind === 'py') && interpolationPrefix(src, i, kind);
      CSS_URL.lastIndex = i;
      if (literals && literals[i]) {
        end = literals[i];
      } else if (prefix) {
        end = interpolationEnd(src, i, prefix, kind);
      } else if (kind === 'css' && CSS_URL.test(src)) {
        end = cssUrlEnd(src, CSS_URL.lastIndex);
      } else if (c === '#' && (kind === 'py' || (kind === 'js' && i === 0 && next === '!'))) {
        type = 'comment'; end = lineEnd(src, i);
      } else if (c === '#' && cStyle && (!out.length || HAS_BREAK.test(gap))) {
        type = 'directive'; end = lineEnd(src, i, kind !== 'cs');
      } else if (kind === 'js' && (src.slice(i, i + 4) === '<!--' ||
                 (HAS_BREAK.test(gap) && src.slice(i, i + 3) === '-->'))) {
        type = 'comment'; end = lineEnd(src, i);
      } else if (c === '/' && next === '/' && kind !== 'py' && kind !== 'css') {
        type = 'comment'; end = lineEnd(src, i, cStyle && kind !== 'cs');
      } else if (c === '/' && next === '*' && kind !== 'py') {
        type = 'comment'; end = src.indexOf('*/', i + 2);
        if (end < 0) throw new Error('请检查未闭合的注释');
        end += 2;
      } else if (c === '/' && next === '(' && kind === 'bf') {
        var depth = 1;
        end = i + 2;
        while (depth && end < src.length) {
          if (src[end] === '(') depth++;
          if (src[end] === ')') depth--;
          end++;
        }
        if (depth) throw new Error('请检查未闭合的 BF 注释');
        type = 'comment';
      } else if (kind === 'cs' && c === '@' && next === '"') {
        end = quotedEnd(src, i + 1, '"', true);
      } else if (kind === 'cpp' && c === 'R' && next === '"') {
        RAW_CPP.lastIndex = i;
        var raw = RAW_CPP.exec(src);
        if (!raw) throw new Error('请检查 C++ 原始字符串');
        var close = ')' + raw[1] + '"';
        end = src.indexOf(close, RAW_CPP.lastIndex);
        if (end < 0) throw new Error('请检查未闭合的 C++ 原始字符串');
        end += close.length;
      } else if (c === '"' || c === "'") {
        var quote = c;
        if ((kind === 'py' || (c === '"' && /^(java|cs)$/.test(kind))) && src.slice(i, i + 3) === c.repeat(3)) {
          quote = c.repeat(3);
          while (kind === 'cs' && src[i + quote.length] === '"') quote += '"';
        }
        end = quotedEnd(src, i, quote, false);
      } else if ((cStyle && kind !== 'cs' && c === '\\' && HAS_BREAK.test(next || '')) ||
                 (kind === 'cs' && c === '$' && next === '$')) {
        throw new Error('此文件含有需保留的特殊语法，已保留原文');
      } else {
        WORD.lastIndex = OP.lastIndex = CPP_NUMBER.lastIndex = i;
        var word = (kind === 'cpp' && CPP_NUMBER.exec(src)) || WORD.exec(src) || OP.exec(src);
        end = i + (word ? word[0].length : 1);
        if (kind === 'cpp' && word && /^(u8|u|U|L)R$/.test(word[0]) && src[end] === '"') end--;
      }
      out.push({ gap: gap, value: src.slice(i, end), type: type });
      i = end;
    }
    return out;
  }

  function normalizedGap(gap, indent) {
    return gap.replace(/[ \t]*$/, indent);
  }

  function finish(src, output) {
    return output && /\n$/.test(src) ? output + '\n' : output;
  }

  function formatPython(src) {
    var tokens = lex(src, 'py'), rows = [], levels = [0], nesting = 0, previous;
    tokens.forEach(function (t) {
      var gap = t.gap;
      if ((!previous || HAS_BREAK.test(gap)) && !nesting && t.type !== 'comment' && (!previous || previous.value !== '\\')) {
        var indent = gap.match(/[ \t]*$/)[0];
        var column = 0;
        for (var i = 0; i < indent.length; i++) column += indent[i] === '\t' ? 8 - column % 8 : 1;
        if (column > levels[levels.length - 1]) levels.push(column);
        else while (column < levels[levels.length - 1]) levels.pop();
        if (column !== levels[levels.length - 1]) throw new Error('请检查不一致的 Python 缩进');
        gap = normalizedGap(gap, '    '.repeat(levels.length - 1));
      } else if (previous && previous.value === ',' && !HAS_BREAK.test(gap) && !/^[)\]}]$/.test(t.value) && t.type === 'code') {
        gap = ' ';
      }
      if (/^[([{]$/.test(t.value)) nesting++;
      if (/^[)\]}]$/.test(t.value)) nesting = Math.max(0, nesting - 1);
      rows.push(gap, t.value);
      previous = t;
    });
    return finish(src, rows.join(''));
  }

  function formatCode(src, kind) {
    var json = kind === 'json' || kind === 'jsonc';
    var css = kind === 'css';
    if (kind === 'json') JSON.parse(src);
    if (kind === 'java' && /\\u+[\da-f]{4}/i.test(src)) throw new Error('此文件含 Java Unicode 转义，已保留原文');

    var tokens = lex(src, kind), rows = [], braces = 0, nesting = 0, previous;
    var indentation = json || css ? '  ' : '    ';
    if (css) {
      var nextBoundary = '', declaration;
      for (var i = tokens.length - 1; i >= 0; i--) {
        var value = tokens[i].value;
        if (value === ':' && nextBoundary !== '{') declaration = tokens[i];
        if (/^[{};]$/.test(value)) {
          if (declaration) declaration.declaration = true;
          declaration = null;
          nextBoundary = value;
        }
      }
    }
    tokens.forEach(function (t) {
      var v = t.value, before = previous && previous.value, gap = t.gap;
      var open = v === '{' || (json && v === '[');
      var close = v === '}' || (json && v === ']');
      var afterOpen = before === '{' || (json && before === '[');
      var empty = (before === '{' && v === '}') || (json && before === '[' && v === ']');
      var afterClose = before === '}' && !json && kind !== 'js' && !nesting;
      var joinsBlock = /^(else|catch|finally|while)$/.test(v);
      if (close) braces = Math.max(0, braces - 1);
      var indent = t.type === 'directive' ? '' : indentation.repeat(braces);
      var newLine = ((afterOpen || close) && !empty) ||
        (afterClose && !joinsBlock && (css || /^[\w$]/.test(v))) ||
        (previous && previous.type === 'code' && t.type === 'code' && ((before === ';' && !nesting) || (json && before === ',')));
      if (css && before === '}' && /^[;,)\]]$/.test(v)) newLine = false;
      if (!previous || HAS_BREAK.test(gap)) gap = normalizedGap(gap, indent);
      else if (newLine) gap = '\n' + indent;
      else if (empty || ((json || !css) && /^[,;]$/.test(v)) || ((json || (css && braces && t.declaration)) && v === ':')) gap = '';
      else if ((before === ',' && !css && !/^[)\]}]$/.test(v)) ||
               (before === ':' && (json || (css && braces && previous.declaration))) ||
               (afterClose && joinsBlock) ||
               (!css && !json && (v === '=' || before === '=' || before === '=>' || v === '=>')) ||
               (!json && open && (!css || !nesting)) ||
               (!css && !json && v === '(' && /^(if|for|while|switch|catch|with)$/.test(before))) {
        gap = ' ';
      }
      if (t.type === 'comment' && !HAS_BREAK.test(t.gap) && !afterOpen) gap = t.gap;
      if (css && nesting) gap = t.gap;
      if (!json && /^[([]$/.test(v)) nesting++;
      if (!json && /^[)\]]$/.test(v)) nesting = Math.max(0, nesting - 1);
      if (open) braces++;
      rows.push(gap, v);
      previous = t;
    });
    return finish(src, rows.join(''));
  }

  var TAG = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<!DOCTYPE[^>\[]*>|<\/?[A-Za-z_][\w:.-]*(?:"[^"]*"|'[^']*'|[^<>"'])*>/gi;
  var HTML_BLOCK = /^(html|head|body|main|header|footer|nav|section|article|aside|div|p|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|h[1-6]|form|fieldset|details|summary|blockquote|figure|figcaption|dl|dt|dd|address|hr|meta|link|title|script|style|pre)$/;
  var HTML_VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
  var HTML_RAW = /^(pre|textarea|title|style|script|xmp|iframe|noscript|plaintext)$/;

  function formatMarkup(src, html) {
    var root = { start: 0, children: [] }, stack = [root], at = 0, match;
    TAG.lastIndex = 0;
    while ((match = TAG.exec(src))) {
      var parent = stack[stack.length - 1];
      if (at < match.index) parent.children.push({ text: src.slice(at, match.index) });
      var raw = match[0], name = /^<\/?([\w:.-]+)/.exec(raw);
      at = TAG.lastIndex;
      if (!name) {
        parent.children.push({ text: raw, block: /^(?:<!--|<!DOCTYPE|<\?)/i.test(raw) });
        continue;
      }
      var tag = html ? name[1].toLowerCase() : name[1];
      if (raw[1] === '/') {
        if (parent.tag !== tag) return src;
        parent.close = raw;
        parent.end = at;
        stack.pop();
      } else {
        var node = { tag: tag, open: raw, start: match.index, end: at, children: [] };
        parent.children.push(node);
        if (html && HTML_RAW.test(tag)) {
          var closing = new RegExp('</' + tag + '\\s*>', 'gi');
          closing.lastIndex = at;
          if (!closing.exec(src)) return src;
          at = TAG.lastIndex = node.end = closing.lastIndex;
        } else if (!/\/>$/.test(raw) && !(html && HTML_VOID.test(tag))) stack.push(node);
      }
    }
    if (stack.length !== 1 || !root.children.length) return src;
    if (at < src.length) root.children.push({ text: src.slice(at) });
    root.end = src.length;

    function render(node, level) {
      if (node.text != null) return node.text;
      var children = node.children.filter(function (child) { return child.tag || child.block || /\S/.test(child.text); });
      var structural = children.length && children.every(function (child) {
        return child.block || (child.tag && (!html || HTML_BLOCK.test(child.tag)));
      });
      if (!structural || (node.open && (/\bxml:space\s*=/.test(node.open) || (html && !HTML_BLOCK.test(node.tag))))) {
        return src.slice(node.start, node.end);
      }
      var indent = '  '.repeat(level);
      var childIndent = node.open ? indent + '  ' : indent;
      var body = children.map(function (child) { return childIndent + render(child, level + (node.open ? 1 : 0)); }).join('\n');
      return node.open ? node.open + '\n' + body + '\n' + indent + node.close : body;
    }
    var result = render(root, 0);
    return result === src ? src : finish(src, result);
  }

  function format(src, ext) {
    var config = formats[ext];
    if (!src.trim() || !config) return src;
    var kind = config.kind;
    if (kind === 'txt') return src.replace(/[ \t]+(?=\n|$)/g, '');
    if (kind === 'md') return /\n$/.test(src) ? src : src + '\n';
    if (kind === 'html' || kind === 'xml') return formatMarkup(src, kind === 'html');
    if (kind === 'py') return formatPython(src);
    return formatCode(src, kind);
  }

  return {
    canFormat: function (ext) { return !!formats[ext]; },
    keys: function (ext) {
      var config = formats[ext] || formats.txt;
      return config.keys.concat(savedKeys(config, preferences()));
    },
    customKeys: function (ext) { return savedKeys(formats[ext] || formats.txt, preferences()); },
    changeKey: changeKey,
    parts: function (key) { return pairs[key] || [key, '']; },
    format: format
  };
})();
