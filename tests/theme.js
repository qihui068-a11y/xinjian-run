/* 主题测试（两件事）
   A. 主题开关从设置搬到「主页天气条右侧 + 小家右上角」，且同步原生 / 落本地存储这条老链路不能坏；
   B. 移植过来的 ThemeReveal：圆形揭示（View Transitions + clip-path）的圆心 / 半径 / 只动新层 /
      过渡中再点重定向 / 离开视图收尾 / 关动效不走过渡。

   jsdom 没有 `document.startViewTransition`，也没有布局引擎，所以：
     - 兜底分支是「真的」在跑（我们直接测它）；
     - 揭示分支靠打桩：`startViewTransition` 返回可控的 ready、`Element.prototype.animate` 记账。 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dir = '/sdcard/信笺/app/';
const rd = f => fs.readFileSync(dir + f, 'utf8');

function buildHtml() {
  let html = rd('index.html');
  html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + rd('style.css') + '</style>');
  html = html.replace('<script src="bridge.js"></script>', () => '<scr' + 'ipt>' + rd('bridge.js') + '<' + '/scr' + 'ipt>');
  html = html.replace('<script src="highlight.js"></script>', () => '<scr' + 'ipt>' + rd('highlight.js') + '<' + '/scr' + 'ipt>');
  html = html.replace('<script src="md.js"></script>', () => '<scr' + 'ipt>' + rd('md.js') + '<' + '/scr' + 'ipt>');
  html = html.replace('<script src="anim.js"></script>', () => '<scr' + 'ipt>' + rd('anim.js') + '<' + '/scr' + 'ipt>');
  for (const f of ['net.js', 'navindicator.js', 'spotlight.js', 'themereveal.js', 'app.js', 'data.js', 'views/home.js', 'views/shelf.js', 'views/create.js', 'views/editor.js', 'views/me.js', 'views/chat.js', 'boot.js']) html = html.replace('<script src="' + f + '"></script>', () => '<scr' + 'ipt>' + rd(f) + '<' + '/scr' + 'ipt>');
  return html;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* themeCalls 记录原生收到的每一次主题通知；setup 用来在脚本执行前打桩 */
function boot(withNative, themeCalls, setup) {
  const dom = new JSDOM(buildHtml(), {
    runScripts: 'dangerously',
    url: 'https://app.xinjian.local/index.html',
    pretendToBeVisual: true,
    beforeParse(w) {
      if (withNative) {
        w.XinJianBridge = {
          list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
          remove: () => 'true', rename: () => 'true', exists: () => 'true',
          export: () => 'true', rootPath: () => '/fake',
          theme: v => { themeCalls.push(v); },
          /* 状态栏透明后，原生会这么报占位 */
          insets: () => '{"top":96,"bottom":48}'
        };
      }
      if (setup) setup(w);
    }
  });
  return dom;
}

/* 给「支持 View Transitions」的环境打桩：
   - startViewTransition 同步跑更新回调（真实实现是异步的，但「换色发生在快照之间」这一点一致）
   - ready 用数组把 resolver 存起来，测试自己决定什么时候放行
   - animate 记账（我们只关心 clipPath 关键帧和伪元素名） */
function stubViewTransition(w, box) {
  box.vt = 0; box.skipped = 0; box.anims = []; box.ready = []; box.fin = [];
  w.document.startViewTransition = function (cb) {
    box.vt += 1;
    cb();
    /* finished 不能自动 resolve：真实的过渡要跑完（或被 skip）才结束，
       否则第一次点击还没滑就被当成「已收尾」，后面测不到 skip 与重定向。 */
    let done;
    const finished = new Promise(function (r) { done = r; });
    box.fin.push(done);
    return {
      ready: new Promise(function (r) { box.ready.push(r); }),
      finished: finished,
      skipTransition: function () { box.skipped += 1; done(); }
    };
  };
  w.Element.prototype.animate = function (kf, opts) {
    /* 只记「圆」那一条：boot.js 的预热和淡入兜底也会调 animate，
       它们没有 pseudoElement，混进来会让下面的下标全错。 */
    if (opts && opts.pseudoElement) box.anims.push({ kf: kf, opts: opts });
    return { finished: Promise.resolve(), cancel: function () {} };
  };
}

function clickAt(w, el, x, y) {
  el.dispatchEvent(new w.MouseEvent('click', {
    bubbles: true, cancelable: true, detail: 1, clientX: x, clientY: y
  }));
}

(async () => {
  /* ============ 启动窗口（冷启动第一帧） ============
     冷启动那帧由系统画，取的是主题的 windowBackground。
     它发生在我们的代码之前，所以只能在 XML 里定死，不能靠 JS。 */
  const man = fs.readFileSync('/sdcard/信笺/android/app/src/main/AndroidManifest.xml', 'utf8');
  const sty = fs.readFileSync('/sdcard/信笺/android/app/src/main/res/values/styles.xml', 'utf8');
  ok('Activity 挂上了启动主题', man.indexOf('android:theme="@style/XjLaunch"') >= 0);
  ok('启动主题存在', /<style name="XjLaunch"/.test(sty));
  ok('启动窗口底色是深灰 #1E1E1E',
    /name="android:windowBackground">#FF1E1E1E</.test(sty));
  ok('Android 12+ 的 Splash 底色也是深灰',
    /name="android:windowSplashScreenBackground">#FF1E1E1E</.test(sty));
  ok('启动窗口的状态栏/导航栏也是深色',
    (sty.match(/#FF1E1E1E/g) || []).length >= 4);
  ok('启动主题里没有非法的 -- 序列（XML 注释里不能有）',
    !/<!--[^>]*--[^>]/.test(sty.replace(/-->/g, '')));

  /* ============ 一、按钮的位置：主页天气条右侧 + 小家右上角 ============ */
  const calls = [];
  const dom = boot(true, calls);
  const w = dom.window, d = w.document;
  const q = s => d.querySelector(s);
  const qa = s => Array.from(d.querySelectorAll(s));
  const btn = () => q('.theme-btn');
  await wait(200);

  ok('启动时把主题同步给了原生', calls.length >= 1);
  ok('默认是洁白，同步的是 0', calls[0] === '0');
  ok('页面不是深色', !d.body.classList.contains('dark'));

  /* 状态栏透明（edge-to-edge）→ 顶部占位必须自己让出来 */
  ok('--safe-t 已按原生上报的像素写好',
    d.documentElement.style.getPropertyValue('--safe-t') === '96px');
  ok('--safe-b 也按原生上报（底部导航栏）',
    d.documentElement.style.getPropertyValue('--safe-b') === '48px');
  ok('CSS：--safe-t 以 env() 兜底（浏览器演示）',
    rd('style.css').indexOf('--safe-t:env(safe-area-inset-top') >= 0);
  ok('CSS：.view 顶部让出 --safe-t',
    /\.view\{[^}]*padding-top:var\(--safe-t\)/.test(rd('style.css').replace(/\s+/g, ' ')));
  ok('原生：状态栏全透明',
    /setStatusBarColor\(android\.graphics\.Color\.TRANSPARENT\)/.test(
      fs.readFileSync('/sdcard/信笺/android/app/src/main/java/tt/xinjian/cn/MainActivity.java', 'utf8')));
  ok('原生：关了 decorFits（内容顶到状态栏下）',
    fs.readFileSync('/sdcard/信笺/android/app/src/main/java/tt/xinjian/cn/MainActivity.java', 'utf8')
      .indexOf('setDecorFitsSystemWindows(false)') > 0);
  ok('原生：insetsJson 上报系统栏像素',
    fs.readFileSync('/sdcard/信笺/android/app/src/main/java/tt/xinjian/cn/MainActivity.java', 'utf8')
      .indexOf('String insetsJson()') > 0);
  ok('桥：XinJianBridge 暴露 insets()',
    fs.readFileSync('/sdcard/信笺/android/app/src/main/java/tt/xinjian/cn/XinJianBridge.java', 'utf8')
      .indexOf('public String insets()') > 0);
  ok('bridge.js 有同步的 insets()', rd('bridge.js').indexOf('insets: function ()') > 0);

  ok('主页有主题按钮', !!btn());
  ok('按钮在天气条右侧的 .theme-slot 里', !!q('.weather-bar .theme-slot .theme-btn'));
  ok('天气条左侧仍是可点的 .w-info（点它才弹天气提示）',
    !!q('.weather-bar .w-info[data-act=weather]'));
  ok('天气条里只有这一个按钮', qa('.weather-bar .theme-btn').length === 1);
  ok('按钮是圆形的（border-radius:50%）',
    /\.theme-btn\{[^}]*border-radius:50%/.test(rd('style.css').replace(/\s+/g, ' ')));
  ok('天气条右侧有一条竖分界（从天气里划出来）',
    /\.weather-bar \.theme-slot\{[^}]*border-left/.test(rd('style.css').replace(/\s+/g, ' ')));

  ok('浅色时按钮提示「切到深灰」', btn().getAttribute('aria-label') === '切换到深灰');
  ok('浅色时 aria-pressed 是 false', btn().getAttribute('aria-pressed') === 'false');
  ok('浅色时按钮里是月亮（不是太阳）', /M20\.5 14\.6/.test(btn().innerHTML));

  /* ---------- 主页按钮 → 深色（jsdom 没有 View Transitions，走兜底） ----------
     重点：「通知原生」必须挪到下一帧。同步调 JNI 会正好卡在 View Transition
     的两次快照之间（原生要换窗口 drawable + 状态栏/导航栏），换主题那一下发涩。 */
  const beforeCalls = calls.length;
  btn().click();
  ok('点击当帧没有同步去调 JNI（通知挪到下一帧）', calls.length === beforeCalls);
  await wait(60);
  ok('点了主页按钮就变深色', d.body.classList.contains('dark'));
  ok('深色时同步给原生的是 1', calls[calls.length - 1] === '1');
  ok('深色已记到本地存储', w.localStorage.getItem('xj:dark') === '1');
  ok('html 也挂上了 dark 类', d.documentElement.classList.contains('dark'));
  ok('html 底色变深（不是白）',
    /30,\s*30,\s*30/.test(w.getComputedStyle(d.documentElement).backgroundColor));
  ok('html 的深色和 CSS 里的 --bg 是同一个值',
    rd('style.css').indexOf('--bg:#1E1E1E') >= 0);
  ok('深色变量同时给了 html', rd('style.css').indexOf('html.dark,') >= 0);
  ok('深色时按钮换成太阳', /M12 2\.5v2/.test(btn().innerHTML));
  ok('深色时按钮提示「切到洁白」', btn().getAttribute('aria-label') === '切换到洁白');
  ok('深色时 aria-pressed 是 true', btn().getAttribute('aria-pressed') === 'true');
  ok('按钮的 title 也跟着变', btn().title === '切换到洁白');

  /* ---------- 小家右上角 ---------- */
  w.Nav.go('me');
  await wait(150);
  ok('小家右上角也有主题按钮', !!q('.topbar .theme-slot .theme-btn'));
  ok('小家标题还是居中（左边留了等宽的空位）',
    !!q('.topbar > .t-gap') && (q('.t-title') || {}).textContent === '小家');
  q('.topbar .theme-btn').click();
  await wait(60);
  ok('小家按钮能切回洁白', !d.body.classList.contains('dark'));
  ok('浅色时同步给原生的是 0', calls[calls.length - 1] === '0');
  ok('浅色已记到本地存储', w.localStorage.getItem('xj:dark') === '0');
  ok('html 也回到浅色', !d.documentElement.classList.contains('dark'));
  ok('html 浅色是白',
    /255,\s*255,\s*255/.test(w.getComputedStyle(d.documentElement).backgroundColor));

  /* ---------- 设置里已经没有外观了 ---------- */
  qa('.rows .row').find(n => n.textContent.indexOf('设置') >= 0).click();
  await wait(180);
  ok('进了设置页', (q('.t-title') || {}).textContent === '设置');
  ok('设置页没有外观 chip', !q('#themeChips'));
  ok('设置页没有 [data-dark] 胶囊（旧的入口彻底拿掉了）', !q('[data-dark]'));
  ok('设置页没有主题按钮（只有主页和小家才有）', !q('.theme-btn'));
  ok('设置页的动效开关还在', !!q('#animChips'));

  /* ---------- 传的值必须是字符串 '0'/'1'，原生按 "1".equals() 判断 ---------- */
  ok('同步的值都是字符串', calls.every(v => typeof v === 'string'));
  ok('同步的值只有 0 和 1', calls.every(v => v === '0' || v === '1'));

  /* ============ 二、有 View Transitions：圆形揭示 ============ */
  const box = {};
  const dom2 = boot(true, [], w2 => stubViewTransition(w2, box));
  const w2 = dom2.window, d2 = w2.document;
  await wait(200);
  const b2 = d2.querySelector('.theme-btn');
  ok('确实打桩到了（document.startViewTransition 存在）',
    typeof d2.startViewTransition === 'function');
  const VW = w2.innerWidth, VH = w2.innerHeight;
  ok('视口尺寸可用（jsdom 给了个非零值）', VW > 0 && VH > 0);

  ok('揭示前是浅色', !d2.body.classList.contains('dark'));
  clickAt(w2, b2, 10, 20);
  await wait(20);
  ok('用了 View Transitions（不是直接换色）', box.vt === 1);
  ok('揭示期间 html 挂上 vt-run（冻结元素自己的过渡）',
    d2.documentElement.classList.contains('vt-run'));
  ok('CSS 里确有冻结规则（html.vt-run * → transition:none）',
    (function () {
      const css = rd('style.css').replace(/\s+/g, ' ');
      const i = css.indexOf('html.vt-run *');
      return i >= 0 && css.slice(i, i + 120).indexOf('transition:none!important') > 0;
    })());
  ok('过渡期间主题已经换好（快照之间换色）', d2.body.classList.contains('dark'));
  box.ready[0]();
  await wait(20);

  const radiusOf = s => parseFloat(String(s).replace(/^circle\(([-\d.]+)px.*$/, '$1'));
  const want = Math.hypot(Math.max(10, VW - 10), Math.max(20, VH - 20));
  const expect0 = 'circle(0px at 10px 20px)';
  const got1 = box.anims[0].kf.clipPath[1];
  ok('动画只有一条，是 clipPath', box.anims.length === 1 && !!box.anims[0].kf.clipPath);
  ok('圆心就是点击的那一点', box.anims[0].kf.clipPath[0] === expect0);
  ok('半径取「盖住最远角」的距离 [' + got1 + ']',
    Math.abs(radiusOf(got1) - want) < 0.01 &&
    got1.indexOf('at 10px 20px)') > 0);
  ok('只动「新」的那一层（旧层不动，才不会整屏闪）',
    box.anims[0].opts.pseudoElement === '::view-transition-new(root)');
  ok('时长收到 300ms（原来 420ms；全程整屏 clip-path 重裁，越短越省）',
    box.anims[0].opts.duration === 300 && box.anims[0].opts.fill === 'both');
  ok('CSS 关掉了默认交叉淡入',
    /::view-transition-old\(root\),\s*::view-transition-new\(root\)\{animation:none/.test(
      rd('style.css').replace(/\s+/g, '')));

  /* 过渡正常收尾 → 解冻，别把「所有过渡都关掉」留在页面上 */
  box.fin[0]();
  await wait(20);
  ok('过渡收尾后摘掉 vt-run（元素过渡恢复）',
    !d2.documentElement.classList.contains('vt-run'));

  /* ---------- 键盘/无障碍触发：没有坐标，从按钮中心长圆 ---------- */
  b2.click();
  await wait(20);
  box.ready[1]();
  await wait(20);
  ok('第二次点击又开了一个过渡', box.vt === 2);
  ok('没有点击坐标时从按钮中心长圆（jsdom 里矩形全 0）',
    box.anims[1].kf.clipPath[0] === 'circle(0px at 0px 0px)');
  ok('第二次点击翻回浅色', !d2.body.classList.contains('dark'));

  /* ============ 三、过渡途中再点：从目标翻回去 ============ */
  const box3 = {};
  const dom3 = boot(true, [], w3 => stubViewTransition(w3, box3));
  const w3 = dom3.window, d3 = w3.document;
  await wait(200);
  const b3 = d3.querySelector('.theme-btn');
  clickAt(w3, b3, 5, 5);          /* 目标：深色，ready 还没放行 */
  await wait(10);
  clickAt(w3, b3, 5, 5);          /* 立刻再点：目标应变成浅色 */
  await wait(10);
  ok('途中再点：开了第二个过渡', box3.vt === 2);
  ok('途中再点：前一个被 skipTransition 掉了', box3.skipped >= 1);
  box3.ready[0]();                /* 旧的那个就算 ready 了也不许再动 */
  await wait(20);
  ok('途中再点：过期的那条动画不跑', box3.anims.length === 0);
  box3.ready[1]();
  await wait(20);
  ok('途中再点：新的那条动画跑了', box3.anims.length === 1);
  ok('途中再点：最终停在浅色（从目标翻回去）', !d3.body.classList.contains('dark'));

  /* ============ 四、离开视图要收尾 ============ */
  const box4 = {};
  const dom4 = boot(true, [], w4 => stubViewTransition(w4, box4));
  const w4 = dom4.window, d4 = w4.document;
  await wait(200);
  clickAt(w4, d4.querySelector('.theme-btn'), 5, 5);
  await wait(10);
  w4.Nav.go('me');                /* 视图整棵重建 → __cleanup → destroy() */
  await wait(80);
  ok('离开视图会跳过还在跑的过渡', box4.skipped >= 1);
  ok('过渡中也不会把主题卡住（颜色已经换了）', d4.body.classList.contains('dark'));

  /* ============ 五、关掉动效：只换色，不做揭示 ============ */
  const box5 = {};
  const dom5 = boot(true, [], w5 => stubViewTransition(w5, box5));
  const w5 = dom5.window, d5 = w5.document;
  await wait(200);
  w5.Anim.setEnabled(false);
  d5.querySelector('.theme-btn').click();
  await wait(40);
  ok('关掉动效时不走 View Transitions', box5.vt === 0);
  ok('关掉动效时也不跑到 animate', box5.anims.length === 0);
  ok('关掉动效照样换色', d5.body.classList.contains('dark'));

  /* ============ 五b、过渡期间不落盘、不通知原生 ============
     localStorage 首次写入要建库（几十 ms），JNI 要整改窗口 —— 都排在动画之后。 */
  const calls3 = [];
  const box7 = {};
  const dom7 = boot(true, calls3, w7 => stubViewTransition(w7, box7));
  const w7 = dom7.window, d7 = w7.document;
  await wait(200);
  const n0 = calls3.length;
  ok('启动后已经把初始主题报给原生', n0 >= 1 && calls3[0] === '0');
  clickAt(w7, d7.querySelector('.theme-btn'), 5, 5);
  await wait(60);                      /* 跨过 rAF：确认真的被挂住，不是碰巧延后 */
  ok('过渡期间没有通知原生', calls3.length === n0);
  ok('过渡期间没有写 localStorage', w7.localStorage.getItem('xj:dark') === '0');
  ok('过渡期间主题已经换好（只是没落盘）', d7.body.classList.contains('dark'));
  box7.ready[0]();
  box7.fin[0]();
  await wait(80);
  ok('过渡收尾后才通知原生', calls3.length === n0 + 1 && calls3[calls3.length - 1] === '1');
  ok('过渡收尾后才落盘', w7.localStorage.getItem('xj:dark') === '1');

  /* ============ 六、没有原生桥（浏览器演示） ============ */
  const calls2 = [];
  const dom6 = boot(false, calls2);
  const w6 = dom6.window, d6 = w6.document;
  await wait(200);
  ok('演示模式下没有原生可通知', calls2.length === 0);
  let threw = false;
  try {
    d6.querySelector('.theme-btn').click();
    await wait(60);
  } catch (e) { threw = true; }
  ok('演示模式点按钮不报错', !threw);
  ok('演示模式下界面照样变深', d6.body.classList.contains('dark'));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();