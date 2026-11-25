/* 信笺 · 卡片光斑（移植 React 的 SpotlightCard）
   只管一件事：手指/指针在哪，卡片就在那个位置亮一小片柔光，抬起就淡掉。
   具体挂到谁身上由选择器决定（见 CARDS / HALF），**用事件委托**，
   所以视图重建、书架新增的书籍、鸽屋新增的会话，都会自动生效，
   不需要在任何视图里写挂载代码。

   与原组件的差异（都是有意的）：
   1) 倾斜（rotateX/rotateY）和悬停放大 **没有移植**。原组件自己就写着
      `if (pointerType !== "touch")` 才做 —— 手机没有 hover，这两条在触屏上
      本来就不会触发，移植过来是死代码，还会和手指滚动抢 transform。
   2) 原组件用 Motion 的 useSpring 做缓动；这里只用 CSS 的 0.12s 淡入淡出，
      跟手靠 rAF 直出，不打弹簧（一次手势里弹簧会把延迟叠上去）。
   3) 关动效时原组件会保留一个静止的居中光斑；信笺的约定是「关掉就彻底不动」，
      所以这里直接不画。

   为什么不插 DOM 节点：光斑用卡片的 ::after / ::before 画。书架长按曾被
   「pointerdown 时往卡片里插节点」搞挂过 —— 部分 WebView 认为手势期间 DOM
   有变动就派发 pointercancel，把长按计时器一起掐掉。伪元素没有这个风险。 */
(function (global) {
  'use strict';

  /* 要光斑的卡片。三处：主页四个入口、书架每一本、鸽屋每一行。
     加新类型只改这一行。 */
  var CARDS = '.entry, .book, .pg-item';
  /* 只画右半边的那类：鸽屋聊天行。左边缘用渐变蒙版化开，看不出分界。 */
  var HALF = '.pg-item';

  var SIZE = 260;        /* 光斑直径 px（原组件 defaults.size） */
  var INTENSITY = 0.09;  /* 光斑浓度（原组件 defaults.intensity 同量级） */
  var EDGE = 0.18;       /* 1px 描边高光的浓度 */

  var activeEl = null;   /* 当前亮着的卡片 */
  var activeId = null;   /* 指针 id，用来分辨是同一根手指还是换了一根 */
  var rect = null;       /* 手势开始时的卡片矩形，手势期间不重读（避免每帧 reflow） */
  var px = 0, py = 0;    /* 最新指针坐标（视口坐标） */
  var rafId = 0;

  function enabled() { return !global.Anim || global.Anim.enabled(); }

  function prep(el) {
    if (!el.classList.contains('spot')) {
      el.classList.add('spot');
      if (el.matches(HALF)) el.classList.add('spot-half');
      el.style.setProperty('--spot-r', SIZE + 'px');
      el.style.setProperty('--spot-i', String(INTENSITY));
      el.style.setProperty('--spot-edge', String(EDGE));
    }
    return el;
  }

  function paint() {
    rafId = 0;
    if (!activeEl || !rect || !rect.width) return;
    var x = px - rect.left;
    var y = py - rect.top;
    /* 鸽子行只画右半边：伪元素的盒子从卡片中线开始，
       所以坐标要减掉半宽，光斑才会落在手指正下方而不是偏右一半。 */
    if (activeEl.classList.contains('spot-half')) x -= rect.width / 2;
    activeEl.style.setProperty('--spot-x', x.toFixed(1) + 'px');
    activeEl.style.setProperty('--spot-y', y.toFixed(1) + 'px');
  }

  function schedule() {
    if (rafId) return;
    if (global.requestAnimationFrame) rafId = global.requestAnimationFrame(paint);
    else rafId = global.setTimeout(paint, 16);
  }

  function start(el, e) {
    if (!el || !enabled()) return;
    if (activeEl && activeEl !== el) stop();
    prep(el);
    activeEl = el;
    activeId = (e.pointerId === undefined ? null : e.pointerId);
    px = e.clientX;
    py = e.clientY;
    rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-o', '1');
    schedule();
  }

  function update(e) {
    px = e.clientX;
    py = e.clientY;
    schedule();
  }

  function stop() {
    if (activeEl) activeEl.style.setProperty('--spot-o', '0');
    activeEl = null;
    activeId = null;
    rect = null;
  }

  function cardOf(e) {
    var t = e.target;
    if (!t || !t.closest) return null;
    return t.closest(CARDS);
  }

  function onDown(e) { start(cardOf(e), e); }

  function onMove(e) {
    /* 同一根手指按住拖动：跟手 */
    if (activeId !== null && e.pointerId === activeId) { update(e); return; }
    if (e.pointerType === 'touch') return;   /* 触屏没有 hover，抬手就该灭 */
    /* 鼠标/触控笔划过去：进卡亮点，出卡灭掉 */
    var el = cardOf(e);
    if (el) { if (el !== activeEl) start(el, e); else update(e); }
    else if (activeEl) stop();
  }

  function onUp(e) {
    if (e.pointerId === activeId || e.pointerType === 'touch') stop();
  }

  function onOut(e) { if (e.pointerType !== 'touch' && !e.relatedTarget) stop(); }

  function bind() {
    var d = global.document;
    if (!d) return;
    d.addEventListener('pointerdown', onDown, { passive: true });
    d.addEventListener('pointermove', onMove, { passive: true });
    d.addEventListener('pointerup', onUp, { passive: true });
    d.addEventListener('pointercancel', onUp, { passive: true });
    d.addEventListener('pointerout', onOut, { passive: true });
    /* 滚动时卡片整体在动，手势开始时缓存的矩形已经不准了，直接灭掉 */
    global.addEventListener('scroll', stop, true);
  }

  bind();

  global.Spotlight = {
    CARDS: CARDS,
    HALF: HALF,
    SIZE: SIZE,
    INTENSITY: INTENSITY,
    EDGE: EDGE,
    enabled: enabled,
    prepare: prep,
    active: function () { return activeEl; },
    stop: stop
  };
})(window);
