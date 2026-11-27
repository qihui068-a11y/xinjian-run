/* 信笺 · 共享主导航 */
'use strict';

var BottomNav = (function () {
  var destinations = [
    ['home', '主页', 'home'], ['shelf', '书架', 'bookshelf'],
    ['pigeon', '鸽屋', 'pigeon'], ['me', '小家', 'profile']
  ];
  var nav, buttons, indicator, badge, selected, animation, iconAnimation, gesture;
  var swallowClick = false;
  var preview = -1;
  var DRAG_SLOP = 8;

  function includes(name) {
    return destinations.some(function (tab) { return tab[0] === name; });
  }

  function select(name) {
    var current = $app.firstElementChild;
    if (current && current.__leaveForTab) current.__leaveForTab(function () { Nav.tab(name); });
    else Nav.tab(name);
  }

  function render() {
    nav = document.createElement('nav');
    nav.className = 'tabbar glass main-tabs';
    nav.setAttribute('aria-label', '主导航');
    nav.innerHTML = '<span class="tab-capsule" aria-hidden="true"></span>' +
      destinations.map(function (tab) {
        return '<button type="button" class="tab" data-tab="' + tab[0] + '">' +
          '<span class="tab-icon">' + svg(tab[2]) +
          (tab[0] === 'pigeon' ? '<span class="tab-badge" hidden></span>' : '') +
          '</span><span class="tab-label">' + tab[1] + '</span></button>';
      }).join('');
    indicator = nav.firstElementChild;
    buttons = nav.querySelectorAll('.tab');
    badge = nav.querySelector('.tab-badge');
    nav.addEventListener('click', function (event) {
      var button = event.target.closest('[data-tab]');
      if (swallowClick && event.detail) {
        swallowClick = false;
        return;
      }
      if (button) select(button.dataset.tab);
    });
    nav.addEventListener('pointerdown', startPress);
    window.addEventListener('pointermove', movePress, { passive: true });
    window.addEventListener('pointerup', releasePress);
    window.addEventListener('pointercancel', cancelPress);
    nav.addEventListener('lostpointercapture', function (event) {
      // Touch starts with implicit capture on the button, then transfers here.
      if (event.target === nav) cancelPress(event);
    });
    window.addEventListener('blur', resetMotion);
    window.addEventListener('resize', resetMotion);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) resetMotion();
    });
    window.addEventListener('xj:motionchange', function () {
      if (!Anim.enabled()) resetMotion();
    });
    Lan.observe(paintBadge);
    $app.appendChild(nav);
  }

  function paintBadge() {
    var count = Pigeon.requestCount();
    badge.hidden = !count;
    badge.textContent = count > 99 ? '99+' : count || '';
    if (count) badge.setAttribute('aria-label', count + ' 条未读好友申请');
    else badge.removeAttribute('aria-label');
  }

  function cancel() {
    if (animation) animation.cancel();
    if (iconAnimation) iconAnimation.cancel();
    animation = null;
    iconAnimation = null;
  }

  function clamp(value, low, high) { return Math.max(low, Math.min(value, high)); }

  function measure() {
    var style = getComputedStyle(indicator);
    var width = parseFloat(style.width);
    var height = parseFloat(style.height);
    if (!(width > 0 && height > 0)) return null;
    var origin = nav.getBoundingClientRect().left + nav.clientLeft;
    return {
      origin: origin, width: width, height: height,
      span: nav.clientWidth, center: parseFloat(style.left) + width / 2
    };
  }

  function visiblePose(layout) {
    var rect = indicator.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - layout.origin, sx: rect.width / layout.width, sy: rect.height / layout.height };
  }

  function boundedX(x, sx, layout) {
    var half = layout.width * sx / 2;
    return clamp(x, half, layout.span - half);
  }

  function poseTransform(pose, layout) {
    return 'translateX(' + (boundedX(pose.x, pose.sx, layout) - layout.center) +
      'px) scale(' + pose.sx + ',' + pose.sy + ')';
  }

  function nearest(x, centers) {
    var best = 0;
    for (var i = 1; i < centers.length; i++) {
      if (Math.abs(centers[i] - x) < Math.abs(centers[best] - x)) best = i;
    }
    return best;
  }

  function showPreview(index) {
    if (preview === index) return;
    if (preview >= 0) buttons[preview].classList.remove('tab-preview');
    preview = index;
    if (preview >= 0) buttons[preview].classList.add('tab-preview');
  }

  function startPress(event) {
    if (!event.isPrimary) {
      if (gesture) restorePress(true);
      return;
    }
    if (event.button !== 0 || gesture || selected < 0) return;
    var layout = measure();
    if (!layout) return;
    var pose = visiblePose(layout);
    cancel();
    swallowClick = false;
    var centers = Array.prototype.map.call(buttons, function (button) {
      var rect = button.getBoundingClientRect();
      return rect.left + rect.width / 2 - layout.origin;
    });
    var now = performance.now();
    gesture = {
      id: event.pointerId, startX: event.clientX, startY: event.clientY,
      button: event.target.closest('[data-tab]'),
      lastX: event.clientX, lastMove: now, lastDraw: now, speed: 0,
      targetX: event.clientX - layout.origin,
      layout: layout, centers: centers, pose: pose, frame: 0,
      animated: Anim.enabled()
    };
    nav.classList.add('tab-pressing');
    indicator.style.transform = poseTransform(pose, layout);
    queueDraw();
  }

  function queueDraw() {
    if (!gesture.frame) gesture.frame = requestAnimationFrame(draw);
  }

  function draw(now) {
    var press = gesture;
    if (!press) return;
    press.frame = 0;
    if (!press.animated) {
      press.pose.x = boundedX(press.targetX, 1, press.layout);
      press.pose.sx = press.pose.sy = 1;
      indicator.style.transform = poseTransform(press.pose, press.layout);
      showPreview(nearest(press.pose.x, press.centers));
      return;
    }
    var dt = Math.max(0, now - press.lastDraw);
    press.lastDraw = now;
    var recent = press.dragging ? clamp(1 - (now - press.lastMove - 34) / 105, 0, 1) : 0;
    var sx = 1.025 + (.02 + .02 * press.speed - .025) * recent;
    var sy = 1.025 - (.025 + .018 * press.speed) * recent;
    var shapeBlend = 1 - Math.exp(-dt / 34);
    press.pose.sx += (sx - press.pose.sx) * shapeBlend;
    press.pose.sy += (sy - press.pose.sy) * shapeBlend;
    var target = boundedX(press.targetX, press.pose.sx, press.layout);
    // Exponential damping reaches about 98% of a stationary target in 220ms.
    var remaining = (target - press.pose.x) * Math.exp(-dt / 55);
    press.pose.x = Math.abs(remaining) < .15 ? target : target - remaining;
    indicator.style.transform = poseTransform(press.pose, press.layout);
    showPreview(nearest(press.pose.x, press.centers));
    if (recent || Math.abs(remaining) >= .15 ||
        Math.abs(sx - press.pose.sx) > .001 || Math.abs(sy - press.pose.sy) > .001) {
      queueDraw();
    }
  }

  function movePress(event) {
    var press = gesture;
    if (!press || event.pointerId !== press.id) return;
    var dx = event.clientX - press.startX;
    var dy = Math.abs(event.clientY - press.startY);
    if (!press.dragging) {
      if (dy > DRAG_SLOP && dy > Math.abs(dx)) return restorePress(true);
      if (Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > dy) {
        press.dragging = true;
        // Capture only after the threshold so a tap still goes to its original button.
        try { nav.setPointerCapture(press.id); } catch (e) {}
      }
    }
    var now = performance.now();
    if (event.clientX !== press.lastX) {
      press.speed = clamp(Math.abs(event.clientX - press.lastX) / Math.max(8, now - press.lastMove) / 1.5, 0, 1);
      press.lastX = event.clientX;
      press.lastMove = now;
    }
    press.targetX = event.clientX - press.layout.origin;
    queueDraw();
  }

  function stopPress(suppress) {
    var press = gesture;
    if (!press) return null;
    gesture = null;
    cancelAnimationFrame(press.frame);
    if (suppress) swallowClick = true;
    if (nav.hasPointerCapture && nav.hasPointerCapture(press.id)) nav.releasePointerCapture(press.id);
    nav.classList.remove('tab-pressing');
    showPreview(-1);
    return press;
  }

  function restorePress(suppress) {
    var press = stopPress(suppress);
    if (press) slide(visiblePose(press.layout));
  }

  function releasePress(event) {
    if (!gesture || gesture.id !== event.pointerId) return;
    movePress(event);
    if (!gesture) return;
    var button = gesture.button;
    // A quick touch after a drag may get pointerup without a synthesized click.
    var tap = !gesture.dragging && event.pointerType === 'touch' && button &&
      button.contains(document.elementFromPoint(event.clientX, event.clientY));
    var press = stopPress(gesture.dragging || tap);
    var destination = tap ? button.dataset.tab : null;
    if (press.dragging || !button) {
      // Route from the finger's final position, even while the capsule is catching up.
      var target = nearest(press.targetX, press.centers);
      if (target !== selected) destination = destinations[target][0];
    }
    var from = visiblePose(press.layout);
    var previous = selected;
    if (destination) select(destination);
    if (selected === previous) slide(from);
  }

  function cancelPress(event) {
    if (gesture && gesture.id === event.pointerId) restorePress(true);
  }

  function resetMotion() {
    stopPress(true);
    cancel();
    indicator.style.transform = '';
  }

  function slide(from, previous) {
    cancel();
    indicator.style.transform = '';
    if (!from || !Anim.enabled() || !indicator.animate) return;
    var layout = measure();
    if (!layout) return;
    var delta = layout.center - from.x;
    if (Math.abs(delta) < .5 && Math.abs(from.sx - 1) < .002 && Math.abs(from.sy - 1) < .002) return;
    var duration = parseFloat(getComputedStyle(nav).getPropertyValue('--tab-slide-duration')) || 280;
    var easeOut = 'cubic-bezier(.16,.85,.28,1)';
    animation = indicator.animate([
      { transform: poseTransform(from, layout), easing: easeOut },
      { transform: poseTransform({ x: layout.center + delta * .008, sx: 1, sy: 1 }, layout), offset: .86, easing: 'ease-out' },
      { transform: 'none' }
    ], { duration: duration });
    animation.onfinish = function () { animation = null; };
    var icon = buttons[selected].querySelector('svg');
    if (icon.animate && previous >= 0 && previous !== selected) {
      iconAnimation = icon.animate(
        [{ transform: 'scale(.98)' }, { transform: 'scale(1.01)', offset: .75 }, { transform: 'none' }],
        { duration: 200, easing: easeOut });
      iconAnimation.onfinish = function () { iconAnimation = null; };
    }
  }

  function update(name) {
    if (!nav) render();
    var index = destinations.findIndex(function (tab) { return tab[0] === name; });
    var previous = selected;
    var layout = !nav.hidden && previous >= 0 && (previous !== index || gesture) ? measure() : null;
    var from = layout ? visiblePose(layout) : null;
    stopPress(true);
    nav.hidden = index < 0;
    if (index < 0) { selected = index; resetMotion(); return; }
    paintBadge();
    if (previous === index) {
      if (from) slide(from);
      return;
    }
    selected = index;
    nav.style.setProperty('--tab-position', index);
    destinations.forEach(function (tab, i) {
      var current = i === index;
      var button = buttons[i];
      button.classList.toggle('active', current);
      if (current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      var old = button.querySelector('svg');
      var name = tab[2] + (current ? '-active' : '');
      if (old.dataset.icon !== name) old.outerHTML = svg(name);
    });
    slide(from, previous);
  }

  return { includes: includes, update: update };
})();
