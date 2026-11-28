'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app, settle }) {
  await test('Shared popovers preserve actions and return to their trigger', async () => {
    const a = app();
    try {
      const { w } = a;
      const select = selector => w.document.querySelector(selector);
      const labels = () => [...w.document.querySelectorAll('.pop-item')].map(button => button.textContent);

      w.Nav.reset('pigeon');
      const more = select('[data-act=more]');
      more.click();
      assert.deepEqual(labels(), ['通讯录', '局域网使用说明']);
      assert.equal(more.getAttribute('aria-expanded'), 'true');
      more.click();
      assert.equal(select('.pop'), null);
      assert.equal(w.document.activeElement, more);
      assert.equal(more.getAttribute('aria-expanded'), 'false');
      select('[data-act=new]').click();
      assert.deepEqual(labels(), ['发起群聊', '添加朋友', '扫一扫', '收付款']);
      assert.equal(w.__xjBack(), 'handled');
      assert.equal(w.Nav.stack.at(-1).name, 'pigeon');
      assert.equal(select('.pop'), null);

      w.Nav.reset('shelf');
      select('[data-act=more]').click();
      assert.deepEqual(labels(), ['阅读', '新建文件', '导入文件', '排序']);
      select('.pop-item[data-i="3"]').click();
      await settle(w);
      assert.equal(select('.pop'), null);
      assert.equal(select('.sheet-title').textContent, '排序');
      w.__xjBack();

      await w.Bridge.create('menu.js', 'const value = 1;');
      w.Nav.reset('editor', { name: 'menu.js', mode: 'read' });
      await settle(w);
      select('[data-act=menu]').click();
      assert.deepEqual(labels(), ['跳转到行首', '跳转到行尾', '分享 / 导出', '发布（未接入）']);
      assert.match(select('.pop-caption').textContent, /UTF-8/);
      select('.pop-item').click();
      await settle(w);
      assert.equal(select('#ta').readOnly, false);
      assert.equal(select('.pop'), null);
    } finally {
      a.close();
    }
  });
};
