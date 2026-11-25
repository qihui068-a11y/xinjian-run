/* 信笺 · 视图：主页（4 个功能入口 + 天气占位） */
'use strict';



  VIEWS.home = function (el) {
    var w = WEATHER_STUB;
    /* 天气条右边划出一块给主题按钮：左边 .w-info 仍然整块可点（点开天气提示），
       右边 .theme-slot 是一条竖线隔开的按钮位，不会再触发天气的 toast。 */
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
      '<div class="entries">' +
      '<button class="entry" data-go="shelf">' + svg('book') + '<span>书架</span></button>' +
      '<button class="entry" data-go="town">' + svg('town') + '<span>小镇</span></button>' +
      '<button class="entry" data-go="yard">' + svg('server') + '<span>后院</span></button>' +
      '<button class="entry" data-go="inn">' + svg('shop') + '<span>小宿店</span></button>' +
      '</div>' +
      tabbar('home');

    var themeBtn = ThemeReveal.attach(el.querySelector('[data-theme-btn]'));
    el.__cleanup = function () {
      if (themeBtn) themeBtn.destroy();
      themeBtn = null;
    };

    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (t) {
        var k = t.dataset.tab;
        if (k === 'home') return;
        return Nav.go(k);
      }
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