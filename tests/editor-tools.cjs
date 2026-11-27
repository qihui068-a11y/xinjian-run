'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app, settle }) {
  async function open(w, name, value) {
    await w.Bridge.create(name, value);
    w.Nav.reset('editor', { name, mode: 'edit' });
    await settle(w);
    return w.document.querySelector('#ta');
  }

  await test('Editor Enter, Space, Backspace and Tab follow four-column indentation without changing ordinary text', async () => {
    const a = app();
    try {
      const w = a.w;
      const ta = await open(w, 'indent.py', 'def greet(name): # 注释');
      function before(inputType, data, composing = false) {
        const e = new w.InputEvent('beforeinput', { inputType, data, isComposing: composing, bubbles: true, cancelable: true });
        ta.dispatchEvent(e);
        return e.defaultPrevented;
      }
      function caret(start, end = start) { ta.setSelectionRange(start, end); }
      function key(extra = {}) {
        ta.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true, ...extra }));
      }
      caret(ta.value.length);
      assert(before('insertLineBreak'));
      assert.equal(ta.value, 'def greet(name): # 注释\n    ');
      assert.equal(ta.selectionStart, ta.value.length);
      assert(before('insertText', ' '));
      assert(ta.value.endsWith('\n        '));
      assert(before('deleteContentBackward'));
      assert(ta.value.endsWith('\n    '));
      assert(before('insertParagraph'));
      assert(ta.value.endsWith('\n    \n    '));

      ta.value = ' \t    text';
      caret(1);
      assert(before('insertText', ' '));
      assert.equal(ta.selectionStart, 2);
      assert.equal(ta.value, ' \t    text');
      assert(before('deleteContentBackward'));
      assert.equal(ta.value, '    text');
      assert.equal(ta.selectionStart, 0);
      caret(ta.value.length);
      assert(!before('insertText', ' '), 'normal space in code');
      assert(!before('deleteContentBackward'), 'normal deletion in code');
      assert(!before('insertText', ' ', true), 'IME composing');
      ta.value = '    one\n    two\nthree';
      caret(0, 16);
      key();
      assert.equal(ta.value, '        one\n        two\nthree');
      key({ shiftKey: true });
      assert.equal(ta.value, '    one\n    two\nthree');
      ta.value = '    pass';
      caret(2);
      w.document.querySelector('[data-act=indent]').click();
      assert.equal(ta.selectionStart, 4);
      assert.equal(ta.value, '    pass');
    } finally { a.close(); }
  });

  await test('Python indentation distinguishes multi-line headers from bracket colons, strings and empty lines', () => {
    const a = app();
    try {
      const edit = source => a.w.EditorTools.indentEdit(source, source.length, source.length, 'enter', 'py').text;
      for (const [source, expected] of [
        ['async def f(\n    n,\n    ):', '\n    '],
        ['    if value:', '\n        '],
        ['    print("colon:") # :', '\n    '],
        ['    data = {"key":', '\n    '],
        ['    item = values[1:', '\n    '],
        ['msg = ' + '"'.repeat(3) + '\ndef not_code():', '\n'],
        ['def f():\n    ', '\n    ']
      ]) assert.equal(edit(source), expected, source);
    } finally { a.close(); }
  });

  await test('Source errors map to recognized compiler or runtime filenames and skip warnings', () => {
    const a = app();
    try {
      const diagnostics = a.w.EditorDiagnostics;
      const gcc = diagnostics.compilerIssue('/usr/include/other.h:2:1: error: ignore\nprog.cpp:5:3: warning: ignore\nprog.cpp:7:4: error: expected ;', ['prog.cpp']);
      assert.equal(gcc.line, 7);
      assert.equal(gcc.column, 4);
      assert.equal(diagnostics.compilerIssue('prog.cs(8,2): error CS1002: ; expected', ['prog.cs']).line, 8);
      assert.equal(diagnostics.compilerIssue('src/Foo.java:4: error: illegal start', ['src/Foo.java']).line, 4);
      assert.equal(diagnostics.runtimeIssue('Traceback\n  File "main.py", line 3\nNameError: x', 'main.py').line, 3);
      assert.equal(diagnostics.runtimeIssue('SyntaxError: unexpected token\n    at hello (test.js:12:2)', 'test.js').line, 12);
      assert.equal(diagnostics.runtimeIssue('testXjs:4:2', 'test.js'), null);
    } finally { a.close(); }
  });

  await test('Each file type offers formatting and language-specific keys in edit mode', async () => {
    const a = app();
    try {
      const w = a.w;
      for (const format of w.FORMATS) {
        await open(w, 'sample.' + format.ext, '');
        assert(w.document.querySelector('[data-act="format"]'), format.ext);
        assert.equal(w.document.querySelector('.editor-symbols').hidden, false);
        assert(w.document.querySelector('.editor-symbols button'), format.ext);
      }
      await open(w, 'example.java', '');
      const keys = () => [...w.document.querySelectorAll('.editor-symbols button')].map(b => b.textContent);
      assert.deepEqual(keys().slice(0, 4), ['""', '{}', '[]', ';']);
      const originalInputBox = w.inputBox;
      w.inputBox = () => Promise.resolve('example.PYTHON');
      w.document.querySelector('[data-act="rename"]').click();
      await settle(w);
      w.inputBox = originalInputBox;
      assert.equal(keys()[0], ':');
      assert(!keys().includes(';'));
      w.document.querySelector('[data-act="done"]').click();
      await settle(w);
      assert.equal(w.document.querySelector('.editor-symbols').hidden, true);
      assert.equal(w.document.querySelector('[data-act="format"]'), null);
    } finally { a.close(); }
  });

  await test('Paired keys wrap the selection and single keys insert at the caret', async () => {
    const a = app(true);
    try {
      const w = a.w;
      const ta = await open(w, 'Main.java', 'int n');
      const key = label => [...w.document.querySelectorAll('.editor-symbols button')].find(b => b.textContent === label);
      ta.setSelectionRange(4, 5, 'backward');
      key('[]').click();
      assert.equal(ta.value, 'int [n]');
      assert.deepEqual([ta.selectionStart, ta.selectionEnd, ta.selectionDirection], [5, 6, 'backward']);
      ta.setSelectionRange(ta.value.length, ta.value.length);
      key(';').click();
      key('""').click();
      assert.equal(ta.value, 'int [n];""');
      assert.deepEqual([ta.selectionStart, ta.selectionEnd], [9, 9]);
      assert.equal(w.document.activeElement, ta);
      w.document.querySelector('[data-act="done"]').click();
      await settle(w);
      assert.equal(a.files.get('Main.java'), 'int [n];""');
    } finally { a.close(); }
  });

  await test('Symbol bar stays at the keyboard boundary through WebView resize and panning', async () => {
    let viewport;
    let layoutHeight = 800;
    const a = app(false, undefined, w => {
      viewport = Object.assign(new w.EventTarget(), { height: 800, offsetTop: 0, scale: 1 });
      Object.defineProperty(w, 'visualViewport', { value: viewport });
      Object.defineProperty(w, 'devicePixelRatio', { value: 2 });
      Object.defineProperty(w.document.documentElement, 'clientHeight', { get: () => layoutHeight });
    });
    try {
      const w = a.w;
      const ta = await open(w, 'sample.py', 'print');
      const root = w.document.documentElement;
      const offset = () => root.style.getPropertyValue('--editor-ime-offset');
      const top = () => root.style.getPropertyValue('--editor-ime-top');
      const bottom = () => root.style.getPropertyValue('--editor-ime-bottom');
      const isOpen = () => root.classList.contains('editor-ime-visible');
      assert(ta.closest('.editor-view'));
      assert.equal(offset(), '0px');

      // Legacy WebViews can keep both CSS viewports full height.
      w.__xjKeyboardViewport(1000, true);
      assert.equal(offset(), '300px');
      assert.equal(top(), '0px');
      assert.equal(bottom(), '500px');
      assert.equal(isOpen(), true);

      viewport.height = 500;
      viewport.dispatchEvent(new w.Event('resize'));
      assert.equal(offset(), '300px');
      viewport.offsetTop = 20;
      viewport.dispatchEvent(new w.Event('scroll'));
      assert.equal(offset(), '300px');
      assert.equal(top(), '20px');
      assert.equal(bottom(), '500px');
      viewport.height = 470;
      viewport.dispatchEvent(new w.Event('resize'));
      assert.equal(bottom(), '500px');

      // Android may resize the layout without sending another native IME callback.
      layoutHeight = 500;
      viewport.height = 500;
      w.dispatchEvent(new w.Event('resize'));
      assert.equal(offset(), '0px');
      assert.equal(top(), '0px');
      assert.equal(isOpen(), true);
      ta.setSelectionRange(5, 5);
      w.document.querySelector('[data-key="()"]').click();
      assert.equal(ta.value, 'print()');
      assert.equal(ta.selectionStart, 6);
      assert.equal(w.document.activeElement, ta);

      // Use the visual viewport as Android clears its IME insets.
      layoutHeight = 800;
      viewport.offsetTop = 0;
      w.__xjKeyboardViewport(0, false);
      assert.equal(offset(), '300px');
      viewport.height = 800;
      viewport.dispatchEvent(new w.Event('resize'));
      assert.equal(offset(), '0px');
      assert.equal(isOpen(), false);
      assert.equal(bottom(), '');
    } finally { a.close(); }
  });

  await test('Custom symbol controls preserve text, persist by language, and allow removal', async () => {
    const a = app(true);
    try {
      const w = a.w;
      const query = selector => w.document.querySelector(selector);
      const key = raw => [...w.document.querySelectorAll('[data-act="symbol"]')].find(b => b.dataset.key === raw);
      const plus = () => query('[data-act="manageSymbols"]').click();
      async function typeSymbol(raw) {
        await settle(w);
        const field = query('#_ipt');
        field.value = raw;
        field.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true }));
        assert.equal(query('#_ipt'), field);
        field.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await settle(w);
      }
      const raw = '// TODO: ';
      const ta = await open(w, 'Main.java', 'class Main {}');
      ta.setSelectionRange(0, 0);
      plus();
      await typeSymbol(raw);
      key(raw).click();
      assert.equal(ta.value, raw + 'class Main {}');
      await open(w, 'Other.java', '');
      assert(key(raw));
      plus();
      query('.mask .sheet-item').click();
      await typeSymbol(raw);
      assert.equal(query('.toast').textContent, '符号已存在');
      assert.equal([...w.document.querySelectorAll('[data-act="symbol"]')].filter(b => b.dataset.key === raw).length, 1);
      await open(w, 'script.py', '');
      assert.equal(key(raw), undefined);
      await open(w, 'script.pyw', '');
      plus();
      await typeSymbol('<img>→');
      assert.equal(key('<img>→').textContent, '<img>→');
      assert.equal(query('.editor-symbols img'), null);
      await open(w, 'other.python', '');
      assert(key('<img>→'));
      await open(w, 'Again.java', '');
      plus();
      query('.mask [data-i="1"]').click();
      await settle(w);
      assert.equal(key(raw), undefined);
      assert(key('{}'));
      assert.deepEqual(JSON.parse(w.localStorage.getItem('xj:custom-symbols:v1')), { py: ['<img>→'] });
    } finally { a.close(); }
  });

  await test('Format button updates Java source and highlighting without formatting string contents', async () => {
    const a = app(true);
    try {
      const w = a.w;
      const ta = await open(w, 'Main.java', 'class Main{int[] xs={1,2};String sample="};  {";}');
      const source = ta.value;
      ta.setSelectionRange(source.indexOf('sample'), source.indexOf('sample') + 'sample'.length);
      w.document.querySelector('[data-act="format"]').click();
      await settle(w);
      assert.equal(ta.value, 'class Main {\n    int[] xs = {\n        1, 2\n    };\n    String sample = "};  {";\n}');
      assert.equal(ta.value.slice(ta.selectionStart, ta.selectionEnd).trim(), 'sample');
      assert.equal(w.document.querySelector('#pre').textContent, ta.value + '\u200b');
      w.document.querySelector('[data-act="done"]').click();
      await settle(w);
      assert.equal(a.files.get('Main.java'), ta.value);
    } finally { a.close(); }
  });

  await test('Formatting preserves Python blocks, JavaScript ASI, and interpolated strings', () => {
    const a = app();
    try {
      const format = a.w.EditorTools.format;
      const template = '\x60a;\n  \u0024{\x60b{}\x60}\x60';
      const js = 'function example(){const re=/[;{}]/;const text=' + template + ';return\n{text};}';
      const jsResult = format(js, 'mjs');
      assert.match(jsResult, /return\n\s+\{/);
      assert(jsResult.includes(template) && jsResult.includes('/[;{}]/'));
      const pyString = 'f"{", ".join(values)}"';
      const py = 'def example(values):\n  if values:\n   print(' + pyString + ',1)\n  return values\n';
      assert.equal(format(py, 'pyw'), 'def example(values):\n    if values:\n        print(' + pyString + ', 1)\n    return values\n');
      const csString = '$"value={string.Join(", ", input)}"';
      assert(format('class Test{string Value(string[] input){return ' + csString + ';}}', 'cs').includes(csString));
    } finally { a.close(); }
  });

  await test('JSON and JSONC formatting retains numeric spelling and comments and rejects invalid JSON', async () => {
    const a = app();
    try {
      const w = a.w;
      const format = w.EditorTools.format;
      assert.equal(format('{"n":9007199254740993,"n":1e+3}', 'json'), '{\n  "n": 9007199254740993,\n  "n": 1e+3\n}');
      const input = '{"n":[1,2], // keep { ; }\n"t":"  //  ",}';
      const formatted = format(input, 'jsonc');
      assert(formatted.includes('// keep { ; }') && formatted.includes('"  //  "'));
      assert.equal(format(formatted, 'jsonc'), formatted);
      const ta = await open(w, 'broken.json', '{"unfinished":');
      w.document.querySelector('[data-act="format"]').click();
      assert.equal(ta.value, '{"unfinished":');
    } finally { a.close(); }
  });

  await test('Markup, CSS, BF and plain text keep meaningful whitespace', () => {
    const a = app();
    try {
      const format = a.w.EditorTools.format;
      const p = '<p>Keep <em>inner</em> space.</p>';
      const pre = '<pre>a\n  b</pre>';
      assert.equal(format('<main>' + p + pre + '</main>', 'html'), '<main>\n  ' + p + '\n  ' + pre + '\n</main>');
      const xml = '<note xml:space="preserve"><b/> <c/></note>';
      assert.equal(format('<root>' + xml + '</root>', 'xml'), '<root>\n  ' + xml + '\n</root>');
      const css = 'main{a:hover{color:red}background:url(https://example.test/a/*b);--value:a:b;}';
      const cssResult = format(css, 'css');
      assert(cssResult.includes('a:hover {') && cssResult.includes('color: red'));
      assert(cssResult.includes('url(https://example.test/a/*b)'));
      assert(cssResult.includes('--value: a:b'));
      const bf = '#hand <stdio.h>\nint main(){/(a,(b))printf("x  y");}';
      assert(format(bf, 'bf').includes('/(a,(b))printf("x  y");'));
      assert.equal(format('two spaces  ', 'md'), 'two spaces  \n');
      assert.equal(format('two spaces  ', 'txt'), 'two spaces');
    } finally { a.close(); }
  });
};
