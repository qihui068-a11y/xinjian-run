/* 信笺 · 鸽屋附近设备。发现会话与局域网通讯服务独立。 */
'use strict';

var RadarSheet = (function () {
  function open(owner, trigger, onPeer) {
    if (Nav.finishTransition) {
      Nav.finishTransition();
      Nav.finishTransition = null;
    }
    popover.close();
    var mask = document.createElement('div');
    mask.className = 'mask workspace-sheet-mask radar-mask';
    mask.innerHTML =
      '<section class="sheet workspace-sheet radar-sheet" role="dialog" aria-modal="true" aria-labelledby="radarTitle" aria-describedby="radarSubtitle">' +
      '<header class="workspace-sheet-header radar-header"><div class="sheet-grab" aria-hidden="true"></div>' +
      '<div><h1 id="radarTitle">附近设备</h1><p id="radarSubtitle">发现同一局域网内的朋友</p></div>' +
      '<button type="button" class="workspace-sheet-close" aria-label="关闭附近设备">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></header>' +
      '<div class="radar-body"><div class="radar-stage" aria-hidden="true"><div class="radar-visual">' +
      '<svg class="radar-lines" viewBox="0 0 200 200"><path d="M100 2v196M2 100h196"/>' +
      '<circle cx="100" cy="100" r="24"/><circle cx="100" cy="100" r="48"/>' +
      '<circle cx="100" cy="100" r="72"/><circle cx="100" cy="100" r="98"/></svg>' +
      '<div class="radar-effects"><div class="radar-sweep"></div>' +
      '<span class="radar-wave"></span><span class="radar-wave"></span><span class="radar-wave"></span></div>' +
      '<span class="radar-center"><svg class="ui-icon" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.5"/>' +
      '<path d="M11 17h2"/></svg></span><span class="radar-dots"></span></div></div>' +
      '<div class="radar-state"><p class="radar-status" role="status"></p><p class="radar-note" hidden>光点仅表示发现了设备</p></div>' +
      '<div class="radar-results" role="group" aria-label="已发现的设备"></div></div>' +
      '<footer class="workspace-sheet-footer radar-footer"><p>仅限可信网络 · 明文传输</p>' +
      '<button type="button" class="workspace-sheet-action radar-action">停止搜索</button></footer></section>';

    var panel = mask.querySelector('.radar-sheet');
    var closeButton = mask.querySelector('.workspace-sheet-close');
    var action = mask.querySelector('.radar-action');
    var status = mask.querySelector('.radar-status');
    var note = mask.querySelector('.radar-note');
    var list = mask.querySelector('.radar-results');
    var dots = mask.querySelector('.radar-dots');
    var peers = new Map(), animations = new Map();
    var savedInert = $app.inert;
    var scanning = true, enabling = false, closing = false, destination, layer;
    document.body.appendChild(mask);
    $app.inert = true;
    trigger.setAttribute('aria-expanded', 'true');

    function play(node, frames, duration, settled) {
      var previous = animations.get(node);
      if (previous) previous.cancel();
      var animation = Motion.play(node, frames, duration);
      if (!animation) { if (settled) settled(); return; }
      animations.set(node, animation);
      function done() {
        if (animations.get(node) === animation) animations.delete(node);
        if (settled) settled();
      }
      animation.finished.then(done, done);
    }
    function add(peer, animate) {
      var row = document.createElement('div');
      row.className = 'radar-result';
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'radar-peer';
      button.dataset.peer = peer.id;
      button.innerHTML = svg('profile') +
        '<span><strong></strong><small></small></span>' + svg('chevron-right');
      button.querySelector('small').textContent = Lan.short(peer.id);
      row.appendChild(button);

      var dot = document.createElement('span');
      dot.className = 'radar-dot';
      // Stable decor derived only from the peer identifier. No location data.
      var hash = Array.prototype.reduce.call(peer.id, function (n, ch) {
        return (Math.imul(n, 31) + ch.charCodeAt(0)) >>> 0;
      }, 7);
      var angle = (hash % 360) * Math.PI / 180;
      var radius = 27 + (hash >>> 12) % 15;
      dot.style.left = (50 + Math.cos(angle) * radius) + '%';
      dot.style.top = (50 + Math.sin(angle) * radius) + '%';
      row.style.gridTemplateRows = '1fr';
      list.appendChild(row);
      dots.appendChild(dot);
      var entry = { row: row, button: button, name: button.querySelector('strong'), dot: dot, leaving: false };
      peers.set(peer.id, entry);
      if (animate) {
        play(row, [{ gridTemplateRows: '0fr', opacity: 0 }, { gridTemplateRows: '1fr', opacity: 1 }], 300);
        play(button, [{ transform: 'translateY(7px)' }, { transform: 'none' }], 300);
        if (Anim.enabled() && !document.hidden) {
          var ring = document.createElement('span');
          ring.className = 'radar-dot-ring';
          dot.appendChild(ring);
          play(ring, [{ opacity: .65, transform: 'scale(.35)' }, { opacity: 0, transform: 'scale(3)' }], 530,
            function () { ring.remove(); });
          play(dot, [{ opacity: .1, scale: '.55' }, { opacity: 1, scale: '1.012', offset: .83 },
            { opacity: 1, scale: '1' }], 260);
        }
      }
      return entry;
    }
    function remove(id, entry) {
      entry.leaving = true;
      if (entry.button === document.activeElement) action.focus({ preventScroll: true });
      entry.button.disabled = true;
      entry.row.setAttribute('aria-hidden', 'true');
      var height = getComputedStyle(entry.row).gridTemplateRows;
      var opacity = getComputedStyle(entry.row).opacity;
      play(entry.dot, [{ opacity: 1 }, { opacity: 0 }], 220);
      play(entry.row, [
        { opacity: opacity, gridTemplateRows: height || '1fr' },
        { opacity: 0, gridTemplateRows: '0px' }
      ], 220, function () {
        if (!entry.leaving) return;
        entry.row.remove();
        entry.dot.remove();
        peers.delete(id);
        if (!closing && !peers.size) panel.classList.remove('has-results');
      });
    }
    function sync(animate) {
      if (closing) return;
      var running = Lan.running();
      var visiblePeers = (running ? Lan.peers() : []).filter(function (peer) {
        // Pausing the display retains live results, while native discovery
        // continues to maintain the peer cache used to deliver chat messages.
        return scanning || (peers.has(peer.id) && !peers.get(peer.id).leaving);
      });
      var ids = new Set(visiblePeers.map(function (peer) { return peer.id; }));
      if (ids.size) panel.classList.add('has-results');
      peers.forEach(function (entry, id) {
        if (!ids.has(id) && !entry.leaving) remove(id, entry);
      });
      visiblePeers.forEach(function (peer) {
        var entry = peers.get(peer.id) || add(peer, animate);
        if (entry.leaving) {
          entry.leaving = false;
          var exit = animations.get(entry.row), dotExit = animations.get(entry.dot);
          if (exit) exit.cancel();
          if (dotExit) dotExit.cancel();
          entry.row.removeAttribute('aria-hidden');
          entry.button.disabled = false;
        }
        var name = peer.name || '未命名设备';
        if (entry.name.textContent !== name) entry.name.textContent = name;
      });
      panel.classList.toggle('is-scanning', running && scanning);
      var count = ids.size ? '已发现 ' + ids.size + ' 台设备' : '';
      var text = !running ? (Lan.available ? '局域网未开启' : '附近设备搜索需要 Android 应用') :
        scanning ? (count || '正在搜索附近设备…') : ('搜索已停止' + (count ? ' · ' + count : ''));
      if (status.textContent !== text) status.textContent = text;
      note.hidden = !ids.size;
      action.disabled = enabling || (!running && !Lan.available);
      var label = !running ? '开启局域网并搜索' : scanning ? '停止搜索' : '重新搜索';
      if (action.textContent !== label) {
        action.textContent = label;
        if (animate) play(action, [{ opacity: .68 }, { opacity: 1 }], 200);
      }
    }

    var unobserve = Lan.observe(function () { sync(true); });
    function systemBack() { layer = Back.open(systemBack); close(); }
    layer = Back.open(systemBack);

    function close(immediate) {
      if (closing) {
        if (immediate) { destination = null; mask.__dismiss(null, true); }
        return;
      }
      closing = true;
      unobserve();
      panel.classList.remove('is-scanning');
      animations.forEach(function (animation) { animation.cancel(); });
      animations.clear();
      mask.__dismiss(function () {
        Back.done(layer);
        $app.inert = savedInert;
        trigger.setAttribute('aria-expanded', 'false');
        if (destination) onPeer(destination);
        else if (!immediate && trigger.isConnected) trigger.focus({ preventScroll: true });
      }, immediate);
    }

    GestureMotion.workspaceSheet(mask, close.bind(null, false), owner, function () { return Back.isTop(layer); });
    closeButton.focus({ preventScroll: true });
    closeButton.onclick = function () { close(); };
    mask.addEventListener('click', function (event) {
      if (event.target === mask) close();
      if (closing) return;
      var button = event.target.closest('[data-peer]');
      if (!button || button.disabled) return;
      if (!Lan.peer(button.dataset.peer)) return;
      destination = button.dataset.peer;
      close();
    });
    mask.addEventListener('keydown', function (event) {
      if (!Back.isTop(layer)) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      var buttons = mask.querySelectorAll('button:not(:disabled)');
      var first = buttons[0], last = buttons[buttons.length - 1];
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    });
    action.onclick = function () {
      if (Lan.running()) {
        scanning = !scanning;
        sync(true);
        return;
      }
      enabling = true;
      sync(false);
      Lan.enable().then(function (started) {
        if (closing) return;
        if (started) scanning = true;
        enabling = false;
        sync(true);
        if (!action.disabled) action.focus({ preventScroll: true });
      });
    };
    sync(false);
    return { dispose: function () { destination = null; close(true); }, isOpen: function () { return mask.isConnected; } };
  }

  return { open: open };
})();
