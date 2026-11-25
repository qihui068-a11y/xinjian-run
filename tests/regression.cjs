'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const vm = require('node:vm');
const { JSDOM, VirtualConsole } = require('jsdom');
const root = path.resolve(__dirname, '..');
const www = path.join(root, 'modified/assets/www');
const html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(www, 'style.css'), 'utf8');
const results = [];
const languages = [
  ['py', 'Python', 'def greet(name):\n    # 注释\n    return print("你好", name)\n'],
  ['html', 'HTML', '<!DOCTYPE html>\n<!-- 注释 -->\n<main class="box" data-name="x &amp; y"><h1>你好</h1>&lt;done&gt;</main>\n'],
  ['css', 'CSS', '/* 注释 */\n@media (min-width: 480px) {\n  .card:hover, #main { --accent: #aabbcc; color: var(--accent); width: calc(100% - 2rem); content: "<你好>"; }\n}\n'],
  ['java', 'Java', 'public class Main {\n  // 注释\n  public String greet() { return "你好"; }\n}\n'],
  ['json', 'JSON', '{\n  "name": "信笺<>&",\n  "count": -1.5e+2,\n  "ok": true,\n  "items": [false, null]\n}\n'],
  ['js', 'JavaScript', 'export async function greet(name) {\n  const rx = /[a-z]+\\/[0-9]+/gi;\n  const text = `Hi ${name.toUpperCase()} ${1 + 2}`;\n  return true ? text : null;\n}\n'],
  ['xml', 'XML', '<?xml version="1.0"?>\n<!DOCTYPE note [<!ENTITY gt "a>b">]>\n<ns:note id="a&gt;b"><![CDATA[<literal>&raw]]><ns:item enabled="true">你好 &gt;</ns:item></ns:note>\n']
];

async function settle(w) {
  for (let i = 0; i < 12; i++) await Promise.resolve();
  w.__flushFrames();
  for (let i = 0; i < 12; i++) await Promise.resolve();
}
function app(native = false, lanBridge, setup) {
  const errors = [], files = new Map(), vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(e.message));
  const dom = new JSDOM(html, {
    url: 'https://app.xinjian.local/index.html', runScripts: 'outside-only',
    pretendToBeVisual: true, virtualConsole: vc
  });
  const w = dom.window;
  if (lanBridge) w.XinJianLan = lanBridge;
  if (setup) setup(w);
  let nextFrame = 1;
  const frames = new Map();
  w.requestAnimationFrame = cb => { const id = nextFrame++; frames.set(id, cb); return id; };
  w.cancelAnimationFrame = id => frames.delete(id);
  w.__flushFrames = () => {
    const pending = [...frames.values()]; frames.clear();
    for (const cb of pending) cb(performance.now());
  };
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  if (native) {
    w.XinJianBridge = {
      list: () => JSON.stringify([...files].map(([name, text]) => ({ name, size: text.length, ext: name.split('.').pop(), mtime: 1 }))),
      read: name => files.get(name) ?? '',
      exists: name => JSON.stringify(files.has(name)),
      create: (name, text) => { if (files.has(name)) return 'false'; files.set(name, text); return 'true'; },
      write: (name, text) => { files.set(name, text); return 'true'; },
      rename: (from, to) => { if (!files.has(from) || files.has(to)) return 'false'; files.set(to, files.get(from)); files.delete(from); return 'true'; },
      remove: name => JSON.stringify(files.delete(name)), theme() {}, insets: () => ''
    };
  }
  const style = w.document.createElement('style'); style.textContent = css; w.document.head.append(style);
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
    vm.runInContext(fs.readFileSync(path.join(www, src), 'utf8'), dom.getInternalVMContext(), { filename: src });
  }
  return { w, files, errors, close() {
    const view = w.document.querySelector('.view');
    if (view && view.__cleanup) view.__cleanup();
    dom.window.close();
    assert.deepEqual(errors, [], 'uncaught browser errors');
  } };
}
async function test(name, fn) {
  const start = performance.now();
  try {
    await fn();
    results.push({ name, passed: true, ms: Math.round(performance.now() - start) });
    console.log('PASS', name);
  } catch (error) {
    results.push({ name, passed: false, error: error.stack });
    console.error('FAIL', name, error.stack);
  }
}
function preFor(w, src, ext) {
  const pre = w.document.createElement('pre'); pre.innerHTML = w.HL.highlight(src, ext); return pre;
}
function texts(pre, cls) { return [...pre.querySelectorAll('.tk-' + cls)].map(n => n.textContent); }
function input(w, source) {
  const ta = w.document.querySelector('#ta');
  ta.value = source; ta.selectionStart = ta.selectionEnd = source.length;
  ta.dispatchEvent(new w.Event('input', { bubbles: true }));
  return ta;
}

(async () => {
  await test('Complete app boots and offers fourteen unique formats including all seven requested languages', async () => {
    const a = app(); try {
      await settle(a.w);
      assert.match(a.w.document.title, /信笺/);
      assert.match(a.w.document.body.textContent, /书架/);
      a.w.Nav.reset('create'); await settle(a.w);
      const chips = [...a.w.document.querySelectorAll('[data-fmt]')];
      assert.deepEqual(chips.map(n => n.dataset.fmt), ['txt','md','py','html','css','java','json','js','xml','c','cpp','cs','bf','bfh']);
      assert.equal(new Set(chips.map(n => n.dataset.fmt)).size, 14);
      for (const [ext,label] of languages) {
        const text = a.w.document.querySelector('[data-fmt="' + ext + '"]').textContent;
        assert(text.includes(label) && text.includes('.' + ext));
      }
    } finally { a.close(); }
  });
  for (const [ext, label, source] of languages) {
    await test('New ' + ext + ' file defaults to correct extension and opens editable highlighting', async () => {
      const a = app(); try {
        const w = a.w;
        w.Nav.reset('create'); await settle(w);
        w.document.querySelector('[data-fmt="' + ext + '"]').click();
        w.document.querySelector('#nameIpt').value = ext === 'java' ? 'Main' : 'hello';
        w.document.querySelector('[data-act="ok"]').click(); await settle(w);
        const name = (ext === 'java' ? 'Main' : 'hello') + '.' + ext;
        assert.equal(w.Nav.stack.at(-1).params.name, name);
        assert.equal(w.document.querySelector('#stSyn').textContent, label);
        assert.equal(w.document.querySelector('#ta').readOnly, false);
        assert.equal(w.document.querySelector('#ta').wrap, 'off');
        assert.equal(w.document.querySelector('#ca').classList.contains('plain'), false);
        assert.equal(await w.Bridge.read(name), '');
        input(w, source); await settle(w);
        assert.equal(w.document.querySelector('#pre').textContent, source + '\u200b');
        assert(w.document.querySelectorAll('#pre [class^="tk-"]').length > 3, ext + ' has no syntax colors');
        assert.equal(w.document.querySelector('#pre').querySelectorAll('script,style,img,iframe,svg').length, 0);
      } finally { a.close(); }
    });
  }
  await test('Python tokenization: definitions, imports, decorators, numbers, comments, multiline strings', async () => {
    const a = app(); try {
      const src = '@staticmethod\nclass 问候:\n    def greet(name: str) -> str:\n        text = f"你好 {name}"\n        doc = """line1\nline2"""\n        # 注释\n        n = 0xFF + 1_000 + .5e-2 + 2j\n        return True, None, print(text)\n';
      const pre = preFor(a.w, src, 'py');
      assert.equal(pre.textContent, src);
      for (const [kind, words] of [['h',['@staticmethod']], ['k',['class','def','return']], ['t',['问候','str']], ['f',['greet','print']], ['m',['True','None']], ['n',['0xFF','1_000','.5e-2','2j']], ['c',['# 注释']], ['s',['f"你好 {name}"','"""line1\nline2"""']]]) {
        for (const word of words) assert(texts(pre, kind).includes(word), kind + ':' + word);
      }
    } finally { a.close(); }
  });
  await test('Java tokenization: annotation, classes, methods, literals, text blocks and comments', async () => {
    const a = app(); try {
      const src = 'package demo;\npublic class Main {\n  @Override\n  public String run (int n) {\n    // comment\n    /* block\n       comment */\n    String t = """\nhello\nworld\n""";\n    long count = 0xFFL + 1_000L;\n    double f = .5e-2 + 0x1.fp3;\n    boolean ok = true;\n    return null;\n  }\n}\n';
      const pre = preFor(a.w, src, '.JAVA');
      assert.equal(pre.textContent, src);
      for (const [kind, words] of [['h',['@Override']], ['k',['package','public','class','return']], ['t',['Main','String','int','boolean']], ['f',['run']], ['m',['true','null']], ['n',['0xFFL','1_000L','.5e-2','0x1.fp3']]]) {
        for (const word of words) assert(texts(pre, kind).includes(word), kind + ':' + word);
      }
      assert.equal(pre.querySelectorAll('.tk-c').length, 2);
      assert.equal(pre.querySelectorAll('.tk-s').length, 1);
    } finally { a.close(); }
  });
  await test('All languages preserve source and escape HTML; incomplete editing input is accepted', async () => {
    const a = app(); try {
      const samples = ['', '\n', '\t\n\n', '"hello"', 'false', 'null', '0', '"unterminated', "'''unfinished\nnext", 'r"C:\\tmp"', '"\\\"quoted\\\""', '<img src=x onerror=alert(1)> & </span><script>boom()</script>', '中文😀\n\treturn 1\n'];
      for (const ext of ['py','python','pyw','java','html','htm','xhtml','css','js','mjs','cjs','javascript','json','jsonc','xml','svg','xsl','xslt','xsd','rss','c','cpp','cs','bf','bfh','txt','unknown']) {
        for (const src of samples) {
          const pre = preFor(a.w, src, ext);
          assert.equal(pre.textContent, src, ext + ':' + JSON.stringify(src));
          assert.equal(pre.querySelectorAll('script,img,iframe').length, 0);
        }
      }
      for (const [ext] of languages) {
        let seed = 17;
        const alphabet = 'abc0_\"\'\\#/*@()<>;& \n\t中😀';
        for (let j = 0; j < 100; j++) {
          let src = '';
          for (let k = 0; k < 120; k++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; src += alphabet[seed % alphabet.length]; }
          assert.equal(preFor(a.w, src, ext).textContent, src);
        }
      }
    } finally { a.close(); }
  });
  await test('Typing/paste/IME refresh highlighting, preserve caret and synchronize both scroll axes', async () => {
    const a = app(); try {
      const w = a.w;
      await w.Bridge.create('demo.py', ''); w.Nav.reset('editor', { name:'demo.py', mode:'edit' }); await settle(w);
      const source = 'def greet(name):\n    # 说明\n    print("你好", name)\n';
      const ta = input(w, source); ta.selectionStart = ta.selectionEnd = 9;
      ta.scrollTop = 51; ta.scrollLeft = 84;
      ta.dispatchEvent(new w.Event('scroll'));
      await settle(w);
      const pre = w.document.querySelector('#pre');
      assert.equal(pre.textContent, source + '\u200b');
      assert.equal(ta.value, source); assert.equal(ta.selectionStart, 9);
      assert(texts(pre,'k').includes('def')); assert(texts(pre,'s').includes('"你好"'));
      assert.equal(pre.scrollTop,51); assert.equal(pre.scrollLeft,84);
      assert.equal(w.document.querySelector('#gin').style.transform,'translateY(-51px)');
      assert.equal(w.document.querySelector('#gin').querySelectorAll('br').length,4);
      assert.equal(ta.getAttribute('autocapitalize'),'off');
      ta.value += '# 输入完成'; ta.dispatchEvent(new w.Event('compositionend')); await settle(w);
      assert.equal(pre.textContent,ta.value + '\u200b');
    } finally { a.close(); }
  });
  await test('Saving and reopening py/java preserve exact source in native bridge mode', async () => {
    const a = app(true); try {
      const w = a.w;
      for (const [index, src] of ['"hello"','false','null','0','{"a": 1}','def f():\n    return "中😀"\n'].entries()) {
        const name = 'source' + index + (index % 2 ? '.java' : '.py');
        a.files.set(name,src);
        assert.equal(await w.Bridge.read(name),src);
        w.Nav.reset('editor',{name,mode:'edit'}); await settle(w);
        assert.equal(w.document.querySelector('#ta').value,src);
        const changed = src + '\n# unchanged source < > &'; input(w,changed); await settle(w);
        w.document.querySelector('[data-act="done"]').click(); await settle(w);
        assert.equal(a.files.get(name),changed);
        w.Nav.reset('editor',{name,mode:'read'}); await settle(w);
        assert.equal(w.document.querySelector('#ta').value,changed);
      }
    } finally { a.close(); }
  });
  await test('Renaming switches txt -> py -> java -> txt without stale syntax or mode', async () => {
    const a = app(); try {
      const w = a.w;
      await w.Bridge.create('a.txt','public class Main { return null; }\n');
      w.Nav.reset('editor',{name:'a.txt',mode:'edit'}); await settle(w);
      for (const [name,label,plain] of [['a.py','Python',false],['a.java','Java',false],['a.txt','TXT',true]]) {
        w.inputBox = () => w.Promise.resolve(name);
        w.document.querySelector('[data-act="rename"]').click(); await settle(w);
        assert.equal(w.document.querySelector('#stSyn').textContent,label);
        assert.equal(w.document.querySelector('#ca').classList.contains('plain'),plain);
        assert.equal(w.document.querySelector('#ta').wrap,plain?'soft':'off');
        assert.equal(w.Nav.stack.at(-1).params.name,name);
        if (plain) assert.equal(w.document.querySelector('#pre').textContent,'');
        else assert(w.document.querySelector('#pre .tk-k'));
      }
    } finally { a.close(); }
  });
  await test('Save false/rejection leaves input editable and retries keep source', async () => {
    const a = app(); try {
      const w = a.w;
      await w.Bridge.create('fail.py',''); w.Nav.reset('editor',{name:'fail.py',mode:'edit'}); await settle(w);
      input(w,'print("retain me")'); await settle(w);
      const write = w.Bridge.write; let calls=0;
      w.Bridge.write = () => { calls++; return w.Promise.resolve(false); };
      w.document.querySelector('[data-act="done"]').click(); await settle(w);
      assert.equal(w.document.querySelector('#ta').readOnly,false);
      assert.equal(w.document.querySelector('.view').__onBack(),true); await settle(w);
      assert.equal(w.document.querySelector('#ta').readOnly,false);
      w.Bridge.write = () => { calls++; return w.Promise.reject(new Error('test failure')); };
      w.document.querySelector('[data-act="done"]').click(); await settle(w);
      assert.equal(w.document.querySelector('#ta').readOnly,false);
      assert.equal(calls,3);
      w.Bridge.write=write; w.document.querySelector('[data-act="done"]').click(); await settle(w);
      assert.equal(w.document.querySelector('#ta').readOnly,true);
      assert.equal(await w.Bridge.read('fail.py'),'print("retain me")');
    } finally { a.close(); }
  });
  await test('Existing C/BF highlighters and Markdown reading continue to work', async () => {
    const a = app(); try {
      const w = a.w;
      for (const ext of ['c','cpp','cs']) assert(preFor(w,'int main() { return 1; }',ext).querySelector('.tk-k'));
      for (const ext of ['bf','bfh']) assert(preFor(w,'int main() { run(); over! }',ext).querySelector('.tk-m'));
      await w.Bridge.create('note.md','# 标题\n\n**正文**');
      w.Nav.reset('editor',{name:'note.md',mode:'read'}); await settle(w);
      assert.equal(w.document.querySelector('#mdView h1').textContent,'标题');
      assert.equal(w.document.querySelector('.editor-wrap').classList.contains('hidden'),true);
      w.document.querySelector('[data-act="edit"]').click(); await settle(w);
      assert.equal(w.document.querySelector('#ta').value,'# 标题\n\n**正文**');
      assert.equal(w.document.querySelector('#ta').readOnly,false);
    } finally { a.close(); }
  });
  await test('Styles have distinct light/dark syntax colors and matched non-wrapping code layers', async () => {
    const a = app(); try {
      const rules = [...a.w.document.styleSheets[0].cssRules];
      const palette = rules.find(r => r.selectorText === ':root' && r.style.getPropertyValue('--syn-keyword'));
      const dark = rules.find(r => r.selectorText === 'html.dark,body.dark' && r.style.getPropertyValue('--syn-keyword'));
      assert(palette && dark);
      for (const rule of [palette,dark]) {
        const colors=['keyword','string','number','comment','type'].map(k=>rule.style.getPropertyValue('--syn-'+k));
        assert.equal(new Set(colors).size,5);
      }
      assert.match(css,/\.code-area:not\(\.plain\) pre,\.code-area:not\(\.plain\) textarea\{\s*white-space:pre/);
      assert.match(css,/\.code-area pre \[class\^="tk-"\]\{\s*font-weight:400;font-style:normal/);
    } finally { a.close(); }
  });
  await require('./web-cases.cjs')({ test, app, settle, preFor, texts, input, languages });
  await require('./editor-tools.cjs')({ test, app, settle });
  await require('./lan.cjs')({ test, app, settle });
  await test('Large source tokenizer completes without hanging or source loss', async () => {
    const a = app(); try {
      for (const [ext,,line] of languages) {
        const src=line.repeat(Math.ceil(100000 / line.length)), start=performance.now();
        const highlighted=a.w.HL.highlight(src,ext), elapsed=performance.now()-start;
        assert(highlighted.length>src.length);
        assert(elapsed<5000,'tokenizer exceeded 5s: '+elapsed);
        console.log('BENCH',ext,src.length,'characters',Math.round(elapsed),'ms');
      }
    } finally { a.close(); }
  });
  const report={ suite:'XinJian seven-language editor regression', environment:'Node.js '+process.version+' + jsdom 26.1.0; no Android install or pixel-layout test', passed:results.filter(r=>r.passed).length, failed:results.filter(r=>!r.passed).length, results };
  fs.writeFileSync(path.join(__dirname,'results.json'),JSON.stringify(report,null,2)+'\n');
  console.log('TOTAL',report.passed,'passed,',report.failed,'failed');
  if(report.failed) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
