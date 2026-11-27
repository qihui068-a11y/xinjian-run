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

  function sheet(mask, close, options) {
    options = options || {};
    var panel = mask.querySelector('.sheet');
    var animates = typeof panel.animate === 'function';
    if (!animates && !options.handle) return;
    var handle = options.handle || document.createElement('div');
    if (!options.handle) {
      handle.className = 'sheet-grab';
      handle.setAttribute('aria-hidden', 'true');
      panel.prepend(handle);
    }
    var scrim = document.createElement('div');
    scrim.className = 'sheet-scrim';
    mask.prepend(scrim);
    mask.classList.add('gesture-sheet');
    var background = options.background, shrink = options.shrink || 1;
    var transforms = [], timer, onClosed, travel = 0, grab, closed = false;

    function cancel() {
      transforms.forEach(function (animation) { animation.cancel(); });
      transforms = [];
      clearTimeout(timer);
    }
    function translate(value) { return 'translateY(' + value + 'px)'; }
    function scale(alpha) { return 'scale(' + (1 - (1 - shrink) * alpha) + ')'; }
    function current() {
      return {
        y: new DOMMatrix(getComputedStyle(panel).transform || 'none').m42,
        alpha: Number(getComputedStyle(scrim).opacity),
        scale: background ? new DOMMatrix(getComputedStyle(background).transform || 'none').a : 1
      };
    }
    function apply(y, alpha) {
      panel.style.transform = y ? translate(y) : '';
      scrim.style.opacity = String(alpha);
      if (background) background.style.transform = alpha && Anim.enabled() ? scale(alpha) : '';
    }
    function animate(frames, from, to, duration, end, initialScale) {
      cancel();
      function finish() {
        cancel();
        apply(0, to);
        if (end) end();
      }
      if (!Anim.enabled() || document.hidden || !animates) return finish();
      var timing = { duration: duration, easing: EASE, fill: 'both' };
      var panelTiming = frames[0].easing ? { duration: duration, fill: 'both' } : timing;
      transforms.push(panel.animate(frames, panelTiming), scrim.animate([{ opacity: from }, { opacity: to }], timing));
      if (background) {
        transforms.push(background.animate([
          { transform: initialScale === undefined ? scale(from) : 'scale(' + initialScale + ')' },
          { transform: scale(to) }
        ], timing));
      }
      transforms[0].onfinish = finish;
      timer = setTimeout(finish, duration + 60);
    }
    var detach = drag(handle, {
      vertical: true,
      start: function () { return !closed && animates && (!options.canDrag || options.canDrag()); },
      activate: function () {
        travel = panel.offsetHeight || 1;
        grab = current();
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
        var pose = current();
        animate([{ transform: translate(pose.y) }, { transform: 'none' }], pose.alpha, 1, 190, null, pose.scale);
      }
    });
    function paint(distance) {
      var offset = options.resistance ? distance / (1 + distance / (travel * 2)) : distance;
      var y = Math.max(-travel, Math.min(travel, grab.y + offset));
      var rest = Math.max(1, travel - grab.y);
      apply(y, grab.alpha * (1 - Math.min(1, offset / rest)));
    }
    function inactive() {
      if (!document.hidden && Anim.enabled()) return;
      if (closed) remove();
      else {
        cancel();
        apply(0, 1);
        if (background) background.style.transform = '';
      }
    }
    function remove() {
      cancel();
      if (background) background.style.transform = '';
      window.removeEventListener('xj:motionchange', inactive);
      document.removeEventListener('visibilitychange', inactive);
      mask.remove();
      var done = onClosed;
      onClosed = null;
      if (done) done();
    }
    mask.__dismiss = function (done, immediate) {
      if (closed) { if (immediate) remove(); return; }
      var pose = animates && !immediate && Anim.enabled() ? current() : null;
      closed = true;
      onClosed = done;
      detach();
      mask.classList.add('m-leave');
      panel.inert = true;
      mask.setAttribute('aria-hidden', 'true');
      if (!pose || document.hidden) { remove(); return; }
      animate([{ transform: translate(pose.y) }, { transform: 'translateY(100%)' }],
        pose.alpha, 0, options.closeDuration || 220, remove, pose.scale);
    };
    window.addEventListener('xj:motionchange', inactive);
    document.addEventListener('visibilitychange', inactive);
    if (!Anim.enabled() || !animates || document.hidden) {
      scrim.style.opacity = '1';
      return;
    }
    var openFrames = [{ transform: 'translateY(100%)' },
      { transform: 'translateY(' + -(options.rebound || 1) + '%)', offset: .86 }, { transform: 'none' }];
    if (options.rebound) {
      openFrames[0].easing = EASE;
      openFrames[1].easing = 'ease-out';
    }
    animate(openFrames, 0, 1, options.openDuration || 350);
  }

  function workspaceSheet(mask, close, background, canDrag) {
    sheet(mask, close, {
      handle: mask.querySelector('.sheet-grab'), background: background, shrink: .98,
      openDuration: 360, closeDuration: 240, rebound: .6, resistance: true, canDrag: canDrag
    });
  }

  return { edge: edge, sheet: sheet, workspaceSheet: workspaceSheet };
})();
