/* 信笺 · 主页 */
'use strict';

VIEWS.home = function (el) {
  el.classList.add('home-view');
  var cards = [
    ['shelf', 'bookshelf', '书架', '管理你的代码与工程'],
    ['town', 'town', '小镇', '交流讨论、分享项目与灵感'],
    ['yard', 'leaf', '后院', '实用工具、运行环境与拓展'],
    ['inn', 'inn', '小宿店', '主题、插件、模板与资源']
  ];
  el.innerHTML =
    '<header class="workspace-heading"><div><h1>信笺</h1><p>写代码、聊天与探索的空间</p></div>' +
    '<div class="workspace-actions">' + ThemeReveal.buttonHtml(true) +
    '<button type="button" class="icon-btn" data-act="notices" aria-label="好友申请">' + svg('bell') + '</button></div></header>' +
    '<div class="scroll entries">' + cards.map(function (card) {
      return '<button type="button" class="entry" data-go="' + card[0] + '" aria-label="' + card[2] + '">' +
        '<span class="entry-main">' + svg(card[1]) + '<span><strong>' + card[2] + '</strong><small>' + card[3] +
        '</small></span></span><span class="entry-arrow">' + svg('chevron-right') + '</span></button>';
    }).join('') + '</div>';

  var theme = ThemeReveal.attach(el.querySelector('[data-theme-btn]'));
  el.__cleanup = function () { if (theme) theme.destroy(); };
  el.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.act === 'notices') return Nav.go('requests');
    var name = button.dataset.go;
    if (name) Nav.openCard(name, button);
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
