/* 返回键层级测试
   验证：弹窗 → 二级页面 → 主页 能逐级退；编辑态先存盘退阅读态；根层返回 pass 允许退出。

   注意：原生返回键现在走 window.__xjBack()，不再走 WebView 的 goBack()，
   所以这里也直接调 __xjBack() 来模拟系统返回键。 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dir = '/sdcard/信笺/app/';
const rd = f => fs.readFileSync(dir + f, 'utf8');

let html = rd('index.html');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + rd('style.css') + '</style>');
html = html.replace('<script src="bridge.js"></script>', () => '<scr' + 'ipt>' + rd('bridge.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="highlight.js"></script>', () => '<scr' + 'ipt>' + rd('highlight.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="md.js"></script>', () => '<scr' + 'ipt>' + rd('md.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="anim.js"></script>', () => '<scr' + 'ipt>' + rd('anim.js') + '<' + '/scr' + 'ipt>');
for (const f of ['net.js', 'navindicator.js', 'spotlight.js', 'themereveal.js', 'app.js', 'data.js', 'views/home.js', 'views/shelf.js', 'views/create.js', 'views/editor.js', 'views/me.js', 'views/chat.js', 'boot.js']) html = html.replace('<script src="' + f + '"></script>', () => '<scr' + 'ipt>' + rd(f) + '<' + '/scr' + 'ipt>');

/* 假桥：内存文件表，规则照抄原生 */
const files = { '草稿.txt': '第一行' };
function bridge() {
  function valid(n) {
    const s = String(n == null ? '' : n).trim();
    if (!s || s.length > 200) return null;
    if (s.indexOf('/') >= 0 || s.indexOf('\\') >= 0) return null;
    if (s === '.' || s === '..') return null;
    return s;
  }
  return {
    list() {
      return JSON.stringify(Object.keys(files).map(n => ({
        name: n, size: files[n].length, mtime: Date.now(),
        excerpt: files[n].split('\n')[0].slice(0, 60),
        ext: (n.split('.').pop() || '').toLowerCase()
      })));
    },
    read(n) { const k = valid(n); if (!k || !(k in files)) throw new Error('x'); return files[k]; },
    create(n, t) { const k = valid(n); if (!k || k in files) return 'false'; files[k] = t || ''; return 'true'; },
    write(n, t) { const k = valid(n); if (!k) return 'false'; files[k] = t || ''; return 'true'; },
    remove(n) { const k = valid(n); if (!k || !(k in files)) return 'false'; delete files[k]; return 'true'; },
    rename(a, b) { const x = valid(a), y = valid(b); if (!x || !y || !(x in files) || (y in files)) return 'false'; files[y] = files[x]; delete files[x]; return 'true'; },
    exists(n) { const k = valid(n); return (k && (k in files)) ? 'true' : 'false'; },
    export() { return 'true'; },
    rootPath() { return '/fake'; }
  };
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) { w.XinJianBridge = bridge(); }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
/* 模拟系统返回键：原生调的就是这个 */
async function systemBack() {
  const r = typeof w.__xjBack === 'function' ? w.__xjBack() : 'missing';
  await wait(70);
  return r;
}

(async () => {
  await wait(150);

  ok('起始在主页', d.querySelectorAll('.entry').length === 4);
  ok('根层返回键给 pass（允许退出）', await systemBack() === 'pass');

  /* --- 二级页面 --- */
  d.querySelector('[data-go=shelf]').click();
  await wait(100);
  ok('进入书架', !!d.querySelector('#shelfBar'));
  ok('二级页面返回键被 Web 接管', await systemBack() === 'handled');
  ok('退回了主页', d.querySelectorAll('.entry').length === 4);

  /* --- 弹窗盖在二级页面之上 --- */
  d.querySelector('[data-go=shelf]').click();
  await wait(100);
  d.querySelector('[data-act=sort]').click();
  await wait(100);
  ok('排序弹窗已打开', !!d.querySelector('.mask'));
  ok('弹窗层返回键被接管', await systemBack() === 'handled');
  ok('只关掉了弹窗', !d.querySelector('.mask'));
  ok('关弹窗后仍在书架', !!d.querySelector('#shelfBar'));
  await systemBack();
  ok('再按一次退回主页', d.querySelectorAll('.entry').length === 4);

  /* --- 自己点选关闭弹窗后，返回键不能被吞 --- */
  d.querySelector('[data-go=shelf]').click();
  await wait(100);
  d.querySelector('[data-act=sort]').click();
  await wait(100);
  const item = d.querySelector('.mask .sheet-item');
  if (item) item.click();
  await wait(120);
  ok('点选关闭弹窗', !d.querySelector('.mask'));
  await systemBack();
  ok('自己关过弹窗后，返回键仍能退回主页', d.querySelectorAll('.entry').length === 4);

  /* --- 编辑器编辑态：先存盘退阅读态 --- */
  d.querySelector('[data-go=shelf]').click();
  await wait(180);
  const docEl = Array.from(d.querySelectorAll('#grid *')).filter(n => n.textContent.indexOf('草稿') >= 0).pop();
  ok('书架里能看到文件', !!docEl);
  if (docEl) {
    docEl.click();
    await wait(200);
    ok('进入编辑器', !!d.querySelector('#ta'));
    const editBtn = d.querySelector('[data-act=edit]');
    if (editBtn) editBtn.click();
    await wait(150);
    if (d.querySelector('#ta')) {
      ok('编辑态返回被视图拦下', await systemBack() === 'handled');
      ok('拦下后仍停留在这篇', !!d.querySelector('#ta'));
      const backBtn = d.querySelector('[data-act=leave]');
      if (backBtn) backBtn.click();
      await wait(150);
      ok('离开后回到书架', !!d.querySelector('#shelfBar'));
    } else {
      console.log('SKIP 编辑器未进入编辑态');
    }
  }

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();