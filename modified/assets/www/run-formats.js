/* 只向明确选择的在线编译器提交单个文件和标准输入。 */
var RunFormats = (function () {
  'use strict';
  var compilers = Object.create(null);
  function register(extensions, name, compiler) {
    extensions.split(' ').forEach(function (ext) {
      compilers[ext] = { name: name, compiler: compiler };
    });
  }
  register('py pyw python', 'Python 3', 'cpython-3.13.18');
  register('c', 'C', 'gcc-13.2.0-c');
  register('cpp cxx cc c++', 'C++', 'gcc-13.2.0');
  register('cs', 'C# · Mono', 'mono-6.12.0.199');
  register('bf', 'BF · C 兼容模式', 'gcc-13.2.0-c');
  register('bfh', 'BFH · C 兼容模式', 'gcc-13.2.0-c');
  register('java', 'Java', 'openjdk-jdk-22+36');

  // 工程没有 BF 执行规范，兼容模式只编译 C 风格代码、标准库头和嵌套注释。
  function bfSource(source) {
    var parts = [];
    var last = 0;
    var tokens = /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\/|\/\(|^[ \t]*#hand\b[^\n]*|\b(?:so|run_r|over|is)\b[!?]?/gm;
    var token;
    while ((token = tokens.exec(source))) {
      var value = token[0];
      if (value === '/(') {
        var depth = 1, i = tokens.lastIndex;
        while (depth && i < source.length) {
          var c = source.charAt(i++);
          if (c === '(') depth++;
          if (c === ')') depth--;
        }
        if (depth) throw new Error('BF 注释缺少右括号');
        tokens.lastIndex = i;
        value = source.slice(token.index, i).replace(/[^\n]/g, ' ');
      } else if (/^\s*#hand/.test(value)) {
        var header = /^\s*#hand\s+(<[A-Za-z0-9_]+\.h>)\s*$/.exec(value);
        if (!header) throw new Error('BF 兼容模式的 #hand 支持标准库头，例如 #hand <stdio.h>。');
        value = '#include ' + header[1];
      } else if (/^(?:so|run_r|over|is)\b/.test(value)) {
        throw new Error('BF 兼容模式尚不支持此专用语法：' + value);
      }
      parts.push(source.slice(last, token.index), value);
      last = tokens.lastIndex;
    }
    parts.push(source.slice(last));
    return '#include <stdio.h>\n#include <stdbool.h>\n#line 1 "input.bf"\n' + parts.join('');
  }

  function label(ext) {
    if (ext === 'bfh') return '编译检查';
    if (compilers[ext]) return '在线运行';
    if (/^(js|javascript|mjs|cjs)$/.test(ext)) return '运行';
    if (/^(json|jsonc|xml|xsd|xsl|xslt|rss|svg)$/.test(ext)) return '校验';
    if (/^(html|htm|xhtml|css|md|txt)$/.test(ext)) return '预览';
    return '';
  }

  function payload(ext, source, stdin) {
    var out = { compiler: compilers[ext].compiler, code: source, stdin: stdin, save: false };
    if (ext === 'bf' || ext === 'bfh') {
      out.code = bfSource(source);
      if (ext === 'bfh') {
        out.codes = [{ file: 'input.bfh', code: out.code }];
        out.code = '#define main xj_header_main\n#include "input.bfh"\n#undef main\nint main(void) { return 0; }';
      }
      return out;
    }
    if (ext === 'cpp') out.options = 'c++17';
    if (ext !== 'java') return out;
    // 服务固定编译 prog.java。按 public 类型名提交附加源文件，保留原文和行号。
    var tokens = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"""[\s\S]*?"""|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, ' ');
    var type = /\bpublic\s+(?:(?:final|abstract|strictfp|sealed|non-sealed|static)\s+)*(?:class|interface|record|enum)\s+([\w$\u0080-\uFFFF]+)/.exec(tokens);
    if (!type) return out;
    var pkg = /\bpackage\s+([\w$\u0080-\uFFFF]+(?:\s*\.\s*[\w$\u0080-\uFFFF]+)*)\s*;/.exec(tokens);
    var prefix = pkg ? pkg[1].replace(/\s/g, '') + '.' : '';
    var main = prefix + type[1];
    var launcher = type[1] === 'XjLauncher' ? 'XjStart' : 'XjLauncher';
    if (main === 'prog') return out;
    out.codes = [{ file: main.replace(/\./g, '/') + '.java', code: source }];
    out.code = 'class ' + launcher + ' { public static void main(String[] args) throws Throwable { ' + main + '.main(args); } }';
    return out;
  }

  function validate(ext, source) {
    if (ext === 'json' || ext === 'jsonc') {
      var json = source;
      if (ext === 'jsonc') {
        // 保留字符串与换行，让解析错误仍可对应原文。
        json = json.replace(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, function (match) {
          return match.charAt(0) === '/' ? match.replace(/[^\r\n]/g, ' ') : match;
        });
      }
      JSON.parse(json);
      return 'JSON 语法正确';
    }
    var parser = new DOMParser();
    var errorTag = parser.parseFromString('<', 'application/xml').getElementsByTagName('parsererror')[0];
    var doc = parser.parseFromString(source, 'application/xml');
    var error = errorTag && doc.getElementsByTagNameNS(errorTag.namespaceURI, 'parsererror')[0];
    if (error) throw new Error(error.textContent.trim());
    return 'XML 格式正确 · 根元素 ' + doc.documentElement.nodeName;
  }
  return { compilers: compilers, label: label, payload: payload, validate: validate };
})();
