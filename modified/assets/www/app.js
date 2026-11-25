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
    back: '<path d="M15 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pencil: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L4.6 17.4z"/><path d="M14.5 5.5l3 3"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    book: '<path d="M3 5h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H3z"/><path d="M21 5h-6a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h6z"/>',
    town: '<circle cx="9" cy="8" r="3"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M18 19a5.5 5.5 0 0 0-2-4"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    shop: '<path d="M4 9h16l-1-4H5z"/><path d="M5 9v10h14V9"/><path d="M10 19v-5h4v5"/>',
    home: '<path d="M4 10l8-6 8 6v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>',
    me: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    sort: '<path d="M7 4v16M4 17l3 3 3-3"/><path d="M14 7h6M14 12h4M14 17h2"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    bird: '<path d="M21 4l-9 8-3-1-5 3 1-5 4-2h4z"/><path d="M12 12l1 8"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M4.6 7.6l1.9 1.1M17.5 15.3l1.9 1.1M4.6 16.4l1.9-1.1M17.5 8.7l1.9-1.1"/>',
    download: '<path d="M12 3v11M8 10l4 4 4-4"/><path d="M5 19h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8h.01"/>',
    cup: '<path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 9h2a2 2 0 0 1 0 4h-2"/><path d="M6 21h10"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 19a6 6 0 0 1 12 0"/><path d="M16 5.3a3.2 3.2 0 0 1 0 5.4"/><path d="M18 19a5.5 5.5 0 0 0-2-4.3"/>',
    userPlus: '<circle cx="10" cy="8" r="3.2"/><path d="M4 19a6 6 0 0 1 12 0"/><path d="M19 7v6M16 10h6"/>',
    scan: '<path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M4 12h16"/>',
    pay: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/><path d="M7 14.5h3"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M4 17l5-5 3.5 3.5L15 13l5 5"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><circle cx="12" cy="13" r="3.2"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    folder: '<path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>'
  };

  function svg(n) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (SVG[n] || '') + '</svg>';
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


  /* items: [{label, value, danger}] | 'sep' | {title:'…'} */
  function sheet(title, items) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'mask';
      var html = '<div class="sheet">';
      if (title) html += '<div class="sheet-title">' + esc(title) + '</div>';
      items.forEach(function (it, idx) {
        if (it === 'sep') { html += '<div class="sheet-sep"></div>'; return; }
        if (it.title) { html += '<div class="sheet-title">' + esc(it.title) + '</div>'; return; }
        html += '<button type="button" class="sheet-item" data-i="' + idx + '"' +
          (it.danger ? ' style="opacity:.75"' : '') + '>' + esc(it.label) + '</button>';
      });
      html += '</div>';
      mask.innerHTML = html;
      document.body.appendChild(mask);
      var first = mask.querySelector('button');
      if (first) first.focus();

      var layer = null, settled = false;

      /* 用户点选/点遮罩关闭：要同时把历史条目退掉 */
      function close(v) {
        if (settled) return;
        settled = true;
        mask.remove();
        if (layer) Back.done(layer);
        resolve(v);
      }
      /* 系统返回键关闭：历史已经退过了，这里只收拾界面 */
      layer = Back.open(function () {
        if (settled) return;
        settled = true;
        mask.remove();
        resolve(null);
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
    ]).then(function (v) { return v === true; });
  }


  function inputBox(title, value, placeholder, keepWhitespace) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'mask';
      mask.innerHTML =
        '<div class="sheet">' +
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
        mask.remove();
        if (layer) Back.done(layer);
        resolve(v);
      }
      layer = Back.open(function () {
        if (settled) return;
        settled = true;
        mask.remove();
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
        mask.remove();
        if (layer) Back.done(layer);
        resolve(v);
      }
      /* 系统返回键：先关菜单，不许退出这一页 */
      layer = Back.open(function () {
        if (settled) return;
        settled = true;
        mask.remove();
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
    var v = themeNativePending;
    if (v === null || v === themeApplied) return;
    themeApplied = v;
    try { localStorage.setItem('xj:dark', v ? '1' : '0'); } catch (e) {}
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
    root.classList.toggle('dark', isDark);
    root.style.backgroundColor = isDark ? '#1E1E1E' : '#FFFFFF';
    /* 这里只改 DOM（快照要拍的就是它）；落盘和通知推到 flushThemeNow。 */
    themeNativePending = isDark;
    if (themeNativeHold > 0) return;
    queueThemeFlush();
  }

  var darkPref = false;

  try { darkPref = localStorage.getItem('xj:dark') === '1'; } catch (e) {}

  applyTheme(darkPref);


  /* ================= 系统栏占位 =================
     状态栏已经改成透明（原生 setDecorFitsSystemWindows(false) + 状态栏色 TRANSPARENT），
     内容会一直顶到状态栏下面，所以必须自己把这块高度让出来。

     为什么不用 CSS 的 env(safe-area-inset-top) 就完事：
     WebView 只有在拿到窗口 insets 时才会给出这个值，不同 ROM 表现不一致，
     给不到就是 0 —— 那顶栏就会被状态栏压住。所以这里优先问原生要像素值，
     CSS 里 --safe-t 仍然以 env() 兜底（浏览器演示模式走这条）。 */
  function applyInsets() {
    var t = 0, b = 0;
    try {
      if (window.Bridge && typeof Bridge.insets === 'function') {
        var raw = Bridge.insets();
        var o = raw ? JSON.parse(raw) : null;
        if (o) { t = o.top | 0; b = o.bottom | 0; }
      }
    } catch (e) {}
    var root = document.documentElement;
    if (t > 0) root.style.setProperty('--safe-t', t + 'px');
    if (b > 0) root.style.setProperty('--safe-b', b + 'px');
    return { top: t, bottom: b };
  }


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
      this.render();
      if (!silent && entry.layer) Back.done(entry.layer);
      return true;
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
      var cur = this.stack[this.stack.length - 1];
      if ($app.firstChild && $app.firstChild.__cleanup) $app.firstChild.__cleanup();
      $app.innerHTML = '';
      var el = document.createElement('div');
      el.className = 'view' + (cur.name === 'home' ? '' : ' full');
      $app.appendChild(el);
      VIEWS[cur.name](el, cur.params);
    }
  };


  /* ================= 视图：主页 ================= */
  var WEATHER_STUB = { city: '定位中', temp: '--', desc: '待接入', aqi: '' };


  function tabbar(active) {
    return '<div class="tabbar">' +
      '<button class="tab ' + (active === 'home' ? 'active' : '') + '" data-tab="home">' +
      svg('home') + '<span>主页</span></button>' +
      '<button class="tab" data-tab="create">' + svg('plus') + '<span>新建</span></button>' +
      '<button class="tab ' + (active === 'me' ? 'active' : '') + '" data-tab="me">' +
      svg('me') + '<span>小家</span></button>' +
      '</div>';
  }


  var VIEWS = {};

  window.Nav = Nav;
