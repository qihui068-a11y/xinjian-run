/* 信笺 · 视图：主页（4 个功能入口 + 天气占位） */
'use strict';



  VIEWS.home = function (el) {
    el.classList.add('home-view');
    var w = WEATHER_STUB;

    function label(icon, title, classes) {
      return '<span class="entry-main' + classes + '">' + svg(icon) + '<span>' + title + '</span></span>';
    }

    function entry(action, icon, title, alternate) {
      var contents = label(icon, title, alternate ? ' entry-light' : '');
      if (alternate) contents += label(alternate.icon, alternate.title, ' entry-dark');
      return '<button type="button" class="entry" data-go="' + action + '"' +
        (alternate ? ' data-dark-go="' + alternate.action + '"' : '') + '>' + contents +
        '<span class="entry-arrow" aria-hidden="true">' + svg('chevron') + '</span></button>';
    }

    el.innerHTML =
      '<div class="weather-bar">' +
      '<span class="w-info" data-act="weather">' +
      '<span class="w-city">' + esc(w.city) + '</span>' +
      '<span class="w-main">' + esc(w.temp) + '°</span>' +
      '<span class="w-desc">' + esc(w.desc) + '</span>' +
      '<span class="w-aqi">' + esc(w.aqi) + '</span>' +
      '</span>' +
      '<span class="theme-slot">' + ThemeReveal.buttonHtml() + '</span>' +
      '</div>' +
      '<div class="scroll entries">' +
      entry('shelf', 'book', '书架') +
      entry('town', 'town', '小镇') +
      entry('home', 'home', '主页', { action: 'yard', icon: 'server', title: '后院' }) +
      entry('create', 'plus', '新建', { action: 'inn', icon: 'shop', title: '小宿店' }) +
      '</div>' +
      tabbar('home');

    var themeBtn = ThemeReveal.attach(el.querySelector('[data-theme-btn]'));
    el.__cleanup = function () { if (themeBtn) themeBtn.destroy(); };

    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) return Nav.tab(t.dataset.tab);
      var g = e.target.closest('[data-go]');
      if (g) {
        var dark = document.documentElement.classList.contains('dark');
        var name = (dark && g.dataset.darkGo) || g.dataset.go;
        if (name === 'shelf') return Nav.go('shelf');
        if (name === 'create') return Nav.tab('create');
        if (name === 'home') {
          el.querySelector('.entries').scrollTop = 0;
          return;
        }
        return Nav.go('stub', { title: { town: '小镇', yard: '后院', inn: '小宿店' }[name] });
      }
      if (e.target.closest('[data-act=weather]')) {
        toast('天气模块将在第二阶段接入');
      }
    });
  };


  VIEWS.stub = function (el, p) {
    var text = p.text || ((p.title || '') + '正在开发中，先等等吧~');
    el.innerHTML =
      '<div class="topbar">' +
      '<button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">' + esc(p.title || '') + '</div>' +
      '<div class="t-gap"></div></div>' +
      '<div class="empty"><p>' + esc(text) + '</p></div>';
    el.querySelector('[data-act=back]').onclick = function () { Nav.back(); };
  };