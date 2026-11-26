/* 信笺 · 标志性动效（全站仅一处 Lottie，见 docs/设计/动效规范.md 第五节）
   只用于「验证通过」这种高光时刻：一次播放，播完即销毁，不在列表里循环。
   关动效时直接不播，调用方保留原来的静态确认（toast + 列表变化）。 */
'use strict';

var Motion = (function () {
  var DATA = 'motion/verify.json';

  function reduced() {
    return typeof Anim !== 'undefined' && !Anim.enabled();
  }

  function verify() {
    if (reduced() || typeof lottie === 'undefined' || !document.body) return false;
    if (document.querySelector('.verify-burst')) return true;

    var layer = document.createElement('div');
    layer.className = 'verify-burst';
    layer.setAttribute('aria-hidden', 'true');
    var box = document.createElement('div');
    box.className = 'verify-burst-box';
    layer.appendChild(box);
    document.body.appendChild(layer);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      layer.classList.add('out');
      setTimeout(function () { layer.remove(); }, 200);
    }

    var anim = null;
    try {
      anim = lottie.loadAnimation({
        container: box, renderer: 'svg', loop: false, autoplay: true, path: DATA
      });
    } catch (error) {
      close();
      return false;
    }
    anim.addEventListener('complete', function () { setTimeout(close, 280); });
    setTimeout(close, 1800);        /* 兜底：JSON 加载失败也不会把遮罩留在屏幕上 */
    layer.addEventListener('click', close);
    return true;
  }

  return { verify: verify, reduced: reduced };
})();