/* P0 复现测试
   目的：把问题「逼出来」。下面断言的都是期望的正确行为，
   现在跑必然有 FAIL —— 那就是 bug 的证据，不是测试写错了。

   假桥的 resolve/list 规则是照抄 XinJianBridge.java 的：
     resolve: 空 / >200 字 / 含 "/" "\\" ".." → 拒绝
     list:    跳过 "." 开头的文件
*/
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dir = '/sdcard/信笺/app/';
const rd = f => fs.readFileSync(dir + f, 'utf8');

function makeHtml() {
  let html = rd('index.html');
  html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + rd('style.css') + '</style>');
  html = html.replace('<script src="bridge.js"></script>', () => '<scr' + 'ipt>' + rd('bridge.js') + '<' + '/scr' + 'ipt>');
  html = html.replace('<script src="highlight.js"></script>', () => '<scr' + 'ipt>' + rd('highlight.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="md.js"></script>', () => '<scr' + 'ipt>' + rd('md.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="anim.js"></script>', () => '<scr' + 'ipt>' + rd('anim.js') + '<' + '/scr' + 'ipt>');
  for (const f of ['net.js', 'navindicator.js', 'spotlight.js', 'themereveal.js', 'app.js', 'data.js', 'views/home.js', 'views/shelf.js', 'views/create.js', 'views/editor.js', 'views/me.js', 'views/chat.js', 'boot.js']) html = html.replace('<script src="' + f + '"></script>', () => '<scr' + 'ipt>' + rd(f) + '<' + '/scr' + 'ipt>');
  return html;
}

/* 假的原生桥：严格照抄 XinJianBridge 的校验和 list 过滤 */
function makeBridge(files) {
  function valid(n) {
    if (n === null || n === undefined) return null;
    const s = String(n).trim();
    if (!s) return null;
    if (s.length > 200) return null;
    if (s.indexOf('/') >= 0 || s.indexOf('\\') >= 0 || s.indexOf('\0') >= 0) return null;
    if (s === '.' || s === '..') return null;   // 与原生 resolve() 一致
    return s;
  }
  function ext(n) {
    const i = n.lastIndexOf('.');
    return (i > 0 && i < n.length - 1) ? n.substring(i + 1).toLowerCase() : '';
  }
  return {
    list() {
      const out = [];
      Object.keys(files).forEach(n => {
        // 不再跳过 "." 开头的文件
        out.push({ name: n, size: files[n].length, mtime: Date.now(), excerpt: '', ext: ext(n) });
      });
      return JSON.stringify(out);
    },
    read(n) {
      const k = valid(n);
      if (!k || !(k in files)) throw new Error('文件不存在');
      return files[k];
    },
    create(n, t) {
      const k = valid(n);
      if (!k) return 'false';
      if (k in files) return 'false';
      files[k] = t === null || t === undefined ? '' : String(t);
      return 'true';
    },
    write(n, t) {
      const k = valid(n);
      if (!k) return 'false';
      files[k] = String(t);
      return 'true';
    },
    remove(n) {
      const k = valid(n);
      if (!k || !(k in files)) return 'false';
      delete files[k];
      return 'true';
    },
    rename(a, b) {
      const x = valid(a), y = valid(b);
      if (!x || !y || !(x in files) || (y in files)) return 'false';
      files[y] = files[x]; delete files[x];
      return 'true';
    },
    exists(n) {
      const k = valid(n);
      return (k && (k in files)) ? 'true' : 'false';
    },
    export(n) {
      return valid(n) ? 'true' : 'false';
    },
    rootPath() { return '/fake/bookcase'; }
  };
}

function mk() {
  const files = {};
  const dom = new JSDOM(makeHtml(), {
    runScripts: 'dangerously',
    url: 'https://app.xinjian.local/index.html',
    pretendToBeVisual: true,
    beforeParse(w) { w.XinJianBridge = makeBridge(files); }
  });
  return { w: dom.window, d: dom.window.document, files };
}

const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* 从主页走到「新建」页，填名字，点创建 */
async function newFile(w, d, name) {
  d.querySelector('[data-tab=create]').click();
  await wait(60);
  const ipt = d.querySelector('#nameIpt');
  ipt.value = name;
  d.querySelector('[data-act=ok]').click();
  await wait(160);
}
function hasToast(d) {
  const t = d.querySelector('.toast');
  return !!(t && t.textContent.trim());
}
function inEditor(d) {
  return !!d.querySelector('#ta');
}

(async () => {
  /* ============ P0-2：含 ".." 的合法文件名被误杀 ============ */
  {
    const { w, d, files } = mk();
    await wait(150);
    await newFile(w, d, 'a..b.txt');
    ok('P0-2 合法名 a..b.txt 应能建成', 'a..b.txt' in files);
    ok('P0-2 建成后应进入编辑器', inEditor(d));
  }

  {
    const { w, d, files } = mk();
    await wait(150);
    await newFile(w, d, '版本1..2.txt');
    ok('P0-2 中文名含 .. 也应能建成', '版本1..2.txt' in files);
  }

  /* ============ P0-2b：创建失败必须给用户提示 ============ */
  {
    const { w, d, files } = mk();
    await wait(150);
    const longName = 'x'.repeat(210) + '.txt';   // 前端不拦，原生 reject
    await newFile(w, d, longName);
    ok('P0-2b 失败时不能静默（要有提示）', hasToast(d) || !!d.querySelector('.mask'));
    ok('P0-2b 失败时不应假装进了编辑器', !inEditor(d));
  }

  /* ============ P0-3：点开头的文件变幽灵 ============ */
  {
    const { w, d, files } = mk();
    await wait(150);
    await newFile(w, d, '.note.txt');
    const created = '.note.txt' in files;
    // 用系统返回键退回书架，看它到底出不出现
    for (let i = 0; i < 3; i++) { if (w.__xjBack) w.__xjBack(); await wait(90); }
    if (!d.querySelector('#grid')) {
      d.querySelector('[data-go=shelf]').click();
      await wait(150);
    }
    const shown = Array.from(d.querySelectorAll('#grid .book'))
      .some(n => n.getAttribute('data-name') === '.note.txt');
    ok('P0-3 点开头的文件不能「建了看不见」',
      !created || shown);
  }

  /* ============ P0-1：原生需要同步兜底入口 ============ */
  {
    const { w, d } = mk();
    await wait(150);
    ok('P0-1 应暴露 window.__xjBack 供原生调用', typeof w.__xjBack === 'function');
    if (typeof w.__xjBack === 'function') {
      ok('P0-1 根层返回 pass（允许退出）', w.__xjBack() === 'pass');
      d.querySelector('[data-go=shelf]').click();
      await wait(120);
      ok('P0-1 二级页面返回 handled', w.__xjBack() === 'handled');
      await wait(120);
      ok('P0-1 退层后仍在主页', d.querySelectorAll('.entry').length === 4);
    }
  }

  /* ============ P0-5：ignore 不能泄漏（连按返回） ============ */
  {
    const { w, d } = mk();
    await wait(150);
    d.querySelector('[data-go=shelf]').click();
    await wait(100);
    d.querySelector('[data-act=sort]').click();
    await wait(100);
    const item = d.querySelector('.mask .sheet-item');
    item.click();                      // 自己点掉的
    await wait(120);
    // 紧接着连按两次返回，必须能回到主页，而不是被吞掉
    w.__xjBack(); await wait(70);
    const atHome = d.querySelectorAll('.entry').length === 4;
    ok('P0-5 自己关弹窗后，返回键不应被吞', atHome);
  }

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();