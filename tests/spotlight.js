/* 卡片光斑（SpotlightCard 移植）测试

   要点：
   - 三类卡片（主页 .entry / 书架 .book / 鸽屋 .pg-item）都要亮；
   - 鸽屋行只画右半边，坐标要按「右半盒」算，中线左边的坐标必须是负值
     （负值 = 落在伪元素盒子之外，所以左半边不会漏光）；
   - 全过程**不往卡片里插 DOM 节点**（书架长按曾被这个搞挂过）；
   - 关动效就完全不亮；
   - 视图里不许出现挂载代码（纯事件委托，新增的书籍/会话自动生效）。
*/
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
  pretendToBeVisual: true
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

/* jsdom 里所有元素的 getBoundingClientRect 都是 0，光斑坐标算不出来。
   这里给具体元素挂一个假矩形（只影响被测元素，不改全局原型）。 */
function stubRect(el, r) {
  const box = Object.assign({ left: 0, top: 0, width: 300, height: 100 }, r || {});
  box.right = box.left + box.width;
  box.bottom = box.top + box.height;
  el.getBoundingClientRect = () => box;
  return el;
}
function pev(type, x, y, opt) {
  const ev = new w.Event(type, { bubbles: true, cancelable: true });
  ev.clientX = x; ev.clientY = y;
  ev.pointerId = (opt && opt.id !== undefined) ? opt.id : 1;
  ev.pointerType = (opt && opt.type) || 'touch';
  return ev;
}
const down = (el, x, y, o) => el.dispatchEvent(pev('pointerdown', x, y, o));
const move = (el, x, y, o) => el.dispatchEvent(pev('pointermove', x, y, o));
const up = (el, x, y, o) => el.dispatchEvent(pev('pointerup', x, y, o));
const v = (el, k) => el.style.getPropertyValue(k);

(async () => {
  await wait(150);
  const S = w.Spotlight;
  ok('Spotlight 已加载', !!S && typeof S.prepare === 'function');
  ok('选择器覆盖三类卡片', S.CARDS === '.entry, .book, .pg-item');
  ok('只画右半边的是鸽屋行', S.HALF === '.pg-item');

  /* ============ 一、主页三张卡片 ============ */
  w.Nav.go('home');
  await wait(250);
  const entries = Array.from(d.querySelectorAll('.entry'));
  ok('主页有 3 张卡片', entries.length === 3);
  ok('起始没有任何卡片带 .spot', d.querySelectorAll('.spot').length === 0);

  const e0 = stubRect(entries[0], { left: 20, top: 100, width: 160, height: 160 });
  const kidsBefore = e0.childNodes.length;
  down(e0, 60, 140);                 /* 卡片内坐标 = (40, 40) */
  await wait(40);
  ok('按下后卡片挂上 .spot', e0.classList.contains('spot'));
  ok('光斑亮起（--spot-o = 1）', v(e0, '--spot-o') === '1');
  ok('光斑坐标按视口→卡片换算（40px, 40px）',
    v(e0, '--spot-x') === '40.0px' && v(e0, '--spot-y') === '40.0px');
  ok('主页卡片不是半区模式', !e0.classList.contains('spot-half'));
  ok('没有往卡片里插任何节点（长按的老雷）', e0.childNodes.length === kidsBefore);

  move(e0, 140, 240);                /* 卡片内 = (120, 140) */
  await wait(40);
  ok('拖动时跟手', v(e0, '--spot-x') === '120.0px' && v(e0, '--spot-y') === '140.0px');

  /* 连发多次 move，只应渲染最后一帧 */
  move(e0, 50, 110); move(e0, 55, 115); move(e0, 70, 120);
  await wait(40);
  ok('连发 pointermove 只取最后一帧（rAF 合并）', v(e0, '--spot-x') === '50.0px');

  up(e0, 70, 120);
  await wait(40);
  ok('抬手后光斑灭掉（--spot-o = 0）', v(e0, '--spot-o') === '0');
  ok('抬手后不再有活动卡片', S.active() === null);

  /* ============ 二、书架每一本 ============ */
  await w.Bridge.create('甲.bf', 'a\n');
  await w.Bridge.create('乙.bf', 'b\n');
  w.Nav.go('shelf');
  await wait(300);
  let books = Array.from(d.querySelectorAll('.book'));
  ok('书架有 2 本', books.length === 2);

  const b0 = stubRect(books[0], { left: 10, top: 200, width: 120, height: 160 });
  const bkKids = b0.childNodes.length;
  down(b0, 40, 260);                 /* 卡片内 = (30, 60) */
  await wait(40);
  ok('书卡片亮起', b0.classList.contains('spot') && v(b0, '--spot-o') === '1');
  ok('书的坐标正确（30px, 60px）',
    v(b0, '--spot-x') === '30.0px' && v(b0, '--spot-y') === '60.0px');
  ok('书卡片也没被插节点', b0.childNodes.length === bkKids);
  up(b0, 40, 260);
  await wait(30);

  /* 新增的书（重新渲染后才出现）同样自带光斑 —— 这就是「以后新增默认附加」 */
  await w.Bridge.create('丙.bf', 'c\n');
  w.Nav.go('shelf');
  await wait(300);
  books = Array.from(d.querySelectorAll('.book'));
  ok('新增后书架有 3 本', books.length === 3);
  const bNew = stubRect(books[2], { left: 0, top: 300, width: 120, height: 160 });
  down(bNew, 60, 340);
  await wait(40);
  ok('新增的书不用改代码就有光斑', bNew.classList.contains('spot') && v(bNew, '--spot-o') === '1');
  up(bNew, 60, 340);
  await wait(30);

  /* ============ 三、鸽屋每一行（只画右半边） ============ */
  w.Nav.go('pigeon');
  await wait(300);
  const rows = Array.from(d.querySelectorAll('.pg-item'));
  ok('鸽屋至少有一行（内置 FUO）', rows.length >= 1);

  const row = stubRect(rows[0], { left: 0, top: 400, width: 300, height: 72 });
  down(row, 225, 440);               /* 视口 x=225 → 右半盒内 75px */
  await wait(40);
  ok('聊天行挂上 .spot', row.classList.contains('spot'));
  ok('聊天行同时挂上 .spot-half', row.classList.contains('spot-half'));
  ok('右半区坐标减掉半宽（225-150 = 75px）', v(row, '--spot-x') === '75.0px');
  ok('y 不变（440-400 = 40px）', v(row, '--spot-y') === '40.0px');

  /* 中线左边：坐标变负 → 落在右半盒之外，左半边不会漏光 */
  move(row, 60, 440);
  await wait(40);
  ok('中线左边的坐标是负值（左半边不漏光）', parseFloat(v(row, '--spot-x')) < 0);
  up(row, 60, 440);
  await wait(30);

  /* ============ 四、关动效就不画 ============ */
  w.Anim.setEnabled(false);
  w.Nav.go('home');
  await wait(250);
  const h = stubRect(d.querySelectorAll('.entry')[0], {});
  down(h, 30, 30);
  await wait(40);
  ok('关动效后不挂 .spot', !h.classList.contains('spot'));
  ok('关动效后没有活动卡片', S.active() === null);
  w.Anim.setEnabled(true);

  /* ============ 五、源码 / CSS 护栏 ============ */
  const js = rd('spotlight.js');
  const css = rd('style.css').replace(/\s+/g, ' ');
  ok('spotlight.js 不创建任何 DOM 节点（不插节点才不触发 pointercancel）',
    !/createElement|insertBefore|appendChild|innerHTML/.test(js));
  ok('用事件委托（绑在 document 上）', /d\.addEventListener/.test(js));
  ok('坐标写入走 CSS 变量 --spot-x / --spot-y',
    js.indexOf('--spot-x') >= 0 && js.indexOf('--spot-y') >= 0);
  ok('rAF 合并（不每帧硬写）', js.indexOf('requestAnimationFrame') >= 0);
  /* 只查光斑自己的规则：style.css 别处（269 行）本来就有一条 will-change，
     断言写成全局会把别人的规则算进来（那就是假红） */
  ok('光斑规则里没有 will-change（不给每张卡片单独开层）',
    !/\.spot[^{]*\{[^}]*will-change/.test(css));
  ok('CSS：光斑是 ::after 上的 radial-gradient', /\.spot::after\{[^}]*radial-gradient/.test(css));
  ok('CSS：半区靠 width:50% + right:0', /\.spot-half::after\{[^}]*width:50%/.test(css));
  ok('CSS：半区左缘有渐变蒙版（看不出分界）',
    /\.spot-half::after\{[^}]*mask-image:linear-gradient\(to right,transparent/.test(css));
  ok('CSS：半区关掉描边高光（否则中线有硬边）', /\.spot-half::before\{display:none/.test(css));
  ok('CSS：光斑压在正文之下（z-index:-1 + 卡片建层叠上下文）',
    /\.spot\{position:relative;z-index:0/.test(css) &&
    /\.spot::after,\.spot::before\{[^}]*z-index:-1/.test(css));

  /* 视图里不许有挂载代码：证明三类卡片都靠委托自动生效 */
  const views = ['views/home.js', 'views/shelf.js', 'views/chat.js', 'views/me.js']
    .map(f => rd(f)).join('\n');
  ok('四个视图里都没有 Spotlight 挂载代码', views.indexOf('Spotlight') < 0);
  ok('index.html 引了 spotlight.js', rd('index.html').indexOf('src="spotlight.js"') >= 0);
  const build = fs.readFileSync('/sdcard/信笺/android/build.sh', 'utf8');
  ok('build.sh 清单里有 spotlight.js', build.indexOf('spotlight.js') >= 0);

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });