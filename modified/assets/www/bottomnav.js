/* 信笺 · 共享主导航 */
'use strict';

var BottomNav = (function () {
  var destinations = [
    ['home', '主页', 'home'], ['shelf', '书架', 'bookshelf'],
    ['pigeon', '鸽屋', 'pigeon'], ['me', '小家', 'profile']
  ];
  var nav, buttons, indicator, badge, selected, animation, gesture, swallowClick;

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
      if (swallowClick && event.detail) return;
      if (button) select(button.dataset.tab);
    });
    nav.addEventListener('pointerdown', function (event) {
      swallowClick = false;
      if (event.button !== 0 || !event.isPrimary) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, sliding: false };
    });
    nav.addEventListener('pointermove', function (event) {
      if (!gesture || gesture.id !== event.pointerId || gesture.sliding) return;
      var dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
      if (dy > 10 && dy > dx) { gesture = null; return; }
      if (dx > 12 && dx > dy) {
        gesture.sliding = true;
        nav.setPointerCapture(event.pointerId);
      }
    });
    nav.addEventListener('pointerup', function (event) {
      if (!gesture || gesture.id !== event.pointerId) return;
      var sliding = gesture.sliding;
      gesture = null;
      if (!sliding) return;
      swallowClick = true;
      var bounds = nav.getBoundingClientRect();
      if (event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      for (var i = 0; i < buttons.length; i++) {
        var item = buttons[i].getBoundingClientRect();
        if (event.clientX >= item.left && event.clientX <= item.right) {
          select(buttons[i].dataset.tab);
          return;
        }
      }
    });
    nav.addEventListener('pointercancel', function () { gesture = null; });
    window.addEventListener('resize', cancel);
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
    animation = null;
  }

  function slide(from, previous) {
    if (!from || !Anim.enabled() || !indicator.animate) return;
    var end = indicator.getBoundingClientRect();
    if (!end.width) return;
    var start = from.left - end.left;
    if (Math.abs(start) < 1) return;
    var overshoot = start < 0 ? 5 : -5;
    var options = getComputedStyle(nav);
    animation = indicator.animate([
      { transform: 'translateX(' + start + 'px) scaleX(' + from.width / end.width + ')' },
      { transform: 'translateX(' + (start * .4) + 'px) scaleX(1.12)', offset: .43 },
      { transform: 'translateX(' + overshoot + 'px) scaleX(.98)', offset: .83 },
      { transform: 'none' }
    ], { duration: parseFloat(options.getPropertyValue('--tab-slide-duration')), easing: options.getPropertyValue('--ease-navigation').trim() || 'ease-out' });
    animation.onfinish = function () { animation = null; };
    var icon = buttons[selected].querySelector('svg');
    if (icon.animate && previous !== selected) {
      icon.animate([{ transform: 'scale(.84)' }, { transform: 'scale(1.12)', offset: .67 }, { transform: 'none' }],
        { duration: 260, easing: options.getPropertyValue('--ease-navigation').trim() || 'ease-out' });
    }
  }

  function update(name) {
    if (!nav) render();
    var index = destinations.findIndex(function (tab) { return tab[0] === name; });
    var previous = selected;
    var from = !nav.hidden && previous !== undefined ? indicator.getBoundingClientRect() : null;
    if (index !== previous || index < 0) cancel();
    nav.hidden = index < 0;
    if (index < 0) { selected = index; return; }
    paintBadge();
    if (previous === index) return;
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
    slide(previous >= 0 ? from : null, previous);
  }

  return { includes: includes, update: update };
})();
