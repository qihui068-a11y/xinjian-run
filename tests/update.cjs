'use strict';
const assert = require('node:assert/strict');

module.exports = async ({ test, app }) => {
  await test('App checks for a release on startup once, with no automatic download', () => {
    const calls = [];
    let start;
    const a = app(true, null, w => {
      const setTimeout = w.setTimeout;
      w.setTimeout = (fn, delay) => {
        if (delay === 800) { start = fn; return; }
        return setTimeout(fn, delay);
      };
      w.XinJianUpdate = {
        info: () => JSON.stringify({ state: 'idle', current: '0.7.2-run' }),
        check: () => calls.push('check'), download: () => calls.push('download')
      };
    });
    try {
      assert.equal(typeof start, 'function');
      start();
      const { w } = a;
      const emit = state => w.__xjUpdate(JSON.stringify({ state, current: '0.7.2-run', latest: '0.7.3-run' }));
      emit('checking');
      emit('available');
      w.document.dispatchEvent(new w.Event('visibilitychange'));
      assert.deepEqual(calls, ['check']);
      assert.match(w.document.querySelector('.toast').textContent, /发现信笺 0\.7\.3-run/);
    } finally { a.close(); }
  });

  await test('Update settings show current version, check status, progress, retry and system installer handoff', () => {
    const calls = [];
    const a = app(true, null, w => {
      w.XinJianUpdate = {
        info: () => JSON.stringify({ state: 'idle', current: '0.7.2-run', percent: 0 }),
        check: () => calls.push('check'), download: () => calls.push('download'), install: () => calls.push('install')
      };
    });
    try {
      const { w } = a;
      const select = selector => w.document.querySelector(selector);
      const emit = (state, percent = 0, message = '') => w.__xjUpdate(JSON.stringify({
        state, current: '0.7.2-run', latest: '0.7.3-run', percent, message
      }));
      w.Nav.reset('settings');
      select('[data-act=update]').click();
      assert.equal(select('[data-update-current]').textContent, '0.7.2-run');
      const check = select('[data-act=check]');
      const apply = select('[data-act=apply]');
      assert.equal(apply.hidden, true);
      check.click();
      emit('checking');
      assert.equal(check.disabled, true);
      emit('checkError', 0, '更新服务暂不可用');
      assert.match(select('[data-update-status]').textContent, /暂不可用/);
      check.click();
      emit('current');
      assert.equal(select('[data-update-status]').textContent, '已是最新版本');
      assert.equal(apply.hidden, true);
      check.click();
      emit('available');
      assert.equal(apply.textContent, '下载更新');
      apply.click();
      emit('downloading', 45);
      assert.equal(check.disabled, true);
      assert.equal(select('progress').value, 45);
      assert.equal(select('progress').hidden, false);
      assert.equal(apply.hidden, true);
      emit('downloadError', 0, '安装包校验失败，请重试');
      assert.equal(apply.textContent, '重新下载');
      apply.click();
      emit('ready', 100);
      assert.equal(select('progress').hidden, true);
      assert.equal(apply.textContent, '安装更新');
      assert.deepEqual(calls, ['check', 'check', 'check', 'download', 'download']);
      apply.click();
      emit('ready', 100, '允许信笺安装应用后，返回这里再点一次安装');
      assert.equal(calls.at(-1), 'install');
      assert.match(select('[data-update-status]').textContent, /允许信笺安装应用/);
      select('[data-act=back]').click();
      emit('available');
      assert.equal(select('[data-update-status]'), null);
    } finally { a.close(); }
  });

  await test('Browser demo displays update settings without device-only actions', () => {
    const a = app();
    try {
      a.w.Nav.go('update');
      assert.match(a.w.document.querySelector('[data-update-status]').textContent, /Android/);
      assert.equal(a.w.document.querySelector('[data-act=check]').hidden, true);
      assert.equal(a.w.document.querySelector('[data-act=apply]').hidden, true);
    } finally { a.close(); }
  });
};
