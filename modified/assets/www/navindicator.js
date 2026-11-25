/* 信笺 · 滑动指示条（NavIndicator）

   移植自 Operit 提供的 React 组件 `NavIndicator`
   （`@/content/effects/nav-indicator`）。原组件的**方法论一字不改**，
   只是把 React 换成原生 DOM：

   1. **静止几何写在 CSS 变量上**（--ni-left / --ni-width / --ni-top / --ni-height）。
      动画期间临时写内联值，过渡一结束立刻交还给变量。
      原注释说得对：这样过渡结束后不会留下「过期的内联像素值」。
   2. **只在「用户真的换了一项」时才滑**。首次量、选中项没变、几何没变、
      用户关了动效 —— 一律直接落位（settle），不动。
   3. **滑动途中再次切换 → 重定向**（retarget），不回到起点重来。
   4. **ResizeObserver + window.resize → 重新落位**（布局变了就重新停车）。
   5. `transitionend` 只认参与动画的那几个属性，别的属性不收尾。

   两种形态（`variant`）：

   - `'line'`（原组件形态）：条目下沿一条细线，只动 left / width。
     **条目折行时直接落位不滑**——跨行的细线没有物理意义。
   - `'block'`（信笺加的）：选中的格子整块填充，块随选中项移动。
     这种形态**允许跨行滑**（跨行移动一块是有意义的），所以不动 left/width 时
     还要动 top / height，折行判断对它不生效。

   信笺侧的其它适配：

   - 「减少动效」的判断走 `Anim.enabled()`（用户开关 + 系统偏好两层），
     而不是只看 `prefers-reduced-motion`——App 里已经有自己的动效开关。
   - `glow` 默认关。原组件带泛光，这里默认不要。
   - 测量用 offsetLeft/offsetTop，所以容器必须有 `position:relative`
     （`.ni-root` 负责这件事）。 */
(function (global) {
  'use strict';

  var EASE = 'cubic-bezier(.22,.61,.36,1)';

  var DEFAULTS = {
    duration: 260,
    thickness: 2,
    glow: false,
    variant: 'line',
    itemSelector: '.chip',
    isActive: function (el) { return el.classList.contains('on'); }
  };

  var handles = [];

  function reducedNow() {
    if (global.Anim && typeof global.Anim.enabled === 'function') {
      return !global.Anim.enabled();
    }
    try {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  function attach(root, opts) {
    if (!root) return null;
    opts = opts || {};
    var cfg = {};
    for (var k in DEFAULTS) cfg[k] = (k in opts) ? opts[k] : DEFAULTS[k];

    var isBlock = cfg.variant === 'block';
    /* 块形态要连着 top/height 一起过渡（跨行），线形态只动 left/width */
    var PROPS = isBlock ? ['left', 'top', 'width', 'height'] : ['left', 'width'];

    root.classList.add('ni-root');

    var bar = root.querySelector('.ni-bar');
    if (!bar) {
      bar = document.createElement('span');
      bar.className = 'ni-bar';
      bar.setAttribute('aria-hidden', 'true');
      root.appendChild(bar);
    }
    bar.classList.toggle('block', isBlock);
    if (!isBlock) {
      bar.style.height = cfg.thickness + 'px';
      bar.style.borderRadius = cfg.thickness + 'px';
    }
    if (cfg.glow) bar.style.boxShadow = '0 0 6px currentColor, 0 0 12px currentColor';

    var geo = { left: 0, width: 0, top: 0, height: 0 };
    var lastActive = null;
    var animating = false;
    var first = true;

    function items() {
      return Array.prototype.slice.call(root.querySelectorAll(cfg.itemSelector));
    }

    function activeItem() {
      var list = items();
      for (var i = 0; i < list.length; i++) {
        if (cfg.isActive(list[i])) return list[i];
      }
      return null;
    }

    /* 几何一律以「格子自己」为准；线形态再把 top 推到下沿 */
    function measure(item) {
      if (!item) return null;
      return {
        left: item.offsetLeft,
        width: item.offsetWidth,
        top: isBlock ? item.offsetTop : item.offsetTop + item.offsetHeight,
        height: isBlock ? item.offsetHeight : cfg.thickness
      };
    }

    /* 折行：有任意一项的 offsetTop 和第一项不同 */
    function isWrapped(list) {
      if (list.length < 2) return false;
      var top = list[0].offsetTop;
      for (var i = 1; i < list.length; i++) {
        if (list[i].offsetTop !== top) return true;
      }
      return false;
    }

    function settle(g) {
      bar.style.setProperty('--ni-left', g.left + 'px');
      bar.style.setProperty('--ni-width', g.width + 'px');
      bar.style.setProperty('--ni-top', g.top + 'px');
      bar.style.setProperty('--ni-height', g.height + 'px');
      bar.style.left = '';
      bar.style.top = '';
      bar.style.width = '';
      bar.style.height = '';
      bar.style.transition = '';
      bar.classList.add('on');
      geo = g;
      animating = false;
    }

    function hide() {
      bar.classList.remove('on');
      animating = false;
      first = true;
      lastActive = null;
    }

    function sync() {
      var list = items();
      var item = activeItem();
      var g = measure(item);
      /* 量不到（元素还没进布局 / 被隐藏）就先不画 */
      if (!g || (!g.width && !g.height)) { hide(); return; }

      var changed = lastActive !== item;
      lastActive = item;
      var isFirst = first;
      first = false;
      var moved = Math.abs(g.left - geo.left) > 0.5 || Math.abs(g.width - geo.width) > 0.5 ||
        Math.abs(g.top - geo.top) > 0.5;

      /* 折行只在「线」形态下放弃动画 */
      var blocked = !isBlock && isWrapped(list);

      if (isFirst || !changed || reducedNow() || blocked || !moved) {
        settle(g);
        return;
      }

      if (animating) {
        /* 滑动途中又换了目标：改终点，不回到起点重来 */
        bar.style.setProperty('--ni-top', g.top + 'px');
        bar.style.setProperty('--ni-height', g.height + 'px');
        bar.style.left = g.left + 'px';
        bar.style.width = g.width + 'px';
        if (isBlock) { bar.style.top = g.top + 'px'; bar.style.height = g.height + 'px'; }
        geo = g;
        return;
      }

      bar.style.transition = 'none';
      bar.style.left = geo.left + 'px';
      bar.style.width = geo.width + 'px';
      if (isBlock) { bar.style.top = geo.top + 'px'; bar.style.height = geo.height + 'px'; }
      else { bar.style.setProperty('--ni-top', g.top + 'px'); }
      void bar.offsetWidth;   /* 把起点冲进样式系统，否则浏览器不知道从哪开始 */

      var t = [];
      for (var i = 0; i < PROPS.length; i++) t.push(PROPS[i] + ' ' + cfg.duration + 'ms ' + EASE);
      bar.style.transition = t.join(', ');
      bar.style.left = g.left + 'px';
      bar.style.width = g.width + 'px';
      if (isBlock) { bar.style.top = g.top + 'px'; bar.style.height = g.height + 'px'; }
      geo = g;
      animating = true;
    }

    function onEnd(e) {
      if (!animating) return;
      if (PROPS.indexOf(e.propertyName) < 0) return;
      settle(geo);
    }
    bar.addEventListener('transitionend', onEnd);

    var ro = null;
    if (global.ResizeObserver) {
      ro = new global.ResizeObserver(function () { sync(); });
      ro.observe(root);
    }
    function onResize() { sync(); }
    global.addEventListener('resize', onResize);

    var handle = {
      root: root,
      bar: bar,
      cfg: cfg,
      sync: sync,
      destroy: function () {
        if (ro) ro.disconnect();
        global.removeEventListener('resize', onResize);
        bar.removeEventListener('transitionend', onEnd);
        var i = handles.indexOf(handle);
        if (i >= 0) handles.splice(i, 1);
      }
    };
    handles.push(handle);
    sync();
    return handle;
  }

  global.NavIndicator = {
    attach: attach,
    syncAll: function () {
      handles.slice().forEach(function (h) { h.sync(); });
    },
    _handles: handles
  };
})(window);