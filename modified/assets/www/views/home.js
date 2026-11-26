/* 信笺 · 视图：主页（4 个功能入口 + 天气占位） */
'use strict';



  VIEWS.home = function (el) {
    el.classList.add('home-view');
    var w = WEATHER_STUB;

    function entry(action, icon, title) {
      return '<button type="button" class="entry" data-go="' + action + '">' +
        '<span class="entry-main">' + svg(icon) + '<span>' + title + '</span></span>' +
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
      '<span class="theme-slot">' + ThemeReveal.buttonHtml(true) + '</span>' +
      '</div>' +
      '<div class="scroll entries">' +
      entry('shelf', 'book', '书架') +
      entry('town', 'town', '小镇') +
      entry('yard', 'server', '后院') +
      entry('inn', 'shop', '小宿店') +
      '</div>' +
      tabbar('home');

    var themeBtn = ThemeReveal.attach(el.querySelector('[data-theme-btn]'));
    el.__cleanup = function () { if (themeBtn) themeBtn.destroy(); };

    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) return Nav.tab(t.dataset.tab);
      var g = e.target.closest('[data-go]');
      if (g) {
        var name = g.dataset.go;
        if (name === 'shelf') return Nav.go('shelf');
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