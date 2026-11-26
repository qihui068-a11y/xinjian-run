/* 信笺 · 微交互动效（离线，无依赖）
   只管两件事：给界面「跟手感」，以及在用户要求时**彻底不动**。
   点击泛光（ripple）已按需求整体删除，这里只留「错峰升起」一种效果。

   设计原则（对应 Advanced Interaction Design 的要求）：
   - 动画只改 transform / opacity / clip-path，不改布局属性，避免掉帧
   - 任何动画结束时，DOM 的最终状态和「没有动画」时完全一致
     （先落终态再补动画，测试和不确定性都靠这个压住）
   - 关掉动效时，所有效果直接跳到终态，不留中间态 */
(function (global) {
  'use strict';

  var KEY = 'xj:anim';

  function userOff() {
    try { return global.localStorage.getItem(KEY) === 'off'; } catch (e) { return false; }
  }

  function systemReduced() {
    try {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  /* 只要用户关了、或系统要求减少动效，就一律不动 */
  function enabled() { return !userOff() && !systemReduced(); }

  /* html.anim-off 是 CSS 侧的开关：关掉时全站 transition/animation 直接归零 */
  function syncClass() {
    try { global.document.documentElement.classList.toggle('anim-off', !enabled()); } catch (e) {}
  }

  function setEnabled(on) {
    try { global.localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    syncClass();
  }

  /* ---------- 1) Staggered Block Selection ----------
     选中/进入多选时，格子从下往上逐个升起，错峰 step 毫秒。
     关掉动效时直接落终态（只加类，不加动画）。 */
  function stagger(nodes, opts) {
    opts = opts || {};
    var list = Array.prototype.slice.call(nodes || []);
    if (!list.length) return;
    var step = opts.step || 18;   /* 规范：错峰 18ms */
    var cls = opts.cls || 'stg-run';
    var fromBottom = opts.fromBottom !== false;

    if (!enabled()) {
      list.forEach(function (n) { n.classList.add('stg-done'); });
      return;
    }

    var maxDelay = 0;
    list.forEach(function (n, i) {
      var idx = fromBottom ? (list.length - 1 - i) : i;
      var delay = idx * step;
      if (delay > maxDelay) maxDelay = delay;
      n.style.setProperty('--stg-delay', delay + 'ms');
      n.classList.remove(cls);
    });

    /* 强制一次回流，让上面的 remove 生效，否则连续两次动画会被合并掉 */
    void document.body.offsetHeight;

    list.forEach(function (n) { n.classList.add(cls); });

    /* 兜底：动画跑完就摘掉类，元素回到「没有任何动画」的静止态 */
    setTimeout(function () {
      list.forEach(function (n) { n.classList.remove(cls); });
    }, 220 + maxDelay);
  }

  syncClass();

  function swap(oldEl, newEl, mode) {
    if (!enabled() || typeof newEl.animate !== 'function') {
      oldEl.remove();
      return null;
    }
    if (oldEl.contains(document.activeElement)) document.activeElement.blur();
    oldEl.inert = true;
    oldEl.setAttribute('aria-hidden', 'true');
    oldEl.style.pointerEvents = 'none';
    newEl.style.zIndex = '25';
    var incoming, outgoing, timer;
    function finish() {
      clearTimeout(timer);
      if (incoming) incoming.cancel();
      if (outgoing) outgoing.cancel();
      oldEl.remove();
      newEl.style.zIndex = '';
    }
    try {
      var tab = mode === 'tab';
      var shift = mode === 'pop' ? -16 : 16;
      var frames = tab ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: .6, transform: 'translateX(' + shift + 'px)' }, { opacity: 1, transform: 'none' }];
      var duration = tab ? 120 : 350;
      var easing = tab ? 'linear' : 'cubic-bezier(.22,.78,.24,1)';
      incoming = newEl.animate(frames, { duration: duration, easing: easing });
      outgoing = oldEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: duration, easing: easing });
      incoming.onfinish = finish;
      timer = setTimeout(finish, duration + 60);
      return finish;
    } catch (error) {
      finish();
      return null;
    }
  }

  global.Anim = {
    enabled: enabled,
    setEnabled: setEnabled,
    stagger: stagger,
    swap: swap
  };
})(window);