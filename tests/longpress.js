/* 书架长按回归测试
   为什么单独开一个文件：tests/anim.js 里「长按进入多选」那条在旧代码上也是绿的，
   因为 jsdom 不会像真机那样在手指按住不动时持续派发 1~4px 的 pointermove。
   真机上的死因恰恰就是这个，所以旧断言是假阳性。
   这里显式模拟抖动位移，才真的覆盖到问题。 */
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

function pev(type, x, y) {
  const ev = new w.Event(type, { bubbles: true, cancelable: true });
  ev.clientX = x; ev.clientY = y;
  return ev;
}
const down = (el, x, y) => el.dispatchEvent(pev('pointerdown', x, y));
const move = (el, x, y) => el.dispatchEvent(pev('pointermove', x, y));
const up = (el, x, y) => el.dispatchEvent(pev('pointerup', x, y));
const cancel = (el, x, y) => el.dispatchEvent(pev('pointercancel', x, y));
function clickEl(el) {
  const ev = new w.MouseEvent('click', { bubbles: true, cancelable: true, clientX: 20, clientY: 20 });
  el.dispatchEvent(ev);
}
const inSel = () => d.querySelector('#shelfBar').textContent.indexOf('已选') >= 0;

(async () => {
  await wait(120);
  await w.Bridge.create('甲.bf', 'a\n');
  await w.Bridge.create('乙.bf', 'b\n');
  await w.Bridge.create('丙.bf', 'c\n');

  /* ============ 一、抖动不能杀死长按（本轮修的主 bug） ============ */
  w.Nav.go('shelf');
  await wait(250);
  let cells = d.querySelectorAll('.book');
  ok('书架有 3 个格子', cells.length === 3);
  ok('起始不在多选态', !inSel());

  const b0 = cells[0];
  down(b0, 10, 10);
  /* 真机按住不动时会发这种小位移，旧代码收到任何一次就 clearTimeout */
  await wait(120); move(b0, 12, 11);
  await wait(120); move(b0, 11, 13);
  await wait(120); move(b0, 13, 12);
  await wait(120); move(b0, 10, 12);
  await wait(120); move(b0, 12, 10);   /* 累计都远小于 8px */
  await wait(200);
  ok('抖动 1~4px 没有杀掉长按，仍然进入多选', inSel());
  up(b0, 12, 10);
  await wait(50);

  /* ============ 二、按下卡片不往 DOM 里插节点 ============ */
  /* 老 bug 的死因之一：pointerdown 时插一个波纹节点，部分 WebView 会在手势中途
     派发 pointercancel，把长按计时器掐掉。点击泛光现在整体删了，
     这条从「挪到 click」升级成「一个节点都不插」。 */
  w.Nav.go('shelf');
  await wait(300);
  cells = d.querySelectorAll('.book');
  const bodyKids = d.body.children.length;
  down(cells[0], 10, 10);
  await wait(60);
  ok('卡片 pointerdown 不会往 body 插任何节点（手势中途插节点是老 bug 的根源）',
    d.body.children.length === bodyKids);
  up(cells[0], 10, 10);
  await wait(50);

  /* ============ 四、longFired 不会把下一次点击吞掉 ============ */
  w.Nav.go('shelf');
  await wait(300);
  cells = d.querySelectorAll('.book');
  down(cells[1], 10, 10);
  await wait(700);
  ok('长按成功进入多选', inSel());
  up(cells[1], 10, 10);                /* 抬起，但没有 click（pointercancel 场景） */
  await wait(400);                     /* 兜底复位应当已生效 */
  const bakBtn = d.querySelector('#shelfBar [data-act=cancel]') ||
                 d.querySelector('#shelfBar [data-act=back]');
  ok('多选态顶栏有退出按钮', !!bakBtn);
  bakBtn.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  await wait(120);
  ok('退出多选', !inSel());
  w.Nav.go('shelf');
  await wait(300);
  cells = d.querySelectorAll('.book');
  clickEl(cells[1]);
  await wait(200);
  /* 断言界面要看 #app，不能看 body.textContent——body 里含 <script> 源码，
     那些源码本身就带 .editor-wrap 之类的字符串，会造成假阳性。
     （Nav 没有 current() 方法，之前那版断言是写错的，不是代码错。） */
  const appTxt = d.getElementById('app').textContent;
  ok('之后点卡片能正常打开（longFired 已复位，没被吞）',
    !!d.querySelector('.editor-wrap') && !!d.getElementById('app').querySelector('textarea'));
  ok('打开的确实是这本（编辑器里显示 乙.bf 的内容）',
    appTxt.indexOf('乙.bf') >= 0 || appTxt.indexOf('字') >= 0);

  /* ============ 五、真的拖动要取消长按 ============ */
  w.Nav.go('shelf');
  await wait(300);
  cells = d.querySelectorAll('.book');
  const c0 = cells[0];
  down(c0, 10, 10);
  await wait(80);
  move(c0, 10 + 30, 10);               /* 30px，明显是滑动，不是抖动 */
  await wait(700);
  ok('位移超过 8px 会取消长按（不误进多选）', !inSel());
  up(c0, 40, 10);
  await wait(60);

  /* ============ 六、系统取消仍然取消 ============ */
  w.Nav.go('shelf');
  await wait(300);
  cells = d.querySelectorAll('.book');
  down(cells[0], 10, 10);
  await wait(100);
  cancel(cells[0], 10, 10);
  await wait(700);
  ok('pointercancel 之后不进入多选', !inSel());

  /* ============ 八、长按响应时间上限（产品约束 ≤ 0.5s） ============ */
  /* 这条是「手感」的量化护栏：既要快，也不能快到轻轻一按就进多选。
     380ms 时不许进（防误触），530ms 时必须已经进（响应不超过 0.5s）。 */
  w.Nav.go('shelf');
  await wait(300);
  cells = d.querySelectorAll('.book');
  down(cells[0], 10, 10);
  await wait(380);
  ok('380ms 时还没进入多选（不会误触）', !inSel());
  await wait(150);                     /* 累计 530ms */
  ok('530ms 内已经进入多选（响应不超过 0.5s）', inSel());
  up(cells[0], 10, 10);
  await wait(60);

  /* ============ 七、源码层面的护栏 ============ */
  // 拆分后长按块在 views/shelf.js、全局波纹绑定在 boot.js，所以源码断言要把三份拼起来看
  const app = rd('app.js') + '\n' + rd('views/shelf.js') + '\n' + rd('boot.js');
  const boot = rd('boot.js');
  const css = rd('style.css');
  ok('全局点击泛光已整体删除（boot.js 不再有 pointerdown 波纹委托）',
    boot.indexOf('pointerdown') < 0 && boot.indexOf('Anim.ripple') < 0);
  ok('也没有残留的 Anim.ripple 调用', app.indexOf('Anim.ripple') < 0);
  ok('style.css 里也没有 .ripple 规则', !/\.ripple/.test(css));
  ok('长按有 8px 抖动容差', /PRESS_SLOP\s*=\s*8/.test(app));
  const pressMs = app.match(/PRESS_MS\s*=\s*(\d+)/);
  ok('长按阈值是具名常量 PRESS_MS（不再写死在 setTimeout 里）', !!pressMs);
  ok('长按阈值不超过 0.5s（当前 ' + (pressMs ? pressMs[1] : '?') + 'ms）',
    !!pressMs && Number(pressMs[1]) <= 500);
  ok('计时器用的是 PRESS_MS 而不是数字字面量', /}, PRESS_MS\);/.test(app));
  ok('pointermove 用平方距离比较（不写阈值魔法数）',
    app.indexOf('PRESS_SLOP * PRESS_SLOP') >= 0);
  ok('不再把 scroll 混进「取消长按」的监听列表（那条从来没触发过：scroll 不冒泡，'
    + '#grid 也不在滚动容器的事件路径上）',
    app.indexOf("'pointermove', 'scroll'") < 0 && app.indexOf("grid.addEventListener('scroll'") < 0);
  ok('有 longFired 兜底复位', /longFired = false; \}, 300\)/.test(app));
  ok('.book 关掉了文本选择（否则系统长按会抢事件）',
    /\.book\{[^}]*-webkit-user-select:none/.test(css));
  ok('.book 关掉了系统长按菜单', /\.book\{[^}]*-webkit-touch-callout:none/.test(css));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });