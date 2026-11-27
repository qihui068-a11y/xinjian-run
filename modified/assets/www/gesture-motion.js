/* 信笺 · 页面边缘返回与底部选项拖动 */
'use strict';

var GestureMotion = (function () {
  var EASE = 'cubic-bezier(.16,.85,.28,1)';

  function drag(target, motion) {
    var press, frame = 0;
    function paint() {
      frame = 0;
      if (press && press.active) motion.paint(press.distance);
    }
    function down(event) {
      if (press || !event.isPrimary || event.button !== 0 || !motion.start(event)) return;
      press = { id: event.pointerId, x: event.clientX, y: event.clientY,
        time: performance.now(), point: 0, speed: 0, distance: 0, active: false };
      try { target.setPointerCapture(press.id); } catch (error) {}
    }
    function move(event) {
      if (!press || press.id !== event.pointerId) return;
      var x = event.clientX - press.x, y = event.clientY - press.y;
      var delta = motion.vertical ? y : x;
      var across = Math.abs(motion.vertical ? x : y);
      if (!press.active) {
        if (across > 9 && across > delta) return end(event, false);
        if (delta < 8 || delta <= across) return;
        press.active = true;
        motion.activate();
      }
      var now = performance.now();
      if (delta !== press.point) {
        press.speed = (delta - press.point) / Math.max(6, now - press.time);
        press.time = now;
        press.point = delta;
      }
      press.distance = Math.max(0, delta);
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function end(event, released) {
      if (!press || (event && press.id !== event.pointerId)) return;
      var last = press;
      press = null;
      cancelAnimationFrame(frame);
      frame = 0;
      if (target.hasPointerCapture(last.id)) target.releasePointerCapture(last.id);
      if (last.active) motion.end(last.distance, released && performance.now() - last.time < 110 ? last.speed : 0, released);
    }
    function up(event) { move(event); end(event, true); }
    function cancel(event) { if (event.target === target || event.type === 'pointercancel') end(event, false); }
    function background() { if (document.hidden) end(null, false); }
    target.addEventListener('pointerdown', down);
    target.addEventListener('pointermove', move, { passive: true });
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', cancel);
    target.addEventListener('lostpointercapture', cancel);
    document.addEventListener('visibilitychange', background);
    return function () {
      target.removeEventListener('pointerdown', down);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', cancel);
      target.removeEventListener('lostpointercapture', cancel);
      document.removeEventListener('visibilitychange', background);
      end(null, false);
    };
  }

  function edge(view, previous, allowed, back) {
    if (typeof view.animate !== 'function') return function () {};
    var animation, under, width, closing = false;
    function clear() {
      if (animation) animation.cancel();
      animation = null;
      if (under) under.remove();
      under = null;
      view.style.transform = '';
    }
    function inactive() {
      if (document.hidden || !Anim.enabled()) clear();
    }
    var detach = drag(view, {
      start: function (event) {
        var root = document.documentElement;
        // Leave Android's physical edge to the OS. Scrollable rows and editors keep their gestures.
        var inset = Bridge.isNative ? 20 : 0;
        return event.pointerType !== 'mouse' && Anim.enabled() && !closing && allowed() &&
          !root.classList.contains('editor-ime-visible') &&
          event.clientX >= inset && event.clientX <= inset + 28 &&
          event.clientY > (root.clientHeight || innerHeight) * .10 &&
          !event.target.closest('input,textarea,button,a,[contenteditable],.ct-row,.chat-compose');
      },
      activate: function () {
        var current = new DOMMatrix(getComputedStyle(view).transform).m41;
        clear();
        width = view.clientWidth || innerWidth;
        under = previous.cloneNode(true);
        under.inert = true;
        under.setAttribute('aria-hidden', 'true');
        under.classList.add('edge-back-preview');
        view.after(under);
        var scroll = under.querySelector('.scroll, .chat-list');
        if (scroll) scroll.scrollTop = previous.scrollOffset || 0;
        paint(current);
      },
      paint: paint,
      end: function (distance, speed, released) {
        if (!under) return;
        if (!Anim.enabled() || document.hidden) { clear(); return; }
        var x = new DOMMatrix(getComputedStyle(view).transform).m41;
        var commit = released && allowed() &&
          (distance > width * .32 || (distance > 38 && speed > .48));
        closing = commit;
        animation = view.animate([{ transform: 'translateX(' + x + 'px)' },
          { transform: 'translateX(' + (commit ? width : 0) + 'px)' }], {
          duration: commit ? 240 : 190, easing: EASE, fill: 'both'
        });
        animation.onfinish = function () {
          if (commit && allowed()) back();
          clear();
          closing = false;
        };
      }
    });
    function paint(x) {
      if (!under) return;
      var position = Math.min(width, x);
      view.style.transform = 'translateX(' + position + 'px)';
    }
    view.classList.add('edge-back');
    window.addEventListener('xj:motionchange', inactive);
    document.addEventListener('visibilitychange', inactive);
    return function () {
      detach();
      clear();
      window.removeEventListener('xj:motionchange', inactive);
      document.removeEventListener('visibilitychange', inactive);
    };
  }

  function sheet(mask, close) {
    var panel = mask.querySelector('.sheet');
    if (typeof panel.animate !== 'function') return;
    var handle = document.createElement('div');
    handle.className = 'sheet-grab';
    handle.setAttribute('aria-hidden', 'true');
    panel.prepend(handle);
    var scrim = document.createElement('div');
    scrim.className = 'sheet-scrim';
    mask.prepend(scrim);
    mask.classList.add('gesture-sheet');
    var panelMotion, dimMotion, timer, travel = 0, grabStart = 0, closed = false;

    function cancel() {
      if (panelMotion) panelMotion.cancel();
      if (dimMotion) dimMotion.cancel();
      panelMotion = dimMotion = null;
      clearTimeout(timer);
    }
    function current() {
      return new DOMMatrix(getComputedStyle(panel).transform).m42;
    }
    function animate(frames, opacity, duration, end) {
      cancel();
      panel.style.transform = '';
      scrim.style.opacity = '';
      if (!Anim.enabled() || document.hidden || typeof panel.animate !== 'function') {
        if (end) end();
        return;
      }
      panelMotion = panel.animate(frames, { duration: duration, easing: EASE, fill: 'both' });
      dimMotion = scrim.animate(opacity.map(function (value) { return { opacity: value }; }),
        { duration: duration, easing: EASE, fill: 'both' });
      function finish() { cancel(); if (end) end(); }
      panelMotion.onfinish = finish;
      timer = setTimeout(finish, duration + 60);
    }
    var detach = drag(handle, {
      vertical: true,
      start: function () { return !closed; },
      activate: function () {
        travel = panel.offsetHeight || 1;
        grabStart = Math.max(0, current());
        cancel();
        paint(0);
      },
      paint: paint,
      end: function (distance, speed, released) {
        if (closed) return;
        if (released && (distance > Math.min(120, travel * .30) || (distance > 34 && speed > .55))) {
          close(null);
          return;
        }
        animate([{ transform: 'translateY(' + current() + 'px)' }, { transform: 'none' }],
          [Number(getComputedStyle(scrim).opacity), 1], 190);
      }
    });
    function paint(distance) {
      var y = Math.min(travel, grabStart + distance);
      panel.style.transform = 'translateY(' + y + 'px)';
      scrim.style.opacity = String(1 - y / travel);
    }
    function inactive() {
      if (!document.hidden && Anim.enabled()) return;
      if (closed) remove();
      else {
        cancel();
        panel.style.transform = '';
        scrim.style.opacity = '';
      }
    }
    function remove() {
      cancel();
      window.removeEventListener('xj:motionchange', inactive);
      document.removeEventListener('visibilitychange', inactive);
      mask.remove();
    }
    mask.__dismiss = function () {
      closed = true;
      detach();
      mask.classList.add('m-leave');
      mask.setAttribute('aria-hidden', 'true');
      if (!Anim.enabled() || document.hidden || typeof panel.animate !== 'function') { remove(); return; }
      var from = current();
      var alpha = Number(getComputedStyle(scrim).opacity);
      animate([{ transform: 'translateY(' + from + 'px)' }, { transform: 'translateY(100%)' }],
        [alpha, 0], 220, remove);
    };
    window.addEventListener('xj:motionchange', inactive);
    document.addEventListener('visibilitychange', inactive);
    animate([{ transform: 'translateY(100%)' },
      { transform: 'translateY(-1%)', offset: .86 }, { transform: 'none' }], [0, 1], 350);
  }

  return { edge: edge, sheet: sheet };
})();
