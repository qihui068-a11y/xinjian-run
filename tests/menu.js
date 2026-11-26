/* 鸽屋 + 号下拉菜单测试
   验证：菜单四项齐全、点空白关闭、返回键只关菜单不退出、
   添加朋友唤起输入框、扫一扫/收付款/发起群聊各进三级占位页。 */
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
      export: () => 'true', rootPath: () => '/fake'
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
/* 打开菜单 */
async function openMenu() {
  q('[data-act=new]').click();
  await wait(120);
}
/* 点某个菜单项（按原始索引：0群聊 1添加 2扫一扫 3分隔 4收付款） */
async function pick(i) {
  const it = q('.pop-item[data-i="' + i + '"]');
  if (it) it.click();
  await wait(150);
}

(async () => {
  await wait(180);

  /* ---------- 进鸽屋 ---------- */
  w.Nav.go('me');
  await wait(150);
  qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0).click();
  await wait(180);
  ok('在鸽屋列表', qa('.pg-item').length >= 1);

  /* ---------- 打开菜单 ---------- */
  await openMenu();
  ok('菜单已弹出', !!q('.pop-menu'));
  const labels = qa('.pop-item span').map(n => n.textContent);
  ok('四项齐全：发起群聊/添加朋友/扫一扫/收付款',
    labels.join(',') === '发起群聊,添加朋友,扫一扫,收付款');
  ok('有分隔线', qa('.pop-sep').length === 1);
  ok('菜单项都有图标', qa('.pop-item svg').length === 4);

  /* ---------- 点空白关闭 ---------- */
  q('.pop').click();
  await wait(120);
  ok('点空白关闭菜单', !q('.pop-menu'));
  ok('关闭后仍在鸽屋', qa('.pg-item').length >= 1);

  /* ---------- 返回键只关菜单，不退出鸽屋 ---------- */
  await openMenu();
  ok('菜单开着时返回键被 Web 接管', await back() === 'handled');
  ok('返回键只关掉菜单', !q('.pop-menu'));
  ok('没有把鸽屋退掉', qa('.pg-item').length >= 1);

  /* 再确认一下：菜单关掉后，返回键才轮到「退鸽屋」 */
  ok('菜单关掉后返回键退鸽屋', await back() === 'handled');
  ok('退回到小家', !!q('.me-hero'));

  /* 回鸽屋继续测各菜单项 */
  qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0).click();
  await wait(180);

  /* ---------- 收付款 ---------- */
  await openMenu();
  await pick(4);
  ok('收付款进了三级页', (q('.t-title') || {}).textContent === '收付款');
  ok('收付款文案正确', /暂未开始发展此业务哦~/.test(appText()));
  ok('三级页返回被接管', await back() === 'handled');
  ok('从收付款退回鸽屋', qa('.pg-item').length >= 1);

  /* ---------- 扫一扫 ---------- */
  await openMenu();
  await pick(2);
  ok('扫一扫进了三级页', (q('.t-title') || {}).textContent === '扫一扫');
  ok('扫一扫文案正确', /想和我一起挑战微信霸权吗？想着吧~/.test(appText()));
  await back();

  /* ---------- 发起群聊 ---------- */
  await openMenu();
  await pick(0);
  ok('发起群聊进了三级页', (q('.t-title') || {}).textContent === '发起群聊');
  ok('发起群聊有占位文案', /群聊/.test(appText()));
  await back();

  /* ---------- 添加朋友 ---------- */
  /* 行为已改：从「附近设备」里挑一台，不再弹名字输入框。
     测试桩没有 netStart，所以这里只能验证降级提示 + 不建假会话。 */
  const before = qa('.pg-item').length;
  await openMenu();
  await pick(1);
  await wait(150);
  ok('添加朋友不再弹输入框', !q('.mask #_ipt'));
  ok('演示模式有提示', /演示模式/.test((q('.toast') || {}).textContent || ''));
  ok('没有凭空建出会话', qa('.pg-item').length === before);
  ok('菜单已关闭', !q('.pop-menu'));
  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();