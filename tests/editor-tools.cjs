'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app, settle }) {
  async function open(w, name, value) {
    await w.Bridge.create(name, value);
    w.Nav.reset('editor', { name, mode: 'edit' });
    await settle(w);
    return w.document.querySelector('#ta');
  }

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

  await test('Symbol bar follows the IME with native overlap, visual viewport, and Android resize', async () => {
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
      const isOpen = () => root.classList.contains('editor-ime-visible');
      assert(ta.closest('.editor-view'));
      assert.equal(offset(), '0px');

      // Legacy WebViews can keep both CSS viewports full height.
      w.__xjKeyboardViewport(600, true);
      assert.equal(offset(), '300px');
      assert.equal(isOpen(), true);

      // Modern WebViews can also report the same overlap. It must count once.
      viewport.height = 500;
      viewport.dispatchEvent(new w.Event('resize'));
      assert.equal(offset(), '300px');
      w.__xjKeyboardViewport(0, false);
      assert.equal(offset(), '300px');
      viewport.offsetTop = 20;
      viewport.dispatchEvent(new w.Event('scroll'));
      assert.equal(offset(), '280px');

      // A resized native WebView already ends at the keyboard's upper edge.
      layoutHeight = 500;
      viewport.offsetTop = 0;
      w.__xjKeyboardViewport(0, true);
      assert.equal(offset(), '0px');
      assert.equal(isOpen(), true);
      ta.setSelectionRange(5, 5);
      w.document.querySelector('[data-key="()"]').click();
      assert.equal(ta.value, 'print()');
      assert.equal(ta.selectionStart, 6);
      assert.equal(w.document.activeElement, ta);

      layoutHeight = viewport.height = 800;
      w.__xjKeyboardViewport(0, false);
      assert.equal(offset(), '0px');
      assert.equal(isOpen(), false);
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
