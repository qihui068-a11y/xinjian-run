/* 信笺 · 核心（工具 / 主题 / Back / Nav / VIEWS 容器）

   拆分后**必须第一个加载**：后面所有视图都用这里的 esc / svg / toast / sheet。
   这里不再包 IIFE——拆分后各文件共享同一个全局作用域，包起来就互相看不见了。
   全局污染在这个 App 里无所谓：没有第三方脚本，highlight/md/anim 各自挂在自己的
   命名空间（HL / MD / Anim），不冲突。 */

'use strict';


  var $app = document.getElementById('app');


  /* ================= 小工具 ================= */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '\u0026quot;');
  }


  var SVG = {
    back: '<path d="M14 5l-7 7 7 7M7 12h13"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    homeFill: '<path d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>',
    meFill: '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20v-2a7 7 0 0 1 14 0v2z"/>',
    createFill: '<circle cx="12" cy="12" r="9"/><path class="tab-fill-mark" d="M12 8v8m-4-4h8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L4.6 17.4z"/><path d="M14.5 5.5l3 3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    book: '<path d="M3 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H3z"/><path d="M21 5h-6a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h6z"/>',
    town: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M18 19a5.5 5.5 0 0 0-2-4"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    shop: '<path d="M4 9h16l-1-4H5z"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/>',
    home: '<path d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M9 20v-6h6v6"/>',
    me: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    sort: '<path d="M7 4v16M4 17l3 3 3-3"/><path d="M14 7h6M14 12h4M14 17h2"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    undo: '<path d="M9 6l-5 5 5 5M4 11h11a4 4 0 0 1 0 8h-3"/>',
    redo: '<path d="M15 6l5 5-5 5m5-5H9a4 4 0 0 0 0 8h3"/>',
    expand: '<path d="M14 4h6v6M20 4l-6 6M10 20H4v-6m0 6l6-6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    bird: '<path d="M21 4l-9 8-3-1-5 3 1-5 4-2h4z"/><path d="M12 12l1 8"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M4.6 7.6l1.9 1.1M17.5 15.3l1.9 1.1M4.6 16.4l1.9-1.1M17.5 8.7l1.9-1.1"/>',
    download: '<path d="M12 3v11M8 10l4 4 4-4"/><path d="M5 19h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01"/>',
    cup: '<path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2"/><path d="M6 21h10"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 5.3a3.2 3.2 0 0 1 0 5.4"/><path d="M18 19a5.5 5.5 0 0 0-2-4.3"/>',
    contacts: '<path d="M6 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M6 3v18"/><circle cx="13" cy="10" r="1.9"/><path d="M10.6 15.6a2.9 2.9 0 0 1 4.8 0"/>',
    wifi: '<path d="M2.5 8.5a15 15 0 0 1 19 0"/><path d="M5.5 12a10 10 0 0 1 13 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/>',
    wifiOff: '<path d="M2.5 8.5a15 15 0 0 1 6-3.4"/><path d="M15.5 5.4a15 15 0 0 1 6 3.1"/><path d="M5.5 12a10 10 0 0 1 3-1.9"/><path d="M15.5 10.4a10 10 0 0 1 3 1.6"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/><path d="M3 3l18 18"/>',
    userPlus: '<circle cx="10" cy="8" r="3.2"/><path d="M4 19a6 6 0 0 1 12 0"/><path d="M19 7v6M16 10h6"/>',
    scan: '<path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M4 12h16"/>',
    pay: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/><path d="M7 14.5h3"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M4 17l5-5 3.5 3.5L15 13l5 5"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="12" cy="13" r="3.2"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    folder: '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>'
  };

  /* 图形来自 design/icons/adaptive，内联以继承按钮的 currentColor。 */
  var adaptiveIcons = {
    'home': '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3Z"/>',
    'home-active': '<path fill="currentColor" stroke="none" d="M2.5 10.2 12 2l9.5 8.2V20a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2Z"/>',
    'bookshelf': '<path d="m12 3 10 5-10 5L2 8 12 3ZM2 12l10 5 10-5M2 16l10 5 10-5"/>',
    'bookshelf-active': '<path fill="currentColor" stroke="none" d="m12 2 11 5.5L12 13 1 7.5Z"/><path d="m2 12 10 5 10-5M2 16.5 12 22l10-5.5"/>',
    'pigeon': '<path d="M3 11c3.5 2.7 6.5 2.6 9.2-.5C14.8 7.6 15 4 18.4 4c1.8 0 3 1 3.6 2.5L23 8l-2.3 1.2c.1 6.9-4.6 12.1-11 11.1C5.7 19.7 2.9 16.3 2 12Z"/><circle cx="18.8" cy="6.8" r=".65" fill="currentColor" stroke="none"/>',
    'pigeon-active': '<path fill="currentColor" stroke="none" d="M2 10c4 3 7 3 10-.5C14.6 6.5 15 3.5 18.5 3.5c2.2 0 3.8 1.4 4.1 3.1L24 8l-2.5 1.5c0 7.3-5 12.4-12 11.4C5.2 20.2 1.8 16.4 1 11Z"/><circle cx="18.9" cy="6.6" r=".8" fill="var(--icon-cutout, #fff)" stroke="none"/>',
    'profile': '<circle cx="12" cy="7.2" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    'profile-active': '<circle cx="12" cy="7" r="4.5" fill="currentColor" stroke="none"/><path fill="currentColor" stroke="none" d="M3 22v-2a9 9 0 0 1 18 0v2Z"/>',
    'town': '<circle cx="9" cy="7" r="3.8"/><path d="M2 21v-1.8a7 7 0 0 1 14 0V21M16.5 3.5a3.8 3.8 0 0 1 0 7.2M18.5 14c2.2 1.1 3.5 3 3.5 5.2V21"/>',
    'leaf': '<path d="M3 21c5-8 9-10 15-13M5 17C1 7 10 4 21 3c-1 11-5 18-14 15"/>',
    'inn': '<path d="M4 3h16l2 6v1a3.4 3.4 0 0 1-6 2.1 4.3 4.3 0 0 1-8 0A3.4 3.4 0 0 1 2 10V9ZM4 13v8h16v-8M10 21v-5h4v5"/>',
    'moon': '<path d="M20.7 15.4A9.2 9.2 0 0 1 8.6 3.3 9.2 9.2 0 1 0 20.7 15.4Z"/>',
    'sun': '<circle cx="12" cy="12" r="4.5"/><path d="M12 1v2.5m0 17V23M1 12h2.5m17 0H23M4.2 4.2 6 6m12 12 1.8 1.8M4.2 19.8 6 18M18 6l1.8-1.8"/>',
    'chevron-right': '<path d="m9 5 7 7-7 7"/>',
    'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    'file-plus': '<path d="M5 2h9l5 5v15H5Z M14 2v6h5M12 11v7m-3.5-3.5h7"/>',
    'file-code': '<path d="M5 2h9l5 5v15H5Z M14 2v6h5M10 11l-3 3 3 3m4-6 3 3-3 3"/>',
    'download': '<path d="M12 2v13m-5-5 5 5 5-5M3 15v5h18v-5"/>',
    'wifi': '<path d="M2 8a15.5 15.5 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 16a4.7 4.7 0 0 1 6 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>',
    'radar': '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    'plus-square': '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/>',
    'bell': '<path d="M5 9a7 7 0 0 1 14 0v5l2 3H3l2-3ZM9 21h6"/>',
    'more': '<circle cx="12" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.4" fill="currentColor" stroke="none"/>',
    'play': '<path d="M6 3 21 12 6 21Z"/>',
    'stop': '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    'terminal': '<path d="m3 5 7 7-7 7m10 0h9"/>',
    'plus': '<path d="M12 4v16M4 12h16"/>',
  };

  function svg(n) {
    if (Object.prototype.hasOwnProperty.call(adaptiveIcons, n)) {
      return '<svg class="ui-icon adaptive-icon" data-icon="' + n + '" viewBox="0 0 24 24"' +
        ' aria-hidden="true" focusable="false">' + adaptiveIcons[n] + '</svg>';
    }
    return '<svg class="ui-icon' + (/Fill$/.test(n) ? ' tab-fill' : '') +
      '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (SVG[n] || '') + '</svg>';
  }


  /* ================= 通用 UI ================= */
  var toastEl = null, toastTimer = null;

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1600);
  }


  /* 弹层离场结束后摘节点。关闭动效时直接摘除。 */
  function dismiss(mask) {
    var anim = (typeof Anim !== 'undefined') && Anim.enabled();
    if (!anim) { mask.remove(); return; }
    mask.classList.add('m-leave');
    mask.setAttribute('aria-hidden', 'true');
    var sheet = mask.querySelector('.sheet');
    if (sheet) sheet.addEventListener('animationend', function () { mask.remove(); }, { once: true });
    setTimeout(function () { mask.remove(); }, 450);
  }

  /* items: [{label, value, danger}] | 'sep' | {title:'…'} */
  function sheet(title, items, alert) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      var previousFocus = document.activeElement;
      mask.className = alert ? 'mask alert-mask' : 'mask';
      var html = '<div class="sheet' + (alert ? ' sheet-alert' : '') +
        '" role="' + (alert ? 'alertdialog' : 'dialog') + '" aria-modal="true" aria-label="' + esc(title || '选项') + '">';
      if (title) html += '<div class="sheet-title">' + esc(title) + '</div>';
      items.forEach(function (it, idx) {
        if (it === 'sep') { html += '<div class="sheet-sep"></div>'; return; }
        if (it.title) { html += '<div class="sheet-title">' + esc(it.title) + '</div>'; return; }
        html += '<button type="button" class="sheet-item' + (it.side ? ' sheet-choice' : '') +
          '" data-i="' + idx + '"' + (it.current ? ' aria-current="true"' : '') +
          (it.key ? ' data-fmt="' + esc(it.key) + '"' : '') + '>' + esc(it.label) +
          (it.side ? '<span>' + esc(it.side) + '</span>' : '') + '</button>';
      });
      html += '</div>';
      mask.innerHTML = html;
      document.body.appendChild(mask);
      var first = mask.querySelector('[aria-current="true"]') || mask.querySelector('button');
      if (first) first.focus({ preventScroll: true });
      function restoreFocus() {
        if (previousFocus && previousFocus.isConnected && !previousFocus.matches('input, textarea')) {
          previousFocus.focus({ preventScroll: true });
        }
      }

      var layer = null, settled = false;

      /* 用户点选/点遮罩关闭：要同时把历史条目退掉 */
      function close(v) {
        if (settled) return;
        settled = true;
        dismiss(mask);
        if (layer) Back.done(layer);
        restoreFocus();
        resolve(v);
      }
      /* 系统返回键关闭：历史已经退过了，这里只收拾界面 */
      layer = Back.open(function () {
        if (settled) return;
        settled = true;
        dismiss(mask);
        restoreFocus();
        resolve(null);
      });

      mask.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); close(null); }
      });
      mask.addEventListener('click', function (e) {
        if (e.target === mask) return close(null);
        var it = e.target.closest('.sheet-item');
        if (!it) return;
        var item = items[+it.dataset.i];
        close(item && item.value !== undefined ? item.value : null);
      });
    });
  }


  function confirmBox(title, okLabel) {
    return sheet(title, [
      { label: okLabel || '确定', value: true, danger: true },
      'sep',
      { label: '取消', value: false }
    ], true).then(function (v) { return v === true; });
  }


  function inputBox(title, value, placeholder, keepWhitespace) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'mask';
      mask.innerHTML =
        '<div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="sheet-title">' + esc(title) + '</div>' +
        '<div class="form" style="padding:4px 22px 14px">' +
        '<div class="field"><input type="text" id="_ipt" value="' + esc(value || '') +
        '" placeholder="' + esc(placeholder || '') + '"></div></div>' +
        '<button type="button" class="sheet-item" data-act="ok" style="justify-content:center;font-weight:600">确定</button>' +
        '</div>';
      document.body.appendChild(mask);
      var ipt = mask.querySelector('#_ipt');
      ipt.setAttribute('aria-label', title);
      if (keepWhitespace) {
        ipt.setAttribute('autocapitalize', 'off');
        ipt.setAttribute('autocomplete', 'off');
        ipt.spellcheck = false;
      }
      setTimeout(function () { ipt.focus(); ipt.select(); }, 50);

      var layer = null, settled = false;
      function close(v) {
        if (settled) return;
        settled = true;
        dismiss(mask);
        if (layer) Back.done(layer);
        resolve(v);
      }
      layer = Back.open(function () {
        if (settled) return;
        settled = true;
        dismiss(mask);
        resolve(null);
      });
      function submit() {
        close(keepWhitespace ? ipt.value : ipt.value.trim());
      }
      mask.addEventListener('click', function (e) {
        if (e.target === mask) return close(null);
        if (e.target.closest('[data-act=ok]')) submit();
      });
      ipt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) submit();
      });
    });
  }


  /* 下拉气泡菜单：从某个按钮下方长出来，点空白关闭，占返回键一层。
     items: [{ico, label, value}] | 'sep' */
  function popover(items, anchorEl) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'pop';
      var html = '<div class="pop-menu">';
      items.forEach(function (it, idx) {
        if (it === 'sep') { html += '<div class="pop-sep"></div>'; return; }
        html += '<div class="pop-item" data-i="' + idx + '">' +
          svg(it.ico) + '<span>' + esc(it.label) + '</span></div>';
      });
      html += '</div>';
      mask.innerHTML = html;
      document.body.appendChild(mask);

      var menu = mask.firstChild;
      var rect = (anchorEl && anchorEl.getBoundingClientRect) ? anchorEl.getBoundingClientRect() : null;
      var top = (rect && rect.bottom) ? rect.bottom + 10 : 64;
      var right = rect ? (window.innerWidth - rect.right) : 12;
      if (!isFinite(right) || right < 8) right = 8;
      if (right > window.innerWidth - 160) right = Math.max(8, window.innerWidth - 160);
      menu.style.top = top + 'px';
      menu.style.right = right + 'px';

      var layer = null, settled = false;
      function close(v) {
        if (settled) return;
        settled = true;
        dismiss(mask);
        if (layer) Back.done(layer);
        resolve(v);
      }
      /* 系统返回键：先关菜单，不许退出这一页 */
      layer = Back.open(function () {
        if (settled) return;
        settled = true;
        dismiss(mask);
        resolve(null);
      });
      mask.addEventListener('click', function (e) {
        if (e.target === mask) return close(null);
        var it = e.target.closest('.pop-item');
        if (!it) return;
        var item = items[+it.dataset.i];
        close(item && item.value !== undefined ? item.value : null);
      });
    });
  }


  /* ================= 主题 ================= */
  var themeNativePending = null;
  var themeNativeQueued = false;
  var themeApplied = null;      /* 上次真正落盘 + 通知原生的值 */
  var themeNativeHold = 0;      /* >0 表示「先别落盘/通知」（圆形揭示期间挂住） */

  /* 落盘 + 通知原生：两件都是同步 I/O / JNI，放在换色的那一帧里会直接掉帧。
     尤其是**第一次**写 localStorage —— WebView 要先把 DOMStorage 的库建出来，
     几十毫秒是常事，这正是「第一下特别卡，后面好一点」的主要来源。
     原生那边更重：setBackgroundDrawable + 状态栏/导航栏换色 → 整窗重排。 */
  function flushThemeNow() {
    if (themeNativeHold > 0) return;
    if (appearanceNeedsSaving) {
      appearanceNeedsSaving = false;
      try { localStorage.setItem('xj:appearance', appearanceOverride ? 'dark' : 'light'); } catch (e) {}
    }
    var v = themeNativePending;
    if (v === null || v === themeApplied) return;
    themeApplied = v;
    try { if (window.Bridge && Bridge.theme) Bridge.theme(!!v); } catch (e) {}
  }

  function queueThemeFlush() {
    if (themeNativeQueued) return;
    themeNativeQueued = true;
    var run = function () { themeNativeQueued = false; flushThemeNow(); };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 16);
  }

  /* 圆形揭示用：过渡开始前 holdThemeNative(true)，收尾/跳过时 false。
     这样落盘和 JNI 都排在动画之后，那 300ms 里一帧都不打扰。 */
  function holdThemeNative(on) {
    if (on) themeNativeHold++;
    else themeNativeHold = Math.max(0, themeNativeHold - 1);
    if (themeNativeHold === 0 && themeNativePending !== null) queueThemeFlush();
  }

  function applyTheme(isDark) {
    isDark = !!isDark;
    document.body.classList.toggle('dark', isDark);
    /* html 也必须挂上，光给 body 挂不够：
       --bg 原来只定义在 body 上，而 html 是 body 的父节点，取不到这个值，
       它的 background 会一直是 :root 里的白。WebView 的「画布」底色取自 html，
       所以键盘收起、视口变高的那一两帧，底部会露出一条白。
       这里再把底色直接写成内联样式，不依赖 CSS 变量是否解析成功。 */
    var root = document.documentElement;
    var changed = root.classList.contains('dark') !== isDark;
    root.classList.toggle('dark', isDark);
    root.style.backgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
    if (changed) document.dispatchEvent(new Event('xj:appearance'));
    /* 这里只改 DOM（快照要拍的就是它）；落盘和通知推到 flushThemeNow。 */
    themeNativePending = isDark;
    if (themeNativeHold > 0) return;
    queueThemeFlush();
  }

  function nativeAppearance() {
    try {
      var bridge = window.XinJianBridge;
      if (bridge && typeof bridge.appearance === 'function') {
        var fields = bridge.appearance().split('|');
        return { api: Number(fields[0]), dark: fields[1] === '1', scale: Number(fields[2]) };
      }
    } catch (e) {}
    return null;
  }

  var firstAppearance = nativeAppearance();
  var manualAppearance = firstAppearance
    ? firstAppearance.api < 29
    : /Android [1-9](?:[.; )]|$)/.test(navigator.userAgent);
  var colorPreference = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  var appearanceTarget;
  var appearanceTransition;
  var appearanceNeedsSaving = false;
  var appearanceOverride = null;
  try {
    var savedAppearance = localStorage.getItem('xj:appearance');
    if (savedAppearance === 'dark' || savedAppearance === 'light') appearanceOverride = savedAppearance === 'dark';
  } catch (e) {}

  function selectAppearance(isDark) {
    appearanceOverride = appearanceTarget = !!isDark;
    appearanceNeedsSaving = true;
    if (appearanceTransition) appearanceTransition.skipTransition();
    applyTheme(appearanceOverride);
  }

  function refreshAppearance(animate) {
    var prefs = nativeAppearance();
    var root = document.documentElement;
    if (prefs && prefs.scale >= .5 && prefs.scale <= 3) root.style.setProperty('--ui-scale', prefs.scale);
    var dark = appearanceOverride;
    if (dark === null) {
      if (manualAppearance) {
        dark = false;
        try { dark = localStorage.getItem('xj:dark') === '1'; } catch (e) {}
      } else {
        dark = prefs ? prefs.dark : !!(colorPreference && colorPreference.matches);
      }
    }
    if (dark === appearanceTarget) return;
    appearanceTarget = dark;
    if (appearanceTransition) appearanceTransition.skipTransition();
    if (!animate || !Anim.enabled() || !document.startViewTransition || !root.animate) {
      applyTheme(dark);
      return;
    }
    var radius = Math.hypot(innerWidth, innerHeight) / 2;
    var transition = document.startViewTransition(function () {
      if (appearanceTarget === dark) applyTheme(dark);
    });
    appearanceTransition = transition;
    transition.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at 50% 50%)', 'circle(' + radius + 'px at 50% 50%)'] },
        { duration: 320, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    transition.finished.then(function () {
      if (appearanceTransition === transition) appearanceTransition = null;
    });
  }

  refreshAppearance(false);
  window.__xjAppearanceChanged = function () { refreshAppearance(true); };
  if (colorPreference) {
    if (colorPreference.addEventListener) colorPreference.addEventListener('change', window.__xjAppearanceChanged);
    else if (colorPreference.addListener) colorPreference.addListener(window.__xjAppearanceChanged);
  }


  /* ================= 系统栏占位 =================
     状态栏已经改成透明（原生 setDecorFitsSystemWindows(false) + 状态栏色 TRANSPARENT），
     内容会一直顶到状态栏下面，所以必须自己把这块高度让出来。

     为什么不用 CSS 的 env(safe-area-inset-top) 就完事：
     WebView 只有在拿到窗口 insets 时才会给出这个值，不同 ROM 表现不一致，
     给不到就是 0 —— 那顶栏就会被状态栏压住。所以这里优先问原生要像素值，
     CSS 里 --safe-t 仍然以 env() 兜底（浏览器演示模式走这条）。 */
  function applyInsets() {
    var t = 0, b = 0, insets = null;
    try {
      if (window.Bridge && typeof Bridge.insets === 'function') {
        var raw = Bridge.insets();
        insets = raw ? JSON.parse(raw) : null;
        if (insets) { t = insets.top | 0; b = insets.bottom | 0; }
      }
    } catch (e) {}
    var root = document.documentElement;
    var ratio = window.devicePixelRatio || 1;
    // 原生上报物理像素，WebView 布局使用 CSS 像素。
    if (insets && Number.isFinite(insets.top)) {
      root.style.setProperty('--safe-t', Math.max(0, Math.ceil(t / ratio)) + 'px');
    }
    // 旧 Android 的可见区域可能把键盘也算作底部系统栏。
    if (insets && Number.isFinite(insets.bottom) && !editorKeyboardVisible && b / ratio < 80) {
      root.style.setProperty('--safe-b', Math.max(0, Math.ceil(b / ratio)) + 'px');
    }
    return { top: t, bottom: b };
  }

  var editorNativeVisibleHeight = 0, editorKeyboardVisible = false;
  function applyEditorViewport() {
    var root = document.documentElement;
    var layoutHeight = root.clientHeight || window.innerHeight;
    var viewport = window.visualViewport;
    var visualTop = viewport ? Math.max(0, viewport.offsetTop) : 0;
    var visibleHeight = viewport ? viewport.height : layoutHeight;
    if (editorKeyboardVisible) {
      var scale = viewport ? viewport.scale || 1 : 1;
      var nativeHeight = editorNativeVisibleHeight / ((window.devicePixelRatio || 1) * scale);
      visibleHeight = Math.min(visibleHeight, nativeHeight);
    }
    // 以键盘上沿定位。布局已经随键盘缩小时，底部补偿自然为零。
    var bottom = visualTop + visibleHeight;
    var overlap = Math.ceil(Math.max(0, layoutHeight - bottom));
    var imeVisible = editorKeyboardVisible || overlap > 0;
    if (imeVisible) root.style.setProperty('--editor-ime-bottom', Math.floor(bottom) + 'px');
    else root.style.removeProperty('--editor-ime-bottom');
    // WebView 为了露出光标可能平移可见视口，顶栏也要对齐它的上沿。
    root.style.setProperty('--editor-ime-top', (imeVisible ? Math.floor(visualTop) : 0) + 'px');
    root.style.setProperty('--editor-ime-offset', overlap + 'px');
    root.classList.toggle('editor-ime-visible', imeVisible);
  }

  window.__xjKeyboardViewport = function (visibleHeight, visible) {
    editorNativeVisibleHeight = Math.max(0, Number(visibleHeight) || 0);
    editorKeyboardVisible = visible === true;
    if (!editorKeyboardVisible) applyInsets();
    applyEditorViewport();
  };

  /* ================= 返回键 / 层级栈 =================
     二级页面和弹窗都不是真正的页面跳转，原生返回键必须先问 Web
     「你还有没有东西要关」。

     早期做法是每开一层就往 history 里 pushState，返回键靠 popstate 收。
     问题：Activity 被系统重建（改字体、开发者选项「不保留活动」、低内存回收）后，
     WebView 恢复了 history，但 JS 里的 layers 数组是空的 —— 按返回键毫无反应，
     要一直按到历史耗尽才会退出，而且 ignore 计数还会错位。

     现在：不再碰 history。原生同步调 window.__xjBack()，由 JS 自己判断能不能退一层。
     好处是重建后状态自洽（新页面 layers 空 → 直接 pass → 退出），也没有异步回响要吞。 */
  var Back = (function () {
    var layers = [];

    function closeTop() {
      var it = layers.pop();
      if (it && it.onBack) { try { it.onBack(); } catch (e) {} }
      return true;
    }

    return {
      count: function () { return layers.length; },

      /* onBack = 系统返回键到来时如何关掉这一层 */
      open: function (onBack) {
        var it = { onBack: onBack };
        layers.push(it);
        return it;
      },

      /* 界面自己关掉了，把它从栈里摘掉就行 */
      done: function (it) {
        var i = layers.indexOf(it);
        if (i >= 0) layers.splice(i, 1);
      },

      closeTop: closeTop
    };
  })();


  /* 原生返回键唯一入口：'handled' = Web 自己退了一层，'pass' = 可以退出 App */
  window.__xjBack = function () {
    if (Back.count() > 0) { Back.closeTop(); return 'handled'; }
    if (Nav.stack.length > 1) { Nav.back(true); return 'handled'; }
    return 'pass';
  };


  /* ================= 路由 ================= */
  var Nav = {
    stack: [{ name: 'home', params: {}, layer: null }],
    go: function (name, params) {
      var entry = { name: name, params: params || {}, layer: null };
      this.stack.push(entry);
      if (!this.motion) this.motion = 'push';
      this.render();
      // 压一层历史，返回键就能逐级退回
      var onBack = function () {
        // 视图自己先拦一道（比如编辑器在编辑态要先存盘）
        var view = $app.firstChild;
        if (view && typeof view.__onBack === 'function' && view.__onBack() === true) {
          // 页面没真正退，这一下只是关了内层，把层级补回来
          entry.layer = Back.open(onBack);
          return;
        }
        Nav.back(true);
      };
      entry.layer = Back.open(onBack);
    },
    /* silent=true 由系统返回键触发（历史已经弹过了，不再动历史） */
    back: function (silent) {
      if (this.stack.length <= 1) return false;
      var entry = this.stack.pop();
      this.motion = 'pop';
      this.render();
      if (!silent && entry.layer) Back.done(entry.layer);
      return true;
    },
    /* 一级页之间切换：不压栈，栈深永远是 2（home + 当前 tab） */
    tab: function (name) {
      var top = this.stack[this.stack.length - 1];
      if (top && top.name === name) return;
      this.motion = 'tab';
      if (name === 'home') { this.reset('home'); return; }
      while (this.stack.length > 1) {
        var e = this.stack.pop();
        if (e.layer) Back.done(e.layer);
      }
      this.go(name);
    },
    reset: function (name, params) {
      while (this.stack.length > 1) {
        var e = this.stack.pop();
        if (e.layer) Back.done(e.layer);
      }
      this.stack = [{ name: name, params: params || {}, layer: null }];
      this.render();
    },
    render: function () {
      if (this.finishTransition) this.finishTransition();
      var cur = this.stack[this.stack.length - 1];
      var old = $app.firstElementChild;
      if (old && old.__cleanup) old.__cleanup();
      var motion = this.motion;
      this.motion = '';
      var el = document.createElement('div');
      el.className = 'view' + (cur.name === 'home' ? '' : ' full');
      VIEWS[cur.name](el, cur.params);
      el.classList.toggle('has-tabs', BottomNav.includes(cur.name));
      var topbar = el.querySelector('.topbar');
      var scrolling = el.querySelector('.scroll, .editor-wrap textarea, .chat-list');
      if (topbar) {
        Array.prototype.forEach.call(topbar.querySelectorAll('[data-act="back"],[data-act="leave"]'), function (button) {
          button.setAttribute('aria-label', '返回');
        });
        if (scrolling) {
          scrolling.addEventListener('scroll', function () {
            topbar.classList.toggle('is-scrolled', scrolling.scrollTop > 8);
          }, { passive: true });
        }
      }
      $app.insertBefore(el, old);
      BottomNav.update(cur.name === 'editor' ? 'shelf' : cur.name);
      if (!old) return;
      if (motion && Anim.swap) this.finishTransition = Anim.swap(old, el, motion);
      else old.remove();
    }
  };


  var VIEWS = {};

  window.Nav = Nav;