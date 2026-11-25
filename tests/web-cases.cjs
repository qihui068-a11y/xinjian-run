'use strict';
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

module.exports = async function ({ test, app, settle, preFor, texts, input, languages }) {
  const sourceFor = ext => languages.find(row => row[0] === ext)[2];
  const colored = (pre, text) => [...pre.querySelectorAll('span[class^="tk-"]')].filter(n => n.textContent === text);
  const noNodes = pre => assert.equal(pre.querySelectorAll('script,style,img,iframe,svg,main,input').length, 0);

  await test('JavaScript distinguishes keywords, regex, division and template interpolation', async () => {
    const a = app(); try {
      const src = sourceFor('js') + 'const ratio = total / 2 / scale;\n// comment\n/* block */ const greeting = "ok";\n';
      const pre = preFor(a.w, src, '.JaVaScRiPt');
      assert.equal(pre.textContent, src); noNodes(pre);
      for (const word of ['export','async','function','const','return']) assert(texts(pre,'k').includes(word), word);
      assert(texts(pre,'f').includes('greet'));
      assert(texts(pre,'f').includes('toUpperCase'), 'template expression not tokenized');
      assert(texts(pre,'n').includes('1') && texts(pre,'n').includes('2'));
      assert(texts(pre,'s').includes('/[a-z]+\\/[0-9]+/gi'), 'regex literal');
      assert.equal(texts(pre,'o').filter(s => s === '/').length, 2, 'division misread as regex');
      assert.equal(pre.querySelectorAll('.tk-c').length, 2);
      assert(texts(pre,'m').includes('true') && texts(pre,'m').includes('null'));
    } finally { a.close(); }
  });

  await test('CSS colors selectors, properties, variables, colors, units, at-rules and functions', async () => {
    const a = app(); try {
      const src = sourceFor('css'), pre = preFor(a.w, src, 'CSS');
      assert.equal(pre.textContent, src); noNodes(pre);
      for (const token of ['color','--accent','#aabbcc','var','calc']) assert(colored(pre, token).length, token);
      assert([...pre.querySelectorAll('span')].some(n => n.textContent.includes('card')));
      assert([...pre.querySelectorAll('span')].some(n => n.textContent.includes('@media')));
      assert(texts(pre,'n').some(t => t.includes('480')));
      assert.equal(pre.querySelectorAll('.tk-c').length, 1);
      assert(texts(pre,'s').includes('"<你好>"'));
    } finally { a.close(); }
  });

  await test('JSON keys differ from values while literals, escaped strings and scientific numbers are colored', async () => {
    const a = app(); try {
      const src = sourceFor('json'), pre = preFor(a.w, src, '.JSON');
      assert.equal(pre.textContent, src); noNodes(pre);
      const key = colored(pre, '"name"')[0], value = colored(pre, '"信笺<>&"')[0];
      assert(key && value && key.className !== value.className);
      assert(texts(pre,'n').includes('-1.5e+2'));
      for (const token of ['true','false','null']) assert(texts(pre,'m').includes(token));
      const escaped = '{"quote":"\\\"x\\\"","path":"C:\\\\tmp","unicode":"\\u4f60"}';
      assert.equal(preFor(a.w, escaped, 'json').textContent, escaped);
    } finally { a.close(); }
  });

  await test('JSONC alias handles line and block comments without affecting JSON strings', async () => {
    const a = app(); try {
      const src = '// 注释\n{"url":"https://example.test/*text*/", /* 中间 */ "a": [true, null, 2]}';
      const pre = preFor(a.w, src, 'jsonc');
      assert.equal(pre.textContent, src);
      assert.equal(pre.querySelectorAll('.tk-c').length, 2);
      assert(texts(pre,'s').includes('"https://example.test/*text*/"'));
    } finally { a.close(); }
  });

  await test('HTML colors markup, attributes, values, entities and comments as source, not rendered content', async () => {
    const a = app(); try {
      const src = sourceFor('html'), pre = preFor(a.w, src, 'html');
      assert.equal(pre.textContent, src); noNodes(pre);
      assert(colored(pre,'main').length && colored(pre,'class').length);
      assert(colored(pre,'"box"').length);
      assert(colored(pre,'&amp;').length && colored(pre,'&lt;').length);
      assert(texts(pre,'c').some(t => t.includes('注释')));
      assert([...pre.querySelectorAll('span')].some(n => n.textContent.includes('<!DOCTYPE')));
    } finally { a.close(); }
  });

  await test('HTML embeds CSS, module JavaScript, JSON, import maps and keeps unknown script types as text', async () => {
    const a = app(); try {
      const src = '<style>.card { color: #123abc; width: 10px; }</style>\n' +
        '<SCRIPT TYPE="module">const cmp = 1 < 2; const text = `Hi ${3 + 4}`; console.log(text);</SCRIPT>\n' +
        '<script type="application/json">{"enabled": true, "n": 42}</script>\n' +
        '<script type="importmap">{"imports":{"demo":"./demo.js"}}</script>\n' +
        '<script type="text/plain"># just text <not-a-tag></script>\n' +
        '<!-- <script>bad()</script> -->\n';
      const pre = preFor(a.w, src, 'html');
      assert.equal(pre.textContent, src); noNodes(pre);
      assert(texts(pre,'k').includes('const'));
      assert(texts(pre,'n').includes('3') && texts(pre,'n').includes('4'));
      assert(texts(pre,'m').includes('true'));
      for (const t of ['color','#123abc','"enabled"','"imports"']) assert(colored(pre,t).length, t);
      assert.equal(colored(pre,'not-a-tag').length, 0);
      assert(texts(pre,'c').some(t => t.includes('<script>bad()')));
    } finally { a.close(); }
  });

  await test('Markup tag names colliding with Object prototypes remain ordinary escaped tags', async () => {
    const a = app(); try {
      const src = '<constructor><div class="demo">中</div></constructor><__proto__>literal</__proto__><toString>text</toString>';
      for (const ext of ['html','xml']) {
        const pre = preFor(a.w,src,ext);
        assert.equal(pre.textContent,src); noNodes(pre);
        assert(colored(pre,'constructor').length && colored(pre,'__proto__').length);
      }
    } finally { a.close(); }
  });

  await test('XML preserves namespaces, declarations, CDATA and internal DOCTYPE subsets with quoted greater-than', async () => {
    const a = app(); try {
      const src = sourceFor('xml'), pre = preFor(a.w, src, 'XML');
      assert.equal(pre.textContent, src); noNodes(pre);
      assert(colored(pre,'ns:note').length && colored(pre,'ns:item').length);
      assert(colored(pre,'id').length);
      assert([...pre.querySelectorAll('span')].some(n => n.textContent.includes('<![CDATA[<literal>&raw]]>')));
      assert([...pre.querySelectorAll('span')].some(n => n.textContent.startsWith('<!DOCTYPE') && n.textContent.endsWith(']>')));
      const xmlScript = '<root><script>const n = 1;</script></root>';
      const second = preFor(a.w, xmlScript, 'xml');
      assert.equal(second.textContent, xmlScript);
      assert(!texts(second,'k').includes('const'), 'XML accidentally treated as HTML script');
    } finally { a.close(); }
  });

  await test('Uppercase and alias extensions open with canonical labels and the same syntax coloring', async () => {
    const a = app(true); try {
      const w = a.w;
      const aliases = [['HTM','html','HTML'],['XHTML','html','HTML'],['MJS','js','JavaScript'],['CJS','js','JavaScript'],['JAVASCRIPT','js','JavaScript'],['JSONC','json','JSON'],['SVG','xml','XML'],['XSL','xml','XML'],['XSLT','xml','XML'],['XSD','xml','XML'],['RSS','xml','XML'],['PYW','py','Python']];
      for (const [alias,ext,label] of aliases) {
        const name = 'alias.' + alias, source = sourceFor(ext);
        a.files.set(name,source);
        w.Nav.reset('editor',{name,mode:'edit'}); await settle(w);
        assert.equal(w.document.querySelector('#stSyn').textContent,label);
        assert.equal(w.document.querySelector('#pre').textContent,source+'\u200b');
        assert.equal(w.HL.highlight(source,alias),w.HL.highlight(source,ext));
      }
    } finally { a.close(); }
  });

  await test('All seven languages save and reopen through the native bridge without color HTML or display sentinels', async () => {
    const a = app(true); try {
      const w = a.w;
      for (const [ext,,source] of languages) {
        const name = 'roundtrip.' + ext;
        a.files.set(name,source);
        w.Nav.reset('editor',{name,mode:'edit'}); await settle(w);
        assert.equal(w.document.querySelector('#ta').value,source);
        const changed = source + '\n\t< > & 中文😀\n\n';
        input(w,changed); await settle(w);
        w.document.querySelector('[data-act="done"]').click(); await settle(w);
        assert.equal(a.files.get(name),changed);
        w.Nav.reset('editor',{name,mode:'read'}); await settle(w);
        assert.equal(w.document.querySelector('#ta').value,changed);
        assert.equal(w.document.querySelector('#pre').textContent,changed+'\u200b');
      }
    } finally { a.close(); }
  });

  await test('Renaming across all seven languages immediately changes status and highlighting without source loss', async () => {
    const a = app(); try {
      const w = a.w;
      await w.Bridge.create('switch.txt',''); w.Nav.reset('editor',{name:'switch.txt',mode:'edit'}); await settle(w);
      for (const [ext,label,source] of languages) {
        input(w,source); await settle(w);
        const name='switch.'+ext;
        w.inputBox=()=>w.Promise.resolve(name);
        w.document.querySelector('[data-act="rename"]').click(); await settle(w);
        assert.equal(w.document.querySelector('#stSyn').textContent,label);
        assert.equal(w.document.querySelector('#ta').value,source);
        assert.equal(w.document.querySelector('#pre').textContent,source+'\u200b');
        assert(w.document.querySelectorAll('#pre span').length>3);
        assert.equal(w.Nav.stack.at(-1).params.name,name);
      }
    } finally { a.close(); }
  });

  await test('Rapid input and composition coalesce per frame for every language and preserve the caret', async () => {
    const a = app(); try {
      const w = a.w, original = w.HL.highlight; let calls=0;
      w.HL.highlight=function(...args){calls++;return original.apply(this,args);};
      for (const [ext,,source] of languages) {
        const name='rapid.'+ext;
        await w.Bridge.create(name,''); w.Nav.reset('editor',{name,mode:'edit'}); await settle(w);
        calls=0;
        for(let i=0;i<25;i++) input(w,source+' '.repeat(i));
        const ta=w.document.querySelector('#ta'); ta.setSelectionRange(3,7);
        ta.dispatchEvent(new w.Event('compositionend')); await settle(w);
        assert.equal(calls,1);
        assert.equal(ta.selectionStart,3); assert.equal(ta.selectionEnd,7);
        assert.equal(w.document.querySelector('#pre').textContent,ta.value+'\u200b');
      }
    } finally { a.close(); }
  });

  await test('Unfinished web syntax, nested templates and malformed markup retain source and terminate promptly', async () => {
    const a = app(); try {
      const samples = ['<div title="unfinished','<!-- unfinished','<![CDATA[unfinished','<!DOCTYPE root [<!ENTITY x ">">', '<?xml version="1.0"','<script>const s = `x ${1 +', '<style>.x { --color: #12', '`outer ${`inner ${1 + 2}`} end`', 'const x = /[a-z', '{"unfinished": "a\\', '@media (min-width: 10px) { .x { color:', '<'.repeat(12000), '${'.repeat(150) + '1' + '}'.repeat(150)];
      for(const ext of ['html','xml','css','js','json']) {
        const start=performance.now();
        for(const src of samples) {
          const pre=preFor(a.w,src,ext);
          assert.equal(pre.textContent,src,ext+':'+src.slice(0,60)); noNodes(pre);
        }
        assert(performance.now()-start<5000,ext+' malformed source exceeded 5s');
      }
    } finally { a.close(); }
  });
};
