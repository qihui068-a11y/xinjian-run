/* 设置页（改版）测试
   验证：权限设置 / 鸽屋设置 / 关于 三条功能行，关于固定在最底，
   三者各自跳三级页面，返回层级正常。 */
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

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) {
    w.XinJianBridge = {
      list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
      remove: () => 'true', rename: () => 'true', exists: () => 'true',
      export: () => 'true', rootPath: () => '/fake',
      appVersion: () => '9.9.9 (999)'
    };
  }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
const appText = () => (d.getElementById('app') || {}).textContent || '';

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
async function back() {
  const r = w.__xjBack();
  await wait(90);
  return r;
}
async function openSettings() {
  w.Nav.reset('me');
  await wait(160);
  qa('.rows .row').find(n => n.textContent.indexOf('设置') >= 0).click();
  await wait(160);
}

(async () => {
  await wait(180);

  /* ---------- 设置页结构 ---------- */
  await openSettings();
  ok('进入设置', (q('.t-title') || {}).textContent === '设置');
  ok('外观选项已从设置里移走（挪到主页/小家右上角）', !q('#themeChips'));

  const rows = qa('.rows .row');
  const names = rows.map(n => (n.querySelector('.row-t') || {}).textContent);
  ok('三条功能行：权限设置/鸽屋设置/关于',
    names.join(',') === '权限设置,鸽屋设置,关于');
  ok('每条都有图标', qa('.rows .row .row-ico svg').length === 3);
  ok('每条都是可点样式', qa('.rows .row .row-arrow').length === 3);

  /* ---------- 关于固定在最底 ---------- */
  const aboutRow = rows.find(n => n.textContent.indexOf('关于') >= 0);
  ok('关于是列表里的最后一行', rows[rows.length - 1] === aboutRow);
  ok('关于所在容器带 push-bottom（内容不满屏时贴底）',
    !!aboutRow && aboutRow.parentNode.classList.contains('push-bottom'));
  ok('权限/鸽屋不带 push-bottom',
    rows[0].parentNode.classList.contains('push-bottom') === false);

  /* ---------- 权限设置 ---------- */
  rows[0].click();
  await wait(180);
  ok('权限设置进三级页', (q('.t-title') || {}).textContent === '权限设置');
  /* 权限设置已经不是占位页了，改成真页面（演示模式下会提示读不到权限） */
  ok('权限设置不再是占位页', !/占位/.test(appText()));
  ok('三级页无底栏', !q('.tabbar'));
  ok('权限设置返回被接管', await back() === 'handled');
  ok('退回设置', (q('.t-title') || {}).textContent === '设置');

  /* ---------- 鸽屋设置 ---------- */
  qa('.rows .row')[1].click();
  await wait(180);
  ok('鸽屋设置进三级页', (q('.t-title') || {}).textContent === '鸽屋设置');
  /* 0.4 起不再是占位页：要有「后台常驻」开关，且默认是开着 */
  ok('鸽屋设置有后台常驻开关', /后台常驻/.test(appText()));
  ok('后台常驻默认开着', !!q('#pgChips .chip.on') && q('#pgChips .chip.on').dataset.res === '1');
  ok('鸽屋设置显示鸽子窝号', /我的鸽子窝号/.test(appText()));
  await back();

  /* ---------- 关于 ---------- */
  qa('.rows .row')[2].click();
  await wait(180);
  ok('关于进三级页', (q('.t-title') || {}).textContent === '关于');
  ok('关于页版本号来自原生、不是写死的', /版本 9\.9\.9 \(999\)/.test(appText()));
  ok('关于页有图标许可', /Tabler Icons/.test(appText()));
  ok('关于页有需求文档路径', /\/0\/信笺\/要求\.md/.test(appText()));
  ok('关于页不再是弹窗', !q('.mask'));
  ok('关于页返回被接管', await back() === 'handled');
  ok('退回设置', (q('.t-title') || {}).textContent === '设置');

  /* ---------- 设置退回家 ---------- */
  ok('设置返回被接管', await back() === 'handled');
  ok('退回小家', !!q('.me-hero'));

  /* ---------- 小家自己的「关于」行也能进 ---------- */
  qa('.rows .row').find(n => n.textContent.indexOf('关于') >= 0).click();
  await wait(180);
  ok('小家关于行也进关于页', (q('.t-title') || {}).textContent === '关于');
  ok('小家关于行进的也是三级页（有版本号）', /版本 9\.9\.9/.test(appText()));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();