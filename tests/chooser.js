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

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* 只取 #app 的文本，不把 <script> 里的源码算进来（假阳性铁律） */
const appText = () => d.getElementById('app').textContent;

(async () => {
  await wait(100);
  d.querySelector('[data-go=shelf]').click();
  await wait(120);

  /* ============ 顶栏 + 号 ============ */
  const plusBtn = d.querySelector('#shelfBar [data-act=import]');
  ok('书架顶栏有 + 按钮', !!plusBtn);
  ok('+ 按钮带 data-act=import', plusBtn && plusBtn.dataset.act === 'import');
  ok('+ 按钮里是 plus 图标（不是文字）', plusBtn && !!plusBtn.querySelector('svg'));
  ok('+ 按钮在顶栏最右', plusBtn && plusBtn === d.querySelector('#shelfBar').lastElementChild);

  /* ============ 隐藏 input ============ */
  const imp = d.querySelector('#importer');
  ok('存在文件 input', !!imp);
  ok('input type=file', imp && imp.type === 'file');
  ok('input 支持多选', imp && imp.multiple === true);

  /* 关键回归：display:none 的 input 在部分 WebView 里 click() 无效 */
  ok('input 没有 hidden 类（不能是 display:none）', imp && !imp.classList.contains('hidden'));
  const st = (imp.getAttribute('style') || '').replace(/\s/g, '');
  ok('input 用移出屏幕的方式隐藏', st.indexOf('left:-9999px') >= 0);
  ok('input 透明但仍在布局里', st.indexOf('opacity:0') >= 0);
  ok('input 尺寸被压到 1px', st.indexOf('width:1px') >= 0 && st.indexOf('height:1px') >= 0);

  /* ============ 点 + 是否真的把 input 点开了 ============ */
  let clicked = 0;
  imp.click = function () { clicked++; };

  /* 监听 value 的写入：file input 的 value 只允许赋 ''，
     这里只统计“被重置为 '' 的次数”，用来验证 app 允许重复选同一个文件 */
  let resets = 0;
  const vdesc = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value');
  Object.defineProperty(imp, 'value', {
    configurable: true,
    get: function () { return vdesc.get.call(imp); },
    set: function (v) { if (v === '') resets++; else vdesc.set.call(imp, v); }
  });

  plusBtn.click();
  await wait(30);
  ok('点 + 调用了 input.click()', clicked === 1);
  ok('点 + 之前把 value 重置为 \'\'（否则同一个文件选第二次没反应）', resets === 1);

  plusBtn.click();
  await wait(30);
  ok('再点一次仍然触发（不是一次性的）', clicked === 2);
  ok('每次点都重置 value', resets === 2);

  /* ============ 选完文件 → FileReader → 入库 ============ */
  const before = (await w.Bridge.list()).length;

  const f1 = new w.File(['第一种内容 ABC'], '导入一.txt', { type: 'text/plain' });
  Object.defineProperty(imp, 'files', { value: [f1], configurable: true });
  imp.dispatchEvent(new w.Event('change'));
  await wait(200);

  const after1 = await w.Bridge.list();
  ok('选完文件后书架多了一条', after1.length === before + 1);
  const got1 = after1.filter(x => x.name === '导入一.txt')[0];
  ok('文件名按原样入库', !!got1);
  const txt1 = got1 ? await w.Bridge.read('导入一.txt') : '';
  ok('内容按文本写入', txt1.indexOf('第一种内容 ABC') >= 0);

  /* ============ 多选：一次拿两个 ============ */
  const before2 = (await w.Bridge.list()).length;
  const f2 = new w.File(['第二个'], '导入二.txt', { type: 'text/plain' });
  const f3 = new w.File(['第三个'], '导入三.txt', { type: 'text/plain' });
  Object.defineProperty(imp, 'files', { value: [f2, f3], configurable: true });
  imp.dispatchEvent(new w.Event('change'));
  await wait(250);

  const after2 = await w.Bridge.list();
  ok('多选两个都入库', after2.length === before2 + 2);
  ok('多选文件名都正确',
    after2.some(x => x.name === '导入二.txt') && after2.some(x => x.name === '导入三.txt'));

  /* ============ 空选择不崩、不建垃圾 ============ */
  const before3 = (await w.Bridge.list()).length;
  Object.defineProperty(imp, 'files', { value: [], configurable: true });
  imp.dispatchEvent(new w.Event('change'));
  await wait(80);
  ok('空选择不新建任何文件', (await w.Bridge.list()).length === before3);

  /* ============ 导入后页面上的反映 ============ */
  ok('书架格子渲染出导入的书', d.querySelectorAll('.book').length >= 3);
  ok('页面文本含导入的文件名', appText().indexOf('导入一.txt') >= 0);

  /* ============ 原生侧：源码级断言（防止回调被误删） ============ */
  const ma = fs.readFileSync('/sdcard/信笺/android/app/src/main/java/tt/xinjian/cn/MainActivity.java', 'utf8');
  ok('原生实现了 onShowFileChooser', ma.indexOf('public boolean onShowFileChooser') >= 0);
  ok('原生有 REQ_FILE_CHOOSER 常量', ma.indexOf('REQ_FILE_CHOOSER') >= 0);
  ok('原生持有 ValueCallback<Uri[]> 句柄', ma.indexOf('ValueCallback<Uri[]> filePathCallback') >= 0);
  ok('取消也必须回调（cb.onReceiveValue(uris) 在 if 外）',
    /try \{ cb\.onReceiveValue\(uris\); \}/.test(ma));
  ok('onActivityResult 先处理文件选择器再兜底 return',
    ma.indexOf('if (req == REQ_FILE_CHOOSER)') < ma.indexOf('if (req != REQ_PICK_IMAGE'));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();