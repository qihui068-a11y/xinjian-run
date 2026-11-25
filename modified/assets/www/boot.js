/* 信笺 · 启动

   **必须最后加载**：它调 Nav.render() 做首屏渲染。
   （原先还在这里绑全局波纹，点击泛光已按需求删除，见 anim.js 头部注释。）
   如果它在视图文件之前执行，VIEWS 还是空的，切视图会白屏。 */

'use strict';

  /* ================= 启动 ================= */

  /* 状态栏透明后，这一块高度必须让出来（优先问原生要像素，见 app.js applyInsets） */
  applyInsets();
  /* 冷启动那一会儿窗口 insets 可能还没算好（拿到 0）。补两次 + 监听尺寸变化，
     否则首屏顶栏会被状态栏压住，直到下一次重排才恢复。 */
  setTimeout(applyInsets, 300);
  window.addEventListener('resize', applyInsets);

  /* 预热：把「第一次换主题」的一次性开销提前付掉。
     首次加 .vt-run 会让整棵树重新匹配一遍样式（那条规则是 html.vt-run *），
     首次调 WAAPI 也要初始化动画管线 —— 都堆到第一次点击上，就是「第一下特别卡」。
     这里在首帧之后空跑一遍：加类 → 读一次样式 → 摘类，再跑一个 0 时长动画。 */
  function warmupMotion() {
    try {
      var root = document.documentElement;
      root.classList.add('vt-run');
      void window.getComputedStyle(document.body).transition;
      root.classList.remove('vt-run');
      if (typeof root.animate === 'function') {
        root.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, fill: 'none' });
      }
    } catch (e) {}
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(warmupMotion);
  else setTimeout(warmupMotion, 16);

  Nav.render();
