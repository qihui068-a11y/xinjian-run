/* Source diagnostics stay local while editing, and may include compiler locations after a run. */
var EditorDiagnostics = (function () {
  'use strict';

  var limit = 128 * 1024;
  var syntaxExt = /^(?:py|pyw|python)$/;

  function position(text, source) {
    var coordinate = /\bline\s+(\d+)\s*(?:at\s+)?column\s+(\d+)/i.exec(text);
    if (coordinate) return { line: +coordinate[1], column: +coordinate[2] };
    var offset = /\bposition\s+(\d+)/i.exec(text);
    if (!offset && !/unexpected end|end of (?:json|input)/i.test(text)) return null;
    var before = source.slice(0, offset ? +offset[1] : source.length);
    var lines = before.split('\n');
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
  }

  // Some WebViews omit the position on JSON.parse errors. Find it with a bounded token scan.
  function jsonOffset(source) {
    var at = 0, todo = ['value'];
    var space = /[ \r\n\t]*/y;
    var string = /"(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"/y;
    var scalar = /(?:null|true|false|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/y;
    function skip() { space.lastIndex = at; space.exec(source); at = space.lastIndex; }
    function read(token) {
      token.lastIndex = at;
      if (!token.test(source)) return false;
      at = token.lastIndex;
      return true;
    }
    while (todo.length) {
      skip();
      var state = todo.pop(), c = source[at];
      if (state === 'value') {
        if (c === '{' || c === '[') { at++; todo.push(c === '{' ? 'first-key' : 'first-item'); }
        else if (!read(c === '"' ? string : scalar)) return at;
      } else if (state === 'first-key' || state === 'key') {
        if (state === 'first-key' && c === '}') at++;
        else {
          if (!read(string)) return at;
          todo.push('object-tail', 'value', ':');
        }
      } else if (state === 'first-item') {
        if (c === ']') at++;
        else todo.push('array-tail', 'value');
      } else if (state === 'object-tail' || state === 'array-tail') {
        var object = state === 'object-tail';
        if (c === (object ? '}' : ']')) at++;
        else if (c === ',') {
          at++;
          if (object) todo.push('key');
          else todo.push('array-tail', 'value');
        } else return at;
      } else {
        if (c !== ':') return at;
        at++;
      }
    }
    skip();
    return at;
  }

  function validationIssue(error, source, ext) {
    var point = position(error.message, source);
    if (!point && (ext === 'json' || ext === 'jsonc') && source.length <= limit) {
      var offset = jsonOffset(RunFormats.jsonSource(ext, source));
      point = position('position ' + offset, source);
    }
    return point ? { line: point.line, column: point.column, message: error.message } : null;
  }

  function localIssue(ext, source) {
    if (RunFormats.label(ext) !== '校验') return null;
    try { RunFormats.validate(ext, source); }
    catch (error) { return validationIssue(error, source, ext); }
    return null;
  }

  function attach(report) {
    var timer, python, ticket = 0;
    function pause() {
      clearTimeout(timer);
      ticket++;
      if (python) python.close();
      python = null;
    }
    function schedule(ext, source) {
      var current = ++ticket;
      clearTimeout(timer);
      if (!source.trim() || source.length > limit) { pause(); return; }
      if (syntaxExt.test(ext) && PythonRun.supported(ext)) {
        timer = setTimeout(function () {
          if (!python) python = PythonRun.syntaxSession(function (id, issue) {
            if (id === ticket) report(issue);
          });
          python.check(current, source);
        }, 550);
        return;
      }
      if (python) { python.close(); python = null; }
      if (RunFormats.label(ext) === '校验') {
        timer = setTimeout(function () {
          if (current === ticket) report(localIssue(ext, source));
        }, 400);
      }
    }
    return { schedule: schedule, pause: pause };
  }

  function compilerIssue(text, filenames) {
    if (typeof text !== 'string') return null;
    var rows = text.split('\n');
    for (var i = 0; i < rows.length; i++) {
      var m = /^(.+?):(\d+)(?::(\d+))?:\s*(?:fatal\s+)?error\s*:\s*(.+)/i.exec(rows[i]) ||
        /^(.+?)\((\d+)(?:,(\d+))?\):\s*error\s+(.+)/i.exec(rows[i]);
      if (m && filenames.indexOf(m[1].replace(/\\/g, '/').replace(/^\.\//, '')) !== -1) {
        return { line: +m[2], column: +m[3] || 1, message: m[4] };
      }
    }
    return null;
  }

  function runtimeIssue(text, filename) {
    if (!text || !filename) return null;
    var safe = filename.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
    var pythonFrame = new RegExp('File "' + safe + '", line (\\d+)', 'g');
    var m, last;
    while ((m = pythonFrame.exec(text))) last = m;
    if (last) {
      var message = text.trim().split('\n').pop();
      return { line: +last[1], column: 1, message: message };
    }
    var jsFrame = new RegExp('(?:^|[\\s(])' + safe + ':(\\d+)(?::(\\d+))?(?=[\\s)]|$)');
    m = jsFrame.exec(text);
    return m ? { line: +m[1], column: +m[2] || 1, message: text.trim().split('\n')[0] } : null;
  }

  return { attach: attach, validationIssue: validationIssue, compilerIssue: compilerIssue, runtimeIssue: runtimeIssue };
})();
