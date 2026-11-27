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
    if (reduced() || document.hidden || typeof lottie === 'undefined' || !document.body) return false;
    if (document.querySelector('.verify-burst')) return true;

    var layer = document.createElement('div');
    layer.className = 'verify-burst';
    layer.setAttribute('aria-hidden', 'true');
    var box = document.createElement('div');
    box.className = 'verify-burst-box';
    layer.appendChild(box);
    document.body.appendChild(layer);

    var anim, completion, deadline, removing;
    var closed = false;
    function remove() {
      clearTimeout(removing);
      document.removeEventListener('visibilitychange', finishIfInactive);
      window.removeEventListener('xj:motionchange', finishIfInactive);
      if (anim) anim.destroy();
      anim = null;
      layer.remove();
    }
    function close(immediate) {
      if (closed) return;
      closed = true;
      clearTimeout(completion);
      clearTimeout(deadline);
      if (immediate) return remove();
      layer.classList.add('out');
      removing = setTimeout(remove, 200);
    }

    function finishIfInactive() {
      if (!document.hidden && !reduced()) return;
      if (closed) remove();
      else close(true);
    }

    try {
      anim = lottie.loadAnimation({
        container: box, renderer: 'svg', loop: false, autoplay: true, path: DATA
      });
    } catch (error) {
      close(true);
      return false;
    }
    anim.addEventListener('complete', function () {
      if (!closed) completion = setTimeout(close, 280);
    });
    deadline = setTimeout(close, 1800);  /* JSON 加载失败时也回收遮罩。 */
    layer.addEventListener('click', function () { close(); });
    document.addEventListener('visibilitychange', finishIfInactive);
    window.addEventListener('xj:motionchange', finishIfInactive);
    return true;
  }

  return { verify: verify, reduced: reduced };
})();
