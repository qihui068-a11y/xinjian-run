'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app, settle }) {
  await test('HTML offers case-insensitive tags, matching close tags and contextual attributes', () => {
    const a = app();
    try {
      const { w } = a;
      function complete(source, ext = 'html') {
        const cursor = source.indexOf('|');
        const code = source.replace('|', '');
        const pre = w.document.createElement('pre');
        pre.innerHTML = w.HL.highlight(code, ext);
        const result = w.EditorCompletion.suggestions(code, cursor, ext, pre, false);
        return { code, result, items: result ? Array.from(result.items) : [] };
      }
      function insert(source, name, ext) {
        const { code, result, items } = complete(source, ext);
        const item = items.find(choice => choice.name === name);
        assert(item, source + ' -> ' + name);
        return [code.slice(0, result.start) + item.text + code.slice(result.end), result.start + item.caret];
      }

      assert.deepEqual(insert('<|>', 'div'), ['<div>', 4]);
      assert.deepEqual(insert('<DI|', 'div', 'htm'), ['<div', 4]);
      assert.deepEqual(insert('<my|\n<my-widget>ok</my-widget>', 'my-widget'), [
        '<my-widget\n<my-widget>ok</my-widget>', 10
      ]);
      const closed = '<main><img src="a.png"></main>';
      assert.deepEqual(insert('<main><img src="a.png"></|', 'main'), [closed, closed.length]);
      assert.equal(complete('<main><section><p></|>').items[0].name, 'p');
      assert.equal(complete('<main><p></p></|>').items[0].name, 'main');
      assert.deepEqual(insert('<img sr|>', 'src', 'xhtml'), ['<img src="">', 10]);
      assert.deepEqual(insert('<img sr| ="keep">', 'src'), ['<img src ="keep">', 8]);
      assert.deepEqual(insert('<input dis|>', 'disabled'), ['<input disabled>', 15]);
      assert.deepEqual(insert('<div da|>', 'data-'), ['<div data->', 10]);
      for (const source of [
        '<div cl|ass="old">', '<div class="old" cl|>', '<div cl| id="x" class="old">', '<img alt="demo cl|',
        '<img alt= cl|>', '<!-- <di|', '<script>a < di|', '<textarea><di|'
      ]) assert.equal(complete(source).result, null, source);
    } finally { a.close(); }
  });

  await test('Completion covers supported source families, members, and names from the file', () => {
    const a = app();
    try {
      const { w } = a;
      function candidates(ext, source) {
        const pre = w.document.createElement('pre');
        pre.innerHTML = w.HL.highlight(source, ext);
        const result = w.EditorCompletion.suggestions(source, source.length, ext, pre, false);
        return result ? Array.from(result.items, item => item.name) : [];
      }
      for (const [ext, source, want] of [
        ['py', 'pr', 'print'], ['pyw', 'math.sq', 'sqrt'], ['mjs', 'console.lo', 'log'],
        ['js', 'con', 'const'], ['java', 'System.out.prin', 'println'], ['c', 'sca', 'scanf'],
        ['hpp', 'tem', 'template'], ['cs', 'Console.Wri', 'WriteLine'], ['bfh', 'pri', 'printf'],
        ['css', '.box { backg', 'background-color'], ['html', '<hea', 'header'],
        ['xml', '<message/><me', 'message'], ['json', '{"enabled": tr', 'true'],
        ['jsonc', '{"flag": fa', 'false'], ['py', 'local_answer = 42\nlocal_a', 'local_answer'],
        ['py', '计算结果 = 42\n计算', '计算结果']
      ]) assert(candidates(ext, source).includes(want), ext + ' ' + source);
      for (const [ext, source] of [
        ['py', '# pr'], ['py', 'print("pr'], ['py', '"""hello\npr'],
        ['js', 'const x = "console.lo'], ['js', '// console.lo'],
        ['jsonc', '// fa'], ['html', '<!-- <hea'], ['html', 'hea'], ['txt', 'pr'],
        ['java', 'unknown.pr']
      ]) assert.deepEqual(candidates(ext, source), [], ext + ' ' + source);
    } finally { a.close(); }
  });

  await test('Completion uses the existing replacement path and lets unselected Tab keep indenting', async () => {
    const a = app();
    try {
      const { w } = a;
      await w.Bridge.create('hint.py', '');
      w.Nav.reset('editor', { name: 'hint.py', mode: 'edit' });
      await settle(w);
      const area = w.document.querySelector('#ta');
      const list = w.document.querySelector('.editor-completion');
      area.focus();
      async function edit(value, caret = value.length, composing = false) {
        area.value = value;
        area.setSelectionRange(caret, caret);
        area.dispatchEvent(new w.InputEvent('input', { inputType: 'insertText', bubbles: true, isComposing: composing }));
        await settle(w);
      }
      function key(value, extra = {}) {
        const event = new w.KeyboardEvent('keydown', { key: value, cancelable: true, bubbles: true, ...extra });
        area.dispatchEvent(event);
        return event.defaultPrevented;
      }
      function choose(name) {
        const option = Array.from(list.children).find(item => item.firstChild.textContent === name);
        assert(option, name);
        option.click();
      }

      await edit('pr');
      assert.equal(list.hidden, false);
      choose('print()');
      assert.equal(area.value, 'print()');
      assert.equal(area.selectionStart, 6);
      assert.equal(list.hidden, true);

      await edit('pr("已有参数")', 2);
      choose('print');
      assert.equal(area.value, 'print("已有参数")');

      await edit('    pr');
      assert(key('Tab'));
      assert.equal(area.value, '    pr  ');
      await edit('ex');
      assert(key('ArrowDown'));
      assert(area.hasAttribute('aria-activedescendant'));
      assert(key('Enter'));
      assert(list.hidden);
      assert.notEqual(area.value, 'ex');

      await edit('pr');
      assert(key('Escape'));
      assert(list.hidden);
      await edit('pr');
      area.setSelectionRange(1, 1);
      choose('print()');
      assert.equal(area.value, 'pr', 'moving the caret cannot accept stale candidates');

      area.dispatchEvent(new w.CompositionEvent('compositionstart'));
      await edit('pr', 2, true);
      assert(list.hidden);
      area.dispatchEvent(new w.CompositionEvent('compositionend'));
      await settle(w);
      assert(!list.hidden);
      await edit('p');
      assert(list.hidden);
      assert(key(' ', { ctrlKey: true, code: 'Space' }));
      await settle(w);
      assert(!list.hidden);
    } finally { a.close(); }
  });
};
