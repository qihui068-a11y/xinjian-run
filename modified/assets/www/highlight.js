/* 信笺 · 语法高亮
   本地词法着色：Python / Java / C / C++ / C# / BF / BFH / HTML / CSS / JS / JSON / XML。
   所有源码先转义再写入高亮层，不执行输入的代码。 */
(function (global) {
  'use strict';

  /* ---------- .bf 规则 ---------- */
  var BF_TYPES = ['int', 'float', 'double', 'char', 'void', 'bool', 'struct', 'enum', 'const', 'static'];
  var BF_KEYWORDS = ['do', 'if', 'else', 'is'];
  var BF_OVER = ['over'];
  var BF_FUNCS = ['run', 'run_r', 'main', 'printf'];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) {
    return '<span class="tk-' + cls + '">' + esc(text) + '</span>';
  }

  /* 找注释结束位置：括号配对计数，未闭合则到文末 */
  function commentEnd(src, start) {
    var i = start + 2;        // 跳过 "/("
    var depth = 1;
    while (i < src.length) {
      var c = src[i];
      if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) return i + 1;
      }
      i++;
    }
    return src.length;
  }

  var RE_IDENT = /[A-Za-z_\u4e00-\u9fa5][A-Za-z0-9_\u4e00-\u9fa5]*/y;
  var RE_NUM = /\d+(?:\.\d+)?/y;
  var RE_OP = /(==|!=|<=|>=|&&|\|\||\+\+|--|[=+\-*/%!<>])/y;
  var RE_PUNCT = /[;{}()[],]/y;

  function tokenizeBF(src) {
    var out = '';
    var i = 0, n = src.length;
    var lineStart = true;

    while (i < n) {
      var c = src[i];

      /* 注释 /( … ) */
      if (c === '/' && src[i + 1] === '(') {
        var e = commentEnd(src, i);
        out += span('c', src.slice(i, e));
        i = e;
        lineStart = false;
        continue;
      }

      /* 预处理 #hand */
      if (c === '#' && lineStart) {
        var le = src.indexOf('\n', i);
        if (le === -1) le = n;
        out += span('h', src.slice(i, le));
        i = le;
        continue;
      }

      /* 字符串 */
      if (c === '"') {
        var j = i + 1, buf = '"';
        while (j < n) {
          if (src[j] === '\\' && j + 1 < n) { buf += src[j] + src[j + 1]; j += 2; continue; }
          if (src[j] === '"') { buf += '"'; j++; break; }
          if (src[j] === '\n') break;
          buf += src[j]; j++;
        }
        out += span('s', buf);
        i = j;
        lineStart = false;
        continue;
      }

      /* 结果变量 $xxx */
      if (c === '$') {
        RE_IDENT.lastIndex = i + 1;
        var mv = RE_IDENT.exec(src);
        var word = mv ? mv[0] : '';
        out += span('v', '$' + word);
        i = i + 1 + word.length;
        lineStart = false;
        continue;
      }

      /* 数字 */
      if (c >= '0' && c <= '9') {
        RE_NUM.lastIndex = i;
        var mn = RE_NUM.exec(src);
        out += span('n', mn[0]);
        i += mn[0].length;
        lineStart = false;
        continue;
      }

      /* 标识符 / 关键字 */
      RE_IDENT.lastIndex = i;
      var mi = RE_IDENT.exec(src);
      if (mi) {
        var w = mi[0];
        var after = src[i + w.length];
        if (w === 'over' && (after === '!' || after === '?')) {
          out += span('m', 'over' + after);
          i += w.length + 1;
        } else if (BF_TYPES.indexOf(w) >= 0) {
          out += span('t', w); i += w.length;
        } else if (BF_KEYWORDS.indexOf(w) >= 0) {
          out += span('k', w); i += w.length;
        } else if (BF_OVER.indexOf(w) >= 0) {
          out += span('m', w); i += w.length;
        } else if (BF_FUNCS.indexOf(w) >= 0) {
          out += span('f', w); i += w.length;
        } else if (w === 'so') {
          out += span('k', w); i += w.length;
        } else {
          out += esc(w); i += w.length;
        }
        lineStart = false;
        continue;
      }

      /* 运算符 */
      RE_OP.lastIndex = i;
      var mo = RE_OP.exec(src);
      if (mo) {
        out += span('o', mo[0]); i += mo[0].length; lineStart = false; continue;
      }

      /* 标点 */
      RE_PUNCT.lastIndex = i;
      var mp = RE_PUNCT.exec(src);
      if (mp) {
        out += span('p', mp[0]); i += mp[0].length; lineStart = false; continue;
      }

      /* 其它 */
      if (c === '\n') { lineStart = true; out += '\n'; }
      else { out += esc(c); if (c !== ' ' && c !== '\t') lineStart = false; }
      i++;
    }
    return out;
  }

  /* 供编辑器使用：只返回展示用 HTML，保留源码中的空白和换行。 */
  function highlight(text, ext) {
    text = String(text == null ? '' : text);
    ext = String(ext || '').toLowerCase().replace(/^\./, '');
    if (ext === 'py' || ext === 'pyw' || ext === 'python') return tokenizePython(text);
    if (ext === 'java') return tokenizeJava(text);
    if (ext === 'bf' || ext === 'bfh') return tokenizeBF(text);
    if (ext === 'c' || ext === 'cpp' || ext === 'cs') return tokenizeCFamily(text);
    if (ext === 'js' || ext === 'mjs' || ext === 'cjs' || ext === 'javascript') return tokenizeJavaScript(text);
    if (ext === 'json' || ext === 'jsonc') return tokenizeJSON(text, ext === 'jsonc');
    if (ext === 'css') return tokenizeCSS(text);
    if (ext === 'html' || ext === 'htm' || ext === 'xhtml') return tokenizeMarkup(text, true);
    if (ext === 'xml' || ext === 'svg' || ext === 'xsl' || ext === 'xslt' || ext === 'xsd' || ext === 'rss') return tokenizeMarkup(text, false);
    return esc(text);
  }

  function wordSet(words) {
    var set = Object.create(null);
    words.split(/\s+/).forEach(function (word) { set[word] = true; });
    return set;
  }

  var PY_KEY = wordSet('and as assert async await break case class continue def del elif else except finally for from global if import in is lambda match nonlocal not or pass raise return try while with yield type');
  var PY_TYPES = wordSet('bool bytearray bytes complex dict float frozenset int list memoryview object range set slice str tuple type');
  var PY_BUILTINS = wordSet('abs aiter all anext any ascii bin breakpoint callable chr classmethod compile delattr dir divmod enumerate eval exec filter format getattr globals hasattr hash help hex id input isinstance issubclass iter len locals map max min next oct open ord pow print property repr reversed round setattr sorted staticmethod sum super vars zip __import__');
  var JAVA_KEY = wordSet('abstract assert break case catch class const continue default do else enum exports extends final finally for goto if implements import instanceof interface module native new non-sealed open opens package permits private protected provides public record requires return sealed static strictfp super switch synchronized this throw throws to transient transitive try uses volatile when while with yield');
  var JAVA_TYPES = wordSet('boolean byte char double float int long short void var Boolean Byte Character Double Float Integer Long Short Void Object String StringBuilder StringBuffer System Math Class Exception RuntimeException Error Thread Runnable Iterable Iterator Collection Collections List ArrayList LinkedList Map HashMap LinkedHashMap Set HashSet Optional Stream Arrays Objects');
  var CODE_IDENT = /[A-Za-z_$\u00c0-\u02ff\u0370-\u1fff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af][A-Za-z0-9_$\u00c0-\u02ff\u0370-\u1fff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]*/y;
  var PY_STRING = /(?:[rRuUbBfF]{1,2})?(?:'''|"""|'|")/y;
  var PY_NUM = /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.[\d_]*|\.\d[\d_]*|\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?)[jJ]?/y;
  var JAVA_NUM = /(?:0[xX](?:[\da-fA-F_]+(?:\.[\da-fA-F_]*)?|\.[\da-fA-F_]+)(?:[pP][+-]?\d[\d_]*)?[fFdDlL]?|0[bB][01_]+[lL]?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?[fFdDlL]?)/y;
  var CODE_OP = /(?:>>>=|>>>|>>=|<<=|\*\*=|\/\/=|==|!=|<=|>=|&&|\|\||\+\+|--|->|::|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<|>>|\*\*|\/\/|:=|[+\-*\/%=!<>~^&|?:@])/y;
  var CODE_PUNCT = /[;{}()\[\],.]/y;
  var ANNOTATION = /@[A-Za-z_$\u3400-\u9fff][A-Za-z0-9_$\u3400-\u9fff]*(?:\.[A-Za-z_$\u3400-\u9fff][A-Za-z0-9_$\u3400-\u9fff]*)*/y;

  function matchAt(re, src, index) {
    re.lastIndex = index;
    var m = re.exec(src);
    return m ? m[0] : '';
  }

  function followedByCall(src, index) {
    while (index < src.length && /\s/.test(src[index])) index++;
    return src[index] === '(';
  }

  /* 支持三引号、转义和未输入完整的字符串；不修改输入框内容。 */
  function quotedEnd(src, start, opening) {
    var q = opening[opening.length - 1];
    var triple = opening.slice(-3) === q + q + q;
    var close = triple ? q + q + q : q;
    var i = start + opening.length;
    while (i < src.length) {
      if (src[i] === '\\') { i = Math.min(i + 2, src.length); continue; }
      if (src.slice(i, i + close.length) === close) return i + close.length;
      if (!triple && (src[i] === '\n' || src[i] === '\r')) return i;
      i++;
    }
    return src.length;
  }

  function tokenizePython(src) {
    var out = [], i = 0, expectName = '';
    while (i < src.length) {
      var c = src[i], token = '', cls = '', end;
      if (c === '#') {
        end = src.indexOf('\n', i);
        if (end === -1) end = src.length;
        out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      token = matchAt(PY_STRING, src, i);
      if (token) {
        end = quotedEnd(src, i, token);
        out.push(span('s', src.slice(i, end))); i = end; continue;
      }
      if (c === '@' && (token = matchAt(ANNOTATION, src, i))) {
        out.push(span('h', token)); i += token.length; continue;
      }
      token = matchAt(PY_NUM, src, i);
      if (token) { out.push(span('n', token)); i += token.length; continue; }
      token = matchAt(CODE_IDENT, src, i);
      if (token) {
        if (expectName) { cls = expectName; expectName = ''; }
        else if (PY_KEY[token]) cls = 'k';
        else if (token === 'True' || token === 'False' || token === 'None') cls = 'm';
        else if (PY_TYPES[token]) cls = 't';
        else if (PY_BUILTINS[token] || followedByCall(src, i + token.length)) cls = 'f';
        if (token === 'def') expectName = 'f';
        else if (token === 'class') expectName = 't';
        out.push(cls ? span(cls, token) : esc(token)); i += token.length; continue;
      }
      token = matchAt(CODE_OP, src, i);
      if (token) { out.push(span('o', token)); i += token.length; continue; }
      token = matchAt(CODE_PUNCT, src, i);
      if (token) { out.push(span('p', token)); i += token.length; continue; }
      out.push(esc(c)); i++;
    }
    return out.join('');
  }

  function tokenizeJava(src) {
    var out = [], i = 0, expectType = false;
    while (i < src.length) {
      var c = src[i], token = '', cls = '', end;
      if (c === '/' && src[i + 1] === '/') {
        end = src.indexOf('\n', i); if (end === -1) end = src.length;
        out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        end = src.indexOf('*/', i + 2); end = end === -1 ? src.length : end + 2;
        out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (c === '"' || c === "'") {
        token = src.slice(i, i + 3) === '"""' ? '"""' : c;
        end = quotedEnd(src, i, token);
        out.push(span('s', src.slice(i, end))); i = end; continue;
      }
      if (c === '@' && (token = matchAt(ANNOTATION, src, i))) {
        out.push(span('h', token)); i += token.length; continue;
      }
      token = matchAt(JAVA_NUM, src, i);
      if (token) { out.push(span('n', token)); i += token.length; continue; }
      token = matchAt(CODE_IDENT, src, i);
      if (token) {
        if (JAVA_KEY[token]) cls = 'k';
        else if (JAVA_TYPES[token] || expectType) cls = 't';
        else if (token === 'true' || token === 'false' || token === 'null') cls = 'm';
        else if (followedByCall(src, i + token.length)) cls = 'f';
        else if (/^[A-Z]/.test(token)) cls = 't';
        expectType = token === 'class' || token === 'interface' || token === 'enum' || token === 'record';
        out.push(cls ? span(cls, token) : esc(token)); i += token.length; continue;
      }
      token = matchAt(CODE_OP, src, i);
      if (token) { out.push(span('o', token)); i += token.length; continue; }
      token = matchAt(CODE_PUNCT, src, i);
      if (token) { out.push(span('p', token)); i += token.length; continue; }
      out.push(esc(c)); i++;
    }
    return out.join('');
  }

  /* ---------- Web 语言：只扫描源码，所有输出均经过 span / esc ---------- */
  var JS_KEY = wordSet('as async await break case catch class const continue debugger default delete do else export extends finally for from function get if import in instanceof let new of return set static super switch this throw try typeof var void while with yield implements interface package private protected public enum');
  var JS_TYPES = wordSet('Array ArrayBuffer BigInt BigInt64Array BigUint64Array Boolean DataView Date Error EvalError Float32Array Float64Array Function Int8Array Int16Array Int32Array Intl JSON Map Math Number Object Promise Proxy RangeError ReferenceError Reflect RegExp Set SharedArrayBuffer String Symbol SyntaxError TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array URIError WeakMap WeakRef WeakSet WebAssembly');
  var JS_CONTROL = wordSet('if while for with switch catch');
  var JS_LITERAL = wordSet('true false null undefined NaN Infinity');
  var JS_NUM = /(?:0[xX][\da-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*\.[\d_]*|\.\d[\d_]*|\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?n?)/y;
  var JS_OP = /(?:>>>=|===|!==|>>>|\*\*=|&&=|\|\|=|\?\?=|<<=|>>=|=>|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\+\+|--|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<|>>|\*\*|\.\.\.|[+\-*\/%=!<>~^&|?])/y;
  var JSON_NUM = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
  var CSS_IDENT = /(?:--|-?(?:[_a-zA-Z\u0080-\uffff]|\\(?:[\da-fA-F]{1,6}[ \t\r\n\f]?|[^\r\n\f])))(?:[-_a-zA-Z0-9\u0080-\uffff]|\\(?:[\da-fA-F]{1,6}[ \t\r\n\f]?|[^\r\n\f]))*/y;
  var CSS_NUM = /[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?/y;
  var CSS_RULE_AT = wordSet('media supports container layer scope document -moz-document keyframes -webkit-keyframes starting-style');
  var MARKUP_NAME = /[A-Za-z_\u00c0-\u02ff\u3400-\u9fff][A-Za-z0-9_.:\-\u00c0-\u02ff\u3400-\u9fff]*/y;
  var MARKUP_ATTR = /[^\s=<>\/"'`]+/y;
  var MARKUP_ENTITY = /&(?:#[xX][\da-fA-F]*|#\d*|[A-Za-z_:][A-Za-z0-9_.:\-]*);?/y;
  var HTML_RAW_END = Object.assign(Object.create(null), {
    script: /<\/script(?=[\t\n\f\r \/>])/gi,
    style: /<\/style(?=[\t\n\f\r \/>])/gi,
    textarea: /<\/textarea(?=[\t\n\f\r \/>])/gi,
    title: /<\/title(?=[\t\n\f\r \/>])/gi,
    xmp: /<\/xmp(?=[\t\n\f\r \/>])/gi,
    iframe: /<\/iframe(?=[\t\n\f\r \/>])/gi,
    noembed: /<\/noembed(?=[\t\n\f\r \/>])/gi,
    noframes: /<\/noframes(?=[\t\n\f\r \/>])/gi,
    noscript: /<\/noscript(?=[\t\n\f\r \/>])/gi
  });
  var HTML_JS_TYPE = wordSet('module text/javascript application/javascript text/ecmascript application/ecmascript application/x-javascript text/jscript text/livescript text/javascript1.0 text/javascript1.1 text/javascript1.2 text/javascript1.3 text/javascript1.4 text/javascript1.5');

  function webSpaceEnd(src, i) {
    while (i < src.length && /\s/.test(src[i])) i++;
    return i;
  }

  function webLineEnd(src, i) {
    while (i < src.length && src[i] !== '\n' && src[i] !== '\r' && src[i] !== '\u2028' && src[i] !== '\u2029') i++;
    return i;
  }

  /* JS / JSON / CSS 的字符串：保留转义和未闭合输入，包括转义 CRLF。 */
  function webQuotedEnd(src, start) {
    var q = src[start], i = start + 1;
    while (i < src.length) {
      if (src[i] === '\\') {
        i += src[i + 1] === '\r' && src[i + 2] === '\n' ? 3 : 2;
        continue;
      }
      if (src[i] === q) return i + 1;
      if (src[i] === '\r' || src[i] === '\n' || src[i] === '\u2028' || src[i] === '\u2029') return i;
      i++;
    }
    return src.length;
  }

  function webBlockEnd(src, start, close) {
    var end = src.indexOf(close, start);
    return end === -1 ? src.length : end + close.length;
  }

  function jsFrame(interpolation) {
    return { kind: 'code', interpolation: interpolation, regex: true, last: '', parens: [], braces: [], expect: '' };
  }

  /* 正则 / 除法采用前一有效 token 和控制语句括号启发式，不执行语法解析。 */
  function jsRegexEnd(src, start) {
    var i = start + 1, inClass = false;
    while (i < src.length) {
      var c = src[i];
      if (c === '\r' || c === '\n' || c === '\u2028' || c === '\u2029') return i;
      if (c === '\\') { i = Math.min(i + 2, src.length); continue; }
      if (c === '[') inClass = true;
      else if (c === ']') inClass = false;
      else if (c === '/' && !inClass) {
        i++;
        while (i < src.length && /[A-Za-z]/.test(src[i])) i++;
        return i;
      }
      i++;
    }
    return src.length;
  }

  function tokenizeJavaScript(src) {
    var out = [], i = 0, frames = [jsFrame(false)];
    while (i < src.length) {
      var frame = frames[frames.length - 1], c = src[i], token = '', cls = '', end, start;
      /* 显式栈处理模板和 ${}，深层嵌套不递归调用词法器。 */
      if (frame.kind === 'template') {
        start = i;
        while (i < src.length) {
          if (src[i] === '\\') { i = Math.min(i + 2, src.length); continue; }
          if (src[i] === '`') {
            i++;
            out.push(span('s', src.slice(start, i)));
            frames.pop();
            break;
          }
          if (src[i] === '$' && src[i + 1] === '{') {
            if (i > start) out.push(span('s', src.slice(start, i)));
            out.push(span('p', '${')); i += 2;
            frames.push(jsFrame(true));
            break;
          }
          i++;
        }
        if (i === src.length && i > start && frames[frames.length - 1] === frame) out.push(span('s', src.slice(start, i)));
        continue;
      }
      if (/\s/.test(c)) {
        end = webSpaceEnd(src, i); out.push(esc(src.slice(i, end))); i = end; continue;
      }
      if ((c === '/' && src[i + 1] === '/') || (i === 0 && c === '#' && src[i + 1] === '!')) {
        end = webLineEnd(src, i); out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        end = webBlockEnd(src, i + 2, '*/'); out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (c === '"' || c === "'") {
        end = webQuotedEnd(src, i); out.push(span('s', src.slice(i, end))); i = end;
        frame.regex = false; frame.last = 'value'; frame.expect = ''; continue;
      }
      if (c === '`') {
        out.push(span('s', c)); i++; frame.regex = false; frame.last = 'value'; frame.expect = '';
        frames.push({ kind: 'template' }); continue;
      }
      if (c === '/' && frame.regex) {
        end = jsRegexEnd(src, i); out.push(span('s', src.slice(i, end))); i = end;
        frame.regex = false; frame.last = 'value'; continue;
      }
      token = matchAt(JS_NUM, src, i);
      if (token) {
        out.push(span('n', token)); i += token.length; frame.regex = false; frame.last = 'value'; frame.expect = ''; continue;
      }
      if (c === '#' && (token = matchAt(CODE_IDENT, src, i + 1))) {
        out.push(span('v', '#' + token)); i += token.length + 1; frame.regex = false; frame.last = 'value'; continue;
      }
      token = matchAt(CODE_IDENT, src, i);
      if (token) {
        if (frame.expect) cls = frame.expect;
        else if (JS_LITERAL[token]) cls = 'm';
        else if (JS_KEY[token]) cls = 'k';
        else if (JS_TYPES[token]) cls = 't';
        else if (followedByCall(src, i + token.length)) cls = 'f';
        frame.expect = token === 'function' ? 'f' : token === 'class' ? 't' : '';
        out.push(cls ? span(cls, token) : esc(token)); i += token.length;
        frame.regex = !!JS_KEY[token] && token !== 'this' && token !== 'super'; frame.last = token;
        continue;
      }
      if (c === '{') {
        /* 在表达式起点通常是对象；语句/函数/箭头函数后通常是代码块。 */
        var objectBrace = frame.regex && frame.last !== '' && frame.last !== ';' && frame.last !== '=>' && frame.last !== ')' && frame.last !== 'else' && frame.last !== 'do' && frame.last !== 'try' && frame.last !== 'finally';
        frame.braces.push(objectBrace); frame.regex = true; frame.last = c;
        out.push(span('p', c)); i++; continue;
      }
      if (c === '}') {
        out.push(span('p', c)); i++;
        if (frame.interpolation && !frame.braces.length) { frames.pop(); continue; }
        frame.regex = frame.braces.length ? !frame.braces.pop() : true; frame.last = c; frame.expect = ''; continue;
      }
      if (c === '(') {
        frame.parens.push(!!JS_CONTROL[frame.last]); frame.regex = true; frame.last = c;
        out.push(span('p', c)); i++; continue;
      }
      if (c === ')') {
        frame.regex = frame.parens.length ? frame.parens.pop() : false; frame.last = c;
        out.push(span('p', c)); i++; continue;
      }
      if (c === '[' || c === ']' || c === ';' || c === ',' || c === ':' || (c === '.' && src[i + 1] !== '.' && !/\d/.test(src[i + 1] || ''))) {
        frame.regex = c !== ']' && c !== '.'; frame.last = c; frame.expect = '';
        out.push(span('p', c)); i++; continue;
      }
      token = matchAt(JS_OP, src, i);
      if (token) {
        if (token !== '++' && token !== '--') frame.regex = token !== '?.';
        frame.last = token; out.push(span('o', token)); i += token.length; continue;
      }
      out.push(esc(c)); i++;
    }
    return out.join('');
  }

  function tokenizeJSON(src, comments) {
    var out = [], i = 0;
    while (i < src.length) {
      var c = src[i], token = '', end;
      if (/\s/.test(c)) {
        end = webSpaceEnd(src, i); out.push(esc(src.slice(i, end))); i = end; continue;
      }
      if (comments && c === '/' && src[i + 1] === '/') {
        end = webLineEnd(src, i); out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (comments && c === '/' && src[i + 1] === '*') {
        end = webBlockEnd(src, i + 2, '*/'); out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (c === '"') {
        end = webQuotedEnd(src, i);
        out.push(span(src[webSpaceEnd(src, end)] === ':' ? 'v' : 's', src.slice(i, end))); i = end; continue;
      }
      token = matchAt(JSON_NUM, src, i);
      if (token) { out.push(span('n', token)); i += token.length; continue; }
      token = matchAt(CODE_IDENT, src, i);
      if (token) {
        out.push(token === 'true' || token === 'false' || token === 'null' ? span('m', token) : esc(token));
        i += token.length; continue;
      }
      if (/[{}\[\],:]/.test(c)) out.push(span('p', c));
      else out.push(esc(c));
      i++;
    }
    return out.join('');
  }

  function cssFrame(kind) {
    return { kind: kind, phase: kind === 'value' ? 'value' : 'name', atRule: '', property: '', pending: false, pseudo: false, parens: 0, brackets: 0 };
  }

  function cssReset(frame) {
    frame.phase = frame.kind === 'value' ? 'value' : 'name';
    frame.atRule = ''; frame.property = ''; frame.pending = false; frame.pseudo = false;
  }

  function tokenizeCSS(src) {
    var out = [], i = 0, frames = [cssFrame('rules')];
    while (i < src.length) {
      var frame = frames[frames.length - 1], c = src[i], token = '', cls = '', end;
      if (/\s/.test(c)) {
        end = webSpaceEnd(src, i); out.push(esc(src.slice(i, end))); i = end; continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        end = webBlockEnd(src, i + 2, '*/'); out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (c === '"' || c === "'") {
        end = webQuotedEnd(src, i); out.push(span('s', src.slice(i, end))); i = end; continue;
      }
      if (c === '@' && (token = matchAt(CSS_IDENT, src, i + 1))) {
        frame.atRule = token.toLowerCase(); out.push(span('h', '@' + token)); i += token.length + 1; continue;
      }
      if (c === '!' && (token = matchAt(/!\s*important\b/iy, src, i))) {
        out.push(span('k', token)); i += token.length; continue;
      }
      if (c === '#') {
        token = matchAt(CSS_IDENT, src, i + 1) || matchAt(/[A-Za-z0-9_-]+/y, src, i + 1);
        if (token) {
          cls = frame.phase === 'value' && /^(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(token) ? 'm' : 'v';
          out.push(span(cls, '#' + token)); i += token.length + 1; continue;
        }
      }
      token = matchAt(CSS_NUM, src, i);
      if (token) {
        end = i + token.length;
        var unit = src[end] === '%' ? '%' : matchAt(CSS_IDENT, src, end);
        out.push(span('n', token + unit)); i = end + unit.length; continue;
      }
      token = matchAt(CSS_IDENT, src, i);
      if (token) {
        end = webSpaceEnd(src, i + token.length);
        if (token.slice(0, 2) === '--') cls = 'v';
        else if (src[end] === '(') cls = 'f';
        else if (frame.kind === 'decls' && frame.phase === 'name' && !frame.parens && !frame.brackets && src[end] === ':' && !frame.atRule) cls = 'v';
        else if (frame.pseudo) cls = 'k';
        else if (frame.phase === 'value' || frame.atRule) cls = 's';
        else cls = 't';
        if (frame.kind === 'decls' && frame.phase === 'name' && !frame.parens && !frame.brackets && src[end] === ':' && !frame.atRule) {
          frame.pending = true; frame.property = token;
        }
        frame.pseudo = false; out.push(span(cls, token)); i += token.length; continue;
      }
      if (c === '{') {
        var kind = 'decls';
        if (frame.phase === 'value' && frame.property.slice(0, 2) === '--') kind = 'value';
        else if (CSS_RULE_AT[frame.atRule]) kind = frame.atRule.indexOf('keyframes') >= 0 ? 'rules' : frame.kind;
        if (kind !== 'value') cssReset(frame);
        frames.push(cssFrame(kind)); out.push(span('p', c)); i++; continue;
      }
      if (c === '}') {
        var closed = frames.length > 1 ? frames.pop() : frame;
        if (closed.kind !== 'value') cssReset(frames[frames.length - 1]);
        out.push(span('p', c)); i++; continue;
      }
      if (c === '(') frame.parens++;
      else if (c === ')') frame.parens = Math.max(0, frame.parens - 1);
      else if (c === '[') frame.brackets++;
      else if (c === ']') frame.brackets = Math.max(0, frame.brackets - 1);
      else if (c === ':' && !frame.parens && !frame.brackets) {
        if (frame.pending) { frame.phase = 'value'; frame.pending = false; }
        else if (frame.phase === 'name') frame.pseudo = true;
      } else if (c === ';' && !frame.parens && !frame.brackets) cssReset(frame);
      if (/[()[\]:;,.]/.test(c)) out.push(span('p', c));
      else if (/[=~|^$*+>\/-]/.test(c)) out.push(span('o', c));
      else out.push(esc(c));
      i++;
    }
    return out.join('');
  }

  /* 值和文本中的实体保持原拼写：&amp; 不会被解码为源码里的 &。 */
  function markupText(out, src, start, end, cls) {
    var i = start, run = start;
    while (i < end) {
      var token = src[i] === '&' ? matchAt(MARKUP_ENTITY, src, i) : '';
      if (token && i + token.length <= end) {
        if (i > run) out.push(cls ? span(cls, src.slice(run, i)) : esc(src.slice(run, i)));
        out.push(span('m', token)); i += token.length; run = i;
      } else i++;
    }
    if (end > run) out.push(cls ? span(cls, src.slice(run, end)) : esc(src.slice(run, end)));
  }

  /* DOCTYPE 内部子集的 > 以及引号中的 > 都不提前结束声明。 */
  function markupDeclarationEnd(src, start) {
    var i = start + 2, quote = '', depth = 0;
    while (i < src.length) {
      var c = src[i];
      if (quote) { if (c === quote) quote = ''; }
      else if (src.slice(i, i + 4) === '<!--') { i = webBlockEnd(src, i + 4, '-->'); continue; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '[') depth++;
      else if (c === ']') depth = Math.max(0, depth - 1);
      else if (c === '>' && !depth) return i + 1;
      i++;
    }
    return src.length;
  }

  function markupTag(out, src, start) {
    var i = start + 1, closing = src[i] === '/';
    if (closing) i++;
    var name = matchAt(MARKUP_NAME, src, i);
    if (!name) return null;
    out.push(span('p', closing ? '</' : '<')); out.push(span('k', name)); i += name.length;
    var tag = { name: name.toLowerCase(), closing: closing, closed: false, selfClosing: false, type: '', hasType: false, end: i };
    while (i < src.length) {
      var c = src[i], end, attr;
      if (/\s/.test(c)) {
        end = webSpaceEnd(src, i); out.push(esc(src.slice(i, end))); i = end; continue;
      }
      if (c === '>' || (c === '/' && src[i + 1] === '>')) {
        tag.selfClosing = c === '/'; tag.closed = true; end = i + (tag.selfClosing ? 2 : 1);
        out.push(span('p', src.slice(i, end))); i = end; break;
      }
      if (c === '<') break;  // 编辑中另一个标签开始时交还外层，至少已经消费了标签名。
      attr = matchAt(MARKUP_ATTR, src, i);
      if (!attr) {
        if (c === '"' || c === "'") {
          end = src.indexOf(c, i + 1); end = end === -1 ? src.length : end + 1;
          markupText(out, src, i, end, 's'); i = end;
        } else { out.push(span('p', c)); i++; }
        continue;
      }
      out.push(span('v', attr)); i += attr.length;
      end = webSpaceEnd(src, i); out.push(esc(src.slice(i, end))); i = end;
      if (src[i] !== '=') continue;
      out.push(span('o', '=')); i++;
      end = webSpaceEnd(src, i); out.push(esc(src.slice(i, end))); i = end;
      var valueStart = i, rawStart = i, rawEnd;
      if (src[i] === '"' || src[i] === "'") {
        rawStart = i + 1; end = src.indexOf(src[i], rawStart);
        rawEnd = end === -1 ? src.length : end; i = end === -1 ? src.length : end + 1;
      } else {
        while (i < src.length && !/[\s<>]/.test(src[i]) && !(src[i] === '/' && src[i + 1] === '>')) i++;
        rawEnd = i;
      }
      markupText(out, src, valueStart, i, 's');
      if (attr.toLowerCase() === 'type' && !tag.hasType) {
        tag.type = src.slice(rawStart, rawEnd).trim().toLowerCase().split(';')[0].trim(); tag.hasType = true;
      }
    }
    tag.end = i; return tag;
  }

  function tokenizeMarkup(src, html) {
    var out = [], i = 0;
    while (i < src.length) {
      var end, tag;
      if (src.slice(i, i + 4) === '<!--') {
        end = webBlockEnd(src, i + 4, '-->'); out.push(span('c', src.slice(i, end))); i = end; continue;
      }
      if (src.slice(i, i + 9) === '<![CDATA[') {
        end = webBlockEnd(src, i + 9, ']]>'); out.push(span('s', src.slice(i, end))); i = end; continue;
      }
      if (src.slice(i, i + 2) === '<?') {
        end = webBlockEnd(src, i + 2, '?>'); out.push(span('h', src.slice(i, end))); i = end; continue;
      }
      if (src.slice(i, i + 2) === '<!') {
        end = markupDeclarationEnd(src, i); out.push(span('h', src.slice(i, end))); i = end; continue;
      }
      if (src[i] === '<' && (tag = markupTag(out, src, i))) {
        i = tag.end;
        if (html && tag.closed && !tag.closing && !tag.selfClosing && (HTML_RAW_END[tag.name] || tag.name === 'plaintext')) {
          var close = HTML_RAW_END[tag.name], match = null;
          if (close) { close.lastIndex = i; match = close.exec(src); }
          end = match ? match.index : src.length;
          var body = src.slice(i, end);
          if (tag.name === 'script') {
            if (tag.type === 'importmap' || tag.type === 'speculationrules' || tag.type === 'application/json' || /\+json$/.test(tag.type)) out.push(tokenizeJSON(body, false));
            else if (!tag.type || HTML_JS_TYPE[tag.type]) out.push(tokenizeJavaScript(body));
            else out.push(esc(body));
          } else if (tag.name === 'style' && (!tag.type || tag.type === 'text/css')) out.push(tokenizeCSS(body));
          else if (tag.name === 'title' || tag.name === 'textarea') markupText(out, src, i, end, '');
          else out.push(esc(body));
          i = end;
        }
        continue;
      }
      if (src[i] === '<') { out.push(span('p', '<')); i++; continue; }
      end = src.indexOf('<', i); if (end === -1) end = src.length;
      markupText(out, src, i, end, ''); i = end;
    }
    return out.join('');
  }

  /* C 家族：轻量着色（第一版仅区分注释/字符串/关键字/数字） */
  var C_KEY = ['int', 'float', 'double', 'char', 'void', 'long', 'short', 'unsigned', 'signed',
    'struct', 'union', 'enum', 'const', 'static', 'extern', 'return', 'if', 'else', 'for',
    'while', 'do', 'switch', 'case', 'break', 'continue', 'sizeof', 'typedef', 'class',
    'public', 'private', 'protected', 'namespace', 'using', 'template', 'new', 'delete',
    'bool', 'true', 'false', 'nullptr', 'auto'];

  function tokenizeCFamily(src) {
    var out = '', i = 0, n = src.length;
    while (i < n) {
      var c = src[i];
      if (c === '/' && src[i + 1] === '/') {
        var le = src.indexOf('\n', i); if (le === -1) le = n;
        out += span('c', src.slice(i, le)); i = le; continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        var end = src.indexOf('*/', i + 2);
        end = end === -1 ? n : end + 2;
        out += span('c', src.slice(i, end)); i = end; continue;
      }
      if (c === '"' || c === "'") {
        var q = c, j = i + 1, b = c;
        while (j < n) {
          if (src[j] === '\\' && j + 1 < n) { b += src[j] + src[j + 1]; j += 2; continue; }
          if (src[j] === q) { b += q; j++; break; }
          if (src[j] === '\n') break;
          b += src[j]; j++;
        }
        out += span('s', b); i = j; continue;
      }
      if (c >= '0' && c <= '9') {
        RE_NUM.lastIndex = i; var mn = RE_NUM.exec(src);
        out += span('n', mn[0]); i += mn[0].length; continue;
      }
      RE_IDENT.lastIndex = i;
      var mi = RE_IDENT.exec(src);
      if (mi) {
        var w = mi[0];
        if (C_KEY.indexOf(w) >= 0) out += span('k', w);
        else if (src[i + w.length] === '(') out += span('f', w);
        else out += esc(w);
        i += w.length; continue;
      }
      RE_OP.lastIndex = i;
      var mo = RE_OP.exec(src);
      if (mo) { out += span('o', mo[0]); i += mo[0].length; continue; }
      out += esc(c); i++;
    }
    return out;
  }

  global.HL = { highlight: highlight };
})(window);