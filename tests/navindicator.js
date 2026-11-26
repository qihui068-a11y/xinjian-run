/* NavIndicator（滑动指示条）测试

   两种形态都测：
     - `block`：新建页的等宽格子用这个。选中格整块填色，允许跨行滑。
     - `line` ：原组件形态（条目下沿一条细线），折行时不滑。

   覆盖移植自 React 版的核心不变式：
     1. 静止时几何写在 CSS 变量上，**不残留内联值**
     2. 只在「真的换了选中项」时才滑；首次量 / 没变化 / 关动效 → 直接落位
     3. 滑动途中再切换 → 重定向，不回到起点重来
     4. transitionend 只认参与动画的属性
     5. 默认不带泛光；指针穿透；颜色走 currentColor / --fg

   jsdom 没有布局引擎，offsetLeft/offsetWidth/offsetTop/offsetHeight 全是 0，
   所以这里给格子打桩几何，才测得到测量与落位这条真实分支。 */
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

/* 给元素打桩几何（jsdom 里这些 offset* 恒为 0） */
function geo(el, left, top, width, height) {
  const def = (k, v) => Object.defineProperty(el, k, { configurable: true, get: () => v });
  def('offsetLeft', left); def('offsetTop', top);
  def('offsetWidth', width); def('offsetHeight', height);
}
function endTransition(bar, prop) {
  const ev = new w.Event('transitionend', { bubbles: true });
  ev.propertyName = prop;
  bar.dispatchEvent(ev);
}

(async () => {
  await wait(120);
  ok('NavIndicator 已加载', !!w.NavIndicator && typeof w.NavIndicator.attach === 'function');

  w.Nav.go('create');
  await wait(150);

  const encWrap = d.querySelector('#encChips');
  const fmtWrap = d.querySelector('#fmtChips');

  /* ================= 一、表格化的结构 ================= */
  ok('编码组是 seg 格子', encWrap.classList.contains('seg') && encWrap.dataset.cols === '3');
  ok('格式组是 seg 格子', fmtWrap.classList.contains('seg') && fmtWrap.dataset.cols === '3');
  ok('格子容器用 grid 等分（不再按文字宽度浮动）',
    cs(encWrap, 'display') === 'grid' && /repeat\(3,\s*1fr\)/.test(rd('style.css')));
  ok('格子没有圆角（连成一张表）',
    cs(encWrap.querySelector('.chip'), 'border-radius') === '0px');

  const encBar = encWrap.querySelector('.ni-bar');
  const fmtBar = fmtWrap.querySelector('.ni-bar');
  ok('两个组各挂一条', w.NavIndicator._handles.length === 2);
  ok('指示条是 block 形态', encBar.classList.contains('block'));
  ok('指示条不可被点（aria-hidden + 指针穿透）',
    encBar.getAttribute('aria-hidden') === 'true' && cs(encBar, 'pointer-events') === 'none');
  ok('容器加了 .ni-root（position:relative 才能量）', cs(encWrap, 'position') === 'relative');
  ok('选中格的底色交给指示条（不留两层填充）',
    /\.chips\.seg\s+\.chip\.on\{background:none/.test(rd('style.css')));
  ok('默认不带泛光（用户明确不要）', !encBar.style.boxShadow);

  /* 还没量到几何时先不显示 */
  ok('未量到几何时指示条不显示', !encBar.classList.contains('on'));

  /* ================= 二、block：首次量 = 直接落位 ================= */
  const encChips = Array.prototype.slice.call(encWrap.querySelectorAll('.chip'));
  ok('编码组 3 格', encChips.length === 3);
  encChips.forEach((c, i) => geo(c, i * 110, 0, 110, 46));

  /* 格式组 12 格，3 列 → 4 行 */
  const fmtChips = Array.prototype.slice.call(fmtWrap.querySelectorAll('.chip'));
  ok('格式组 12 格', fmtChips.length === 12);
  fmtChips.forEach((c, i) => geo(c, (i % 3) * 110, Math.floor(i / 3) * 46, 110, 46));

  w.NavIndicator.syncAll();
  ok('首次量：指示条出现', encBar.classList.contains('on'));
  ok('首次量：几何写进 CSS 变量（整格）',
    encBar.style.getPropertyValue('--ni-left') === '0px' &&
    encBar.style.getPropertyValue('--ni-width') === '110px' &&
    encBar.style.getPropertyValue('--ni-top') === '0px' &&
    encBar.style.getPropertyValue('--ni-height') === '46px');
  ok('首次量：不残留任何内联几何（关键不变式）',
    encBar.style.left === '' && encBar.style.top === '' &&
    encBar.style.width === '' && encBar.style.height === '');
  ok('首次量：没有过渡', encBar.style.transition === '');

  /* ================= 三、换格 → 四属性一起过渡 ================= */
  encChips[2].click();                       /* GBK，left = 220 */
  await wait(20);
  ok('换格后开始滑动（transition 里含 left / top / width / height）',
    /left .*260ms/.test(encBar.style.transition) &&
    /top .*260ms/.test(encBar.style.transition) &&
    /width .*260ms/.test(encBar.style.transition) &&
    /height .*260ms/.test(encBar.style.transition));
  ok('滑动目标 left=220px', encBar.style.left === '220px');
  ok('滑动目标整格高度 46px', encBar.style.height === '46px');

  endTransition(encBar, 'left');
  ok('过渡结束：内联值交还给变量', encBar.style.left === '' && encBar.style.transition === '');
  ok('过渡结束：变量里是新位置', encBar.style.getPropertyValue('--ni-left') === '220px');
  /* 回归护栏（用户报的 bug：切换完块就看不见了）：
     过渡结束会清掉内联 height，如果 CSS 里 .ni-bar 的 height 不走 --ni-height，
     块就会退回 2px 变成一条线，而选中格文字又是 var(--bg)，于是字也没了。 */
  ok('过渡结束：块高度交还给 --ni-height（不退化成 2px 细线）',
    encBar.style.getPropertyValue('--ni-height') === '46px' && encBar.style.height === '');
  ok('CSS：.ni-bar 的 height 走 var(--ni-height)，不是写死 2px',
    /\.ni-bar\{[^}]*height:var\(--ni-height/.test(rd('style.css').replace(/\s+/g, ' ')));

  /* ================= 四、途中再切换 → 重定向 ================= */
  encChips[1].click();                       /* 110px，开始滑 */
  await wait(20);
  ok('滑动中', encBar.style.left === '110px');
  encChips[0].click();                       /* 0px，途中改目标 */
  await wait(20);
  ok('途中切换：目标立刻改成 0px（不回到起点重来）', encBar.style.left === '0px');
  ok('途中切换：过渡还在跑', /left .*260ms/.test(encBar.style.transition));
  endTransition(encBar, 'opacity');
  ok('transitionend 收到 opacity 不收尾', encBar.style.transition !== '');
  endTransition(encBar, 'top');

  /* 点已选中的格 → 不滑 */
  const beforeT = encBar.style.transition;
  encChips[0].click();
  await wait(20);
  ok('点已选中的格不重新滑', encBar.style.transition === beforeT || encBar.style.transition === '');

  /* ================= 五、block 允许跨行滑 ================= */
  fmtChips[0].click();                        /* TXT，第 0 行 */
  await wait(20);
  endTransition(fmtBar, 'left');
  const t0 = fmtBar.style.transition;
  fmtChips[4].click();                        /* C#，index 4 → 第 1 行 */
  await wait(20);
  ok('块形态跨行也会滑（跨行移动一块有物理意义）', fmtBar.style.transition !== '' && t0 === '');
  ok('跨行目标 top = 46px', fmtBar.style.top === '46px');
  ok('跨行目标 left = 110px', fmtBar.style.left === '110px');
  endTransition(fmtBar, 'top');
  ok('跨行结束后 top 也交还变量', fmtBar.style.top === ''
    && fmtBar.style.getPropertyValue('--ni-top') === '46px');

  /* ================= 六、关掉动效 → 直接落位 ================= */
  w.Anim.setEnabled(false);
  encChips[1].click();
  await wait(20);
  ok('关闭动效后不滑，直接落位', encBar.style.transition === '');
  ok('关闭动效后位置照样正确', encBar.style.getPropertyValue('--ni-left') === '110px');
  w.Anim.setEnabled(true);

  /* ================= 七、离开视图要拆干净 ================= */
  w.Nav.back();
  await wait(150);
  ok('离开视图后两个句柄都被销毁', w.NavIndicator._handles.length === 0);

  /* ================= 八、line 形态（原组件行为）仍然可用 ================= */
  const box = d.createElement('div');
  box.className = 'chips';
  box.innerHTML = '<button class="chip on">A</button><button class="chip">B</button>' +
    '<button class="chip">C</button>';
  d.body.appendChild(box);
  const lineChips = Array.prototype.slice.call(box.querySelectorAll('.chip'));
  lineChips.forEach((c, i) => geo(c, i * 70, 0, 60, 30));

  const h = w.NavIndicator.attach(box);
  const lineBar = box.querySelector('.ni-bar');
  ok('line 形态：细线（高度 = thickness，走变量也一样）',
    lineBar.style.getPropertyValue('--ni-height') === '2px' && lineBar.style.height === '');
  ok('line 形态：贴在格子下沿（top = 高度）',
    lineBar.style.getPropertyValue('--ni-top') === '30px');
  ok('line 形态：宽度跟着条目（60px）',
    lineBar.style.getPropertyValue('--ni-width') === '60px');
  ok('line 形态：不残留内联 left', lineBar.style.left === '');

  /* 换到第 3 格（原来选中的是第 1 格，必须把它也取消，否则 activeItem 仍返回它） */
  lineChips[0].classList.remove('on');
  lineChips[2].classList.add('on');
  h.sync();
  ok('line 形态：换项时只动 left/width，不动 top [' + lineBar.style.transition + ']',
    /left .*260ms/.test(lineBar.style.transition) &&
    !/top .*260ms/.test(lineBar.style.transition));
  endTransition(lineBar, 'width');

  /* 折行 → 直接落位不滑 */
  geo(lineChips[2], 10, 40, 60, 30);
  lineChips[2].classList.remove('on');
  lineChips[1].classList.add('on');
  h.sync();
  ok('line 形态：折行时直接落位不滑', lineBar.style.transition === '');
  h.destroy();
  ok('手动挂的句柄也能销毁', w.NavIndicator._handles.length === 0);

  /* ================= 九、源码护栏 ================= */
  const src = rd('navindicator.js');
  ok('几何写在 CSS 变量上（不是死写内联）',
    src.indexOf('--ni-left') >= 0 && src.indexOf('--ni-height') >= 0);
  ok('过渡结束会把内联值清空', /bar\.style\.left = ''/.test(src) && /bar\.style\.top = ''/.test(src));
  ok('有折行判断，且只对 line 形态生效', /!isBlock && isWrapped/.test(src));
  ok('减少动效走 Anim 开关', src.indexOf('Anim.enabled') >= 0);
  ok('glow 默认关', /glow: false/.test(src));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });