'use strict';
const assert = require('node:assert/strict');

/* 书架「阅读」入口：快捷栏第三位 → 底部选书弹窗（卡片行 + 开始/继续阅读）→ 点选进阅读器 */
module.exports = async function ({ test, app, settle }) {
  await test('Shelf read shortcut lists only TXT/EPUB books and opens the reader', async () => {
    const a = app();
    try {
      const { w } = a;
      const doc = w.document;
      const select = selector => doc.querySelector(selector);
      const all = selector => [...doc.querySelectorAll(selector)];

      await w.Bridge.create('故事.txt', '第一章 开始\n第二章 归途\n');
      await w.Bridge.create('笔记.md', '# 只是笔记\n');
      await w.Bridge.create('漫画.epub', 'PK\u0003\u0004占位');
      /* 42% + 固定时间戳：让「故事.txt」稳定排在第一位 */
      w.Books.save('故事.txt', { percent: 42, openedAt: 1700000000000, index: 1 });

      w.Nav.reset('shelf');
      await settle(w);

      const shortcuts = all('.workspace-shortcuts button');
      assert.deepEqual(shortcuts.map(b => b.dataset.act), ['create', 'import', 'read'], '阅读是快捷栏第三位');
      assert.equal(shortcuts[2].querySelector('strong').textContent, '阅读');
      assert.equal(shortcuts[2].querySelector('small').textContent, '打开阅读器');

      shortcuts[2].click();
      await settle(w);

      assert.equal(select('#readSheetTitle').textContent, '选择阅读文件');
      assert.ok(select('.read-sheet .workspace-sheet-close'), '右上角有关闭按钮');
      assert.equal(select('.read-sheet .sheet-grab') !== null, true, '可下拉关闭');

      const books = all('.read-book');
      assert.deepEqual(books.map(b => b.dataset.book), ['故事.txt', '漫画.epub'], '只列出书架里的 TXT 和 EPUB');
      assert.equal(books[0].querySelector('strong').textContent, '故事.txt');
      assert.match(books[0].querySelector('small').textContent, /^TXT · /, '格式和体积写在第二行');
      assert.match(books[1].querySelector('small').textContent, /^EPUB · /);
      assert.equal(books[0].querySelector('.read-book-go').textContent.replace(/\s/g, ''), '继续阅读',
        '读过的书显示继续阅读');
      assert.equal(books[1].querySelector('.read-book-go').textContent.replace(/\s/g, ''), '开始阅读',
        '没读过的书显示开始阅读');
      assert.ok(books[0].querySelector('.read-book-glyph') && books[1].querySelector('.read-book-glyph'),
        '每行左侧有格式图标');

      books[0].click();
      await settle(w);
      const top = w.Nav.stack.at(-1);
      assert.equal(top.name, 'reader');
      assert.equal(top.params.name, '故事.txt');
      assert.equal(select('.sheet'), null, '选完书弹窗要关掉');
    } finally {
      a.close();
    }
  });

  await test('Shelf read shortcut explains an empty shelf instead of opening a blank sheet', async () => {
    const a = app();
    try {
      const { w } = a;
      const select = selector => w.document.querySelector(selector);
      await w.Bridge.create('只有笔记.md', '# 没有书\n');
      w.Nav.reset('shelf');
      await settle(w);
      select('[data-act=read]').click();
      await settle(w);
      assert.equal(select('.sheet'), null, '没有书时不弹空弹窗');
      const toast = w.document.querySelector('.toast');
      assert.ok(toast && /TXT 或 EPUB/.test(toast.textContent), '给出空态提示');
    } finally {
      a.close();
    }
  });
};
