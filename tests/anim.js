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
const cs = (el, k) => w.getComputedStyle(el).getPropertyValue(k);
const down = (el, x, y) => {
  const ev = new w.Event('pointerdown', { bubbles: true });
  ev.clientX = x; ev.clientY = y;
  el.dispatchEvent(ev);
};
/* 轮询等待某个条件成立。原来这里是写死 wait(750) 等长按触发，
   长按阈值从 600 调到 450、动画从 .24s 收到 .16s 之后，
   750ms 时动画类已经被摘掉了，写死的等待反而抓不到中间态。 */
async function until(fn, ms) {
  const t0 = Date.now();
  ms = ms || 1500;
  while (Date.now() - t0 < ms) {
    if (fn()) return true;
    await wait(20);
  }
  return false;
}

(async () => {
  await wait(120);

  /* ================= 一、Anim 模块 ================= */
  const A = w.Anim;
  ok('Anim 已加载（只剩 stagger）', !!A && typeof A.stagger === 'function');
  ok('默认开启动效', A.enabled() === true);

  /* ---- 点击泛光已按需求删除：这里全改成「删除」护栏 ---- */
  const css0 = rd('style.css');
  ok('Anim 上已经没有 ripple()', typeof A.ripple === 'undefined');
  ok('style.css 里没有 .ripple 规则', !/\.ripple/.test(css0));
  ok('style.css 里没有 xjRipple 关键帧', css0.indexOf('xjRipple') < 0);
  ok('boot.js 里不再绑 pointerdown 波纹委托',
    rd('boot.js').indexOf('pointerdown') < 0 && rd('boot.js').indexOf('Anim.ripple') < 0);

  w.Nav.go('shelf');
  await wait(150);
  const plusBtn = d.querySelector('#shelfBar [data-act=import]');
  ok('找到书架 + 按钮', !!plusBtn);
  down(plusBtn, 5, 5);
  await wait(30);
  ok('按下按钮不再产生任何波纹层/节点',
    !d.querySelector('.ripple-layer') && d.querySelectorAll('.ripple').length === 0);

  /* 输入框里按下同样不会有浮层 */
  w.Nav.go('create');
  await wait(150);
  down(d.querySelector('#nameIpt'), 5, 5);
  await wait(30);
  ok('输入框里按下也不产生浮层',
    !d.querySelector('.ripple-layer') && d.querySelectorAll('.ripple').length === 0);

  /* ---- 胶囊展开（Expanding Tag Selection） ---- */
  const fmtChips = d.querySelector('#fmtChips');
  const chips = fmtChips.querySelectorAll('.chip');
  ok('格式胶囊有 12 个（BF/BFH 撤下，新增 7 种语言）', chips.length === 12);
  const allHaveDetail = Array.prototype.every.call(
    chips, c => !!c.querySelector('.chip-detail'));
  ok('每个胶囊都有细节位', allHaveDetail);

  const mdChip = Array.prototype.filter.call(chips, c => c.dataset.fmt === 'md')[0];
  ok('找到 Markdown 胶囊', !!mdChip);
  ok('默认选中 TXT', chips[0].classList.contains('on'));
  ok('未选中胶囊细节收起（max-width:0）',
    cs(mdChip.querySelector('.chip-detail'), 'max-width') === '0px' ||
    cs(mdChip.querySelector('.chip-detail'), 'max-width') === '0');

  const nodeBefore = mdChip;
  mdChip.click();
  await wait(60);
  ok('点了之后该胶囊变选中', nodeBefore.classList.contains('on'));
  ok('原选中项取消', !chips[0].classList.contains('on'));
  ok('胶囊节点没被重建（transition 才能播）',
    d.querySelector('#fmtChips .chip[data-fmt=md]') === nodeBefore);
  ok('选中后细节展开（max-width 变大）',
    cs(nodeBefore.querySelector('.chip-detail'), 'max-width') !== '0px');

  /* ---- Staggered Block Selection ---- */
  await w.Bridge.create('甲.bf', 'a\n');
  await w.Bridge.create('乙.bf', 'b\n');
  await w.Bridge.create('丙.bf', 'c\n');
  w.Nav.go('shelf');
  await wait(250);
  const cells = d.querySelectorAll('.book');
  ok('书架有 3 个格子', cells.length === 3);

  /* 长按第一格进入多选。用轮询而不是写死等待：长按一触发就立刻查中间态，
     否则动画（.16s + 错峰）会在固定等待期间跑完，护栏反而抓不到东西。 */
  down(cells[0], 10, 10);
  await until(() => d.querySelector('#shelfBar').textContent.indexOf('已选') >= 0);
  ok('长按进入了多选态（顶栏出现「已选」）',
    d.querySelector('#shelfBar').textContent.indexOf('已选') >= 0);

  const marks = d.querySelectorAll('.book');
  const delays = Array.prototype.map.call(marks, m => m.style.getPropertyValue('--stg-delay'));
  ok('每个格子都被排了延迟', delays.every(x => /ms$/.test(x)));
  const nums = delays.map(x => parseInt(x, 10));
  ok('从下往上：最后一格延迟最小', nums[nums.length - 1] === 0);
  ok('错峰步长 24ms', nums[0] === 24 * (nums.length - 1));
  ok('动画类已挂上', Array.prototype.some.call(marks, m => m.classList.contains('stg-run')));

  /* 动画跑完后类要摘掉，回到静止态 */
  await wait(500);
  ok('动画结束后不再残留 stg-run',
    !Array.prototype.some.call(d.querySelectorAll('.book'), m => m.classList.contains('stg-run')));

  /* ================= 二、关掉动效 ================= */
  A.setEnabled(false);
  ok('关闭后 enabled() 为假', A.enabled() === false);
  ok('开关写进了 localStorage', w.localStorage.getItem('xj:anim') === 'off');

  /* 关掉后：也不会有任何浮层（泛光已经不存在了，这里守着别再加回来） */
  w.Nav.go('shelf');
  await wait(200);
  down(d.querySelector('#shelfBar [data-act=import]'), 5, 5);
  await wait(30);
  ok('关闭动效后仍然没有任何浮层',
    !d.querySelector('.ripple-layer') && d.querySelectorAll('.ripple').length === 0);

  /* 关掉后：错峰只落终态，不加动画类 */
  const c2 = d.querySelectorAll('.book');
  down(c2[0], 10, 10);
  await wait(750);
  const marks2 = d.querySelectorAll('.book');
  ok('关闭动效后进入多选仍是多选态',
    d.querySelector('#shelfBar').textContent.indexOf('已选') >= 0);
  ok('关闭动效后不打动画类',
    !Array.prototype.some.call(marks2, m => m.classList.contains('stg-run')));

  /* ================= 三、设置页开关 ================= */
  A.setEnabled(true);
  w.Nav.go('settings');
  await wait(200);
  const animChips = d.querySelector('#animChips');
  ok('设置页有动效开关', !!animChips);
  const onChip = animChips.querySelector('[data-anim="1"]');
  const offChip = animChips.querySelector('[data-anim="0"]');
  ok('默认显示「开启」为选中', onChip.classList.contains('on'));

  offChip.click();
  await wait(60);
  ok('点关闭后 Anim 关闭', A.enabled() === false);
  ok('关闭项变成选中', offChip.classList.contains('on'));

  onChip.click();
  await wait(60);
  ok('点开启后恢复', A.enabled() === true);

  /* ================= 四、CSS 层面的护栏 ================= */
  const css = rd('style.css');
  ok('有 prefers-reduced-motion 兜底', css.indexOf('prefers-reduced-motion: reduce') >= 0);
  ok('滑动指示条是指针穿透的', /\.ni-bar\{[^}]*pointer-events:none/.test(css.replace(/\n/g, '')));
  ok('错峰升起的动画还在，泛光的关键帧已经没了',
    css.indexOf('@keyframes xjStg') >= 0 && css.indexOf('xjRipple') < 0);

  /* 引用的 js 都在 build.sh 清单里，别重演 md.js 那次的漏拷贝 */
  const build = fs.readFileSync('/sdcard/信笺/android/build.sh', 'utf8');
  ok('build.sh 带上了 anim.js', build.indexOf('anim.js') >= 0);
  ok('build.sh 带上了 md.js', build.indexOf('md.js') >= 0);
  ok('build.sh 带上了 navindicator.js', build.indexOf('navindicator.js') >= 0);

  /* 拆分后的强校验：index.html 里引用的每个 js 都必须在 build.sh 的 WEBFILES 里。
     漏一个的表现是「测试全绿、装机即崩」，而且 aapt 不报错。这个坑踩过三次。 */
  const idxHtml = fs.readFileSync('/sdcard/信笺/app/index.html', 'utf8');
  const refs = [];
  idxHtml.replace(/<script src="([^"]+)"><\/script>/g, (m, f) => { refs.push(f); return m; });
  const notInBuild = refs.filter(f => build.indexOf(f) < 0);
  ok('index.html 引用的 ' + refs.length + ' 个 js 全在 build.sh 清单里（缺：'
    + (notInBuild.join(',') || '无') + '）', refs.length > 0 && notInBuild.length === 0);
  ok('build.sh 建了 views/ 子目录（否则 cp 直接失败）',
    build.indexOf('mkdir -p "$OUT/assets/www/views"') >= 0);
  ok('index.html 的加载顺序是对的（app.js 最先、boot.js 最后）',
    refs[refs.length - 1] === 'boot.js' && refs.indexOf('app.js') >= 0
    && refs.indexOf('app.js') < refs.indexOf('data.js')
    && refs.indexOf('data.js') < refs.indexOf('views/home.js'));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();