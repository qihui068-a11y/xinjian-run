/* 信笺 · 主题切换（圆形揭示）
   移植自 Operit 提供的 React 组件 `ThemeReveal`
   （`@/content/effects/theme-reveal/…`，基于 View Transitions + clip-path）。

   原组件的方法论原样保留：
     1. 点击点作为圆心，半径取「能盖住整块画布最远角」的那个距离；
     2. 用 `document.startViewTransition()` 把换主题前后的两帧做成快照，
        再对 `::view-transition-new(root)` 做 clip-path 动画 —— 只有「新」的那一层在长圆；
     3. `::view-transition-old/new(root)` 的默认交叉淡入必须关掉（animation:none），
        否则圆形之外也会跟着淡，看起来就是「整屏闪一下」；
     4. 过渡没起来（浏览器不支持 / 用户关了动效 / ready 被跳过）→ 直接换色 + 120ms 淡入兜底；
     5. 过渡途中再点一次：立刻记下「下一个目标」，从目标翻，而不是从旧 DOM 翻；
     6. `skipTransition()` 必须能收尾，视图卸载时不能留一个还在跑的过渡。

   信笺侧的四处适配：
     - 主题的唯一真相是 `html.dark` 这个类，换色统一走 app.js 的 `applyTheme()`，
       这样「本地存储 / 通知原生窗口底色」这两件事不会漏（原组件自己写 dataset 和 localStorage）；
     - 减少动效走 `Anim.enabled()`（App 自己的开关 + 系统偏好两层），不是只看 matchMedia；
     - 圆是「整页画布」这一块，没有原组件那种 target/viewTransitionName 的元素快照分支；
     - 视图会整棵重建，所以 `attach()` 返回句柄，`destroy()` 负责摘监听 + 收尾过渡。 */
'use strict';

var ThemeReveal = (function () {
  var DURATION = 450;
  var MIN_DURATION = 200;
  var MAX_DURATION = 700;
  var FADE_DURATION = 120;
  var FADE_FROM = 0.6;
  var EASE = 'cubic-bezier(.45,.05,.35,1)';   /* --e-inout */

  /* 两枚图标与 React 版一致（太阳 / 月亮），24 网格、1.8 描边 */
  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

  /* 当前主题：只看 html 上的类，它由 applyTheme() 维护 */
  function current() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  function commit(theme) {
    if (typeof selectAppearance === 'function') selectAppearance(theme === 'dark');
    else document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  function iconFor(theme) {
    return svg(theme === 'dark' ? 'sun' : 'moon');
  }

  /* 画布就是整页：左上角 (0,0)、尺寸取视口 */
  function surface() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 1,
      height: window.innerHeight || document.documentElement.clientHeight || 1
    };
  }

  function localOrigin(s, click) {
    if (!click) return { x: s.width / 2, y: s.height / 2 };
    return { x: clamp(click.x, 0, s.width), y: clamp(click.y, 0, s.height) };
  }

  /* 盖住最远角所需的半径 */
  function revealRadius(s, origin) {
    var dx = Math.max(origin.x, s.width - origin.x);
    var dy = Math.max(origin.y, s.height - origin.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* 减少动效：App 自己的开关优先（它已经把系统偏好算进去了） */
  function reduced() {
    if (window.Anim && typeof window.Anim.enabled === 'function') return !window.Anim.enabled();
    try {
      return !!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {
      return false;
    }
  }

  /* 按钮静态 HTML：视图里先拼出来，attach() 时再补状态 */
  function buttonHtml(always) {
    if (!always && typeof manualAppearance !== 'undefined' && !manualAppearance) return '';
    return '<button class="theme-btn" type="button" data-theme-btn' +
      ' aria-pressed="false" aria-label="切换主题" title="切换主题">' +
      iconFor(current()) + '</button>';
  }

  function attach(btn, opts) {
    if (!btn) return null;
    opts = opts || {};
    var duration = clamp(opts.duration || DURATION, MIN_DURATION, MAX_DURATION);
    var fromClick = opts.fromClick !== false;
    var fade = opts.fade !== false;

    var seq = 0;              /* 每次点击自增；过期的回调全部作废 */
    var transition = null;    /* 还在跑的那个 ViewTransition */
    var pending = null;       /* 下一次点击应该从哪个主题翻 */
    var held = false;         /* 是否挂住了「落盘 + 通知原生」 */

    function paint() {
      /* 过渡期间图标要指着「目标」，而不是旧主题 */
      var t = pending || current();
      btn.dataset.themeState = t;
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      if (!btn.firstElementChild || btn.firstElementChild.dataset.icon !== (t === 'dark' ? 'sun' : 'moon')) {
        btn.innerHTML = iconFor(t);
      }
      btn.setAttribute('aria-label', t === 'dark' ? '切换到浅色模式' : '切换到深色模式');
      btn.title = btn.getAttribute('aria-label');
    }

    /* 揭示期间把所有元素自己的颜色/位移过渡全停掉。
       不停的话：换色的那一帧，几十个节点（.book / .chip / .ni-bar …）会同时开始
       0.18~0.22s 的颜色过渡；可它们此刻被圆盖在下面看不见，纯属白烧 GPU，
       而且新快照拍到的还是旧色，揭示结束后颜色才慢慢追上，看着像「卡一下又跳色」。 */
    function freeze(on) {
      document.documentElement.classList.toggle('vt-run', !!on);
    }

    /* 过渡期间把落盘和 JNI 挂住（app.js 的 holdThemeNative）。
       两件事都排在动画之后：localStorage 首次写入要建库，原生要整改窗口，
       都能把动画的第一帧拖慢 —— 这就是「点下去要等一下才开始长圆」。 */
    function hold() {
      if (held) return;
      if (typeof holdThemeNative === 'function') { holdThemeNative(true); held = true; }
    }

    function release() {
      if (!held) return;
      held = false;
      if (typeof holdThemeNative === 'function') holdThemeNative(false);
    }

    function skip() {
      seq += 1;
      freeze(false);
      release();
      var t = transition;
      transition = null;
      if (t) {
        try { t.skipTransition(); } catch (e) { /* 可能已经结束了 */ }
      }
    }

    function fadeIn() {
      if (!fade || reduced()) return;
      try {
        document.documentElement.animate(
          [{ opacity: FADE_FROM }, { opacity: 1 }],
          { duration: FADE_DURATION, easing: EASE, fill: 'none' }
        );
      } catch (e) { /* 老 WebView 没有 WAAPI 就算了，颜色已经换好了 */ }
    }

    function complete(theme) {
      pending = null;
      commit(theme);
      paint();
    }

    function onClick(ev) {
      var next = (pending || current()) === 'light' ? 'dark' : 'light';
      /* 先记意图：过渡途中再点，是从目标翻回去，不是从旧 DOM 翻 */
      pending = next;
      paint();
      if (!reduced() && btn.firstElementChild.animate) {
        btn.firstElementChild.animate([
          { transform: 'scale(.79) rotate(-26deg)', opacity: .55 },
          { transform: 'scale(1.1) rotate(5deg)', opacity: 1, offset: .72 },
          { transform: 'none', opacity: 1 }
        ], { duration: duration, easing: EASE });
      }

      var s = surface();
      var click = null;
      if (fromClick) {
        if (ev.detail > 0 && (ev.clientX !== 0 || ev.clientY !== 0)) {
          click = { x: ev.clientX, y: ev.clientY };
        } else {
          /* 键盘/无障碍触发没有坐标：从按钮中心长圆 */
          var r = btn.getBoundingClientRect();
          click = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
      var origin = localOrigin(s, click);
      var radius = revealRadius(s, origin);

      skip();
      var mine = seq;

      if (reduced() || typeof document.startViewTransition !== 'function') {
        complete(next);
        fadeIn();
        return;
      }

      var vt;
      freeze(true);
      hold();
      try {
        vt = document.startViewTransition(function () {
          if (seq === mine) complete(next);
        });
      } catch (e) {
        freeze(false);
        release();
        complete(next);
        fadeIn();
        return;
      }
      transition = vt;

      /* 快照就绪后，只让「新」的那一层长圆 */
      vt.ready.then(function () {
        if (seq !== mine) return;
        try {
          document.documentElement.animate({
            clipPath: [
              'circle(0px at ' + origin.x + 'px ' + origin.y + 'px)',
              'circle(' + radius + 'px at ' + origin.x + 'px ' + origin.y + 'px)'
            ]
          }, {
            duration: duration,
            easing: EASE,
            pseudoElement: '::view-transition-new(root)',
            fill: 'both'
          });
        } catch (e) { /* 动不起来也得把新主题留在屏幕上 */ }
      }).catch(function () { /* 被 skip 掉时 ready 会 reject */ });

      if (vt.finished && typeof vt.finished.then === 'function') {
        vt.finished.then(function () {}, function () {}).then(function () {
          if (seq !== mine) return;
          freeze(false);
          release();
          if (transition === vt) transition = null;
        });
      }
    }

    btn.addEventListener('click', onClick);
    document.addEventListener('xj:appearance', paint);
    paint();

    return {
      el: btn,
      sync: paint,
      destroy: function () {
        btn.removeEventListener('click', onClick);
        document.removeEventListener('xj:appearance', paint);
        var wanted = pending;
        skip();
        if (wanted) complete(wanted);
      }
    };
  }

  return {
    attach: attach,
    buttonHtml: buttonHtml,
    current: current,
    /* 下面三个只为测试暴露：纯函数，没有副作用 */
    _localOrigin: localOrigin,
    _revealRadius: revealRadius,
    _surface: surface
  };
})();

window.ThemeReveal = ThemeReveal;