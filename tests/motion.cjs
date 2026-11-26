'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async function ({ test, app, settle }) {
  const css = fs.readFileSync(path.join(__dirname, '..', 'modified/assets/www/style.css'), 'utf8');

  await test('Motion tokens are the only durations and curves used in the stylesheet', async () => {
    assert.match(css, /--m-1:90ms/);
    assert.match(css, /--m-2:140ms/);
    assert.match(css, /--m-3:200ms/);
    assert.match(css, /--m-4:260ms/);
    assert.match(css, /--e-out:cubic-bezier\(\.22,\.88,\.24,1\)/);
    assert.match(css, /--e-inout:cubic-bezier\(\.45,\.05,\.35,1\)/);
    assert.match(css, /--e-hold:cubic-bezier\(\.34,1\.18,\.64,1\)/);
    /* 声明里不许再出现裸时长：注释里的历史数字不算 */
    const declarations = css.split('\n').filter(line => {
      const t = line.trim();
      return !t.startsWith('/*') && !t.startsWith('*') && !t.includes('/*');
    });
    const raw = declarations.filter(line => /transition|animation/.test(line) &&
      /(?:\d*\.?\d+)(?:ms|s)\b/.test(line) && !/var\(--m-/.test(line) && !/animation-delay/.test(line));
    assert.deepEqual(raw, [], 'raw durations found: ' + raw.join(' | '));
    const curves = declarations.filter(line => /transition|animation/.test(line) &&
      /\bease\b|cubic-bezier\((?!\.22,\.88|\.45,\.05|\.34,1\.18)/.test(line) && !/var\(--e-/.test(line));
    assert.deepEqual(curves, [], 'raw curves found: ' + curves.join(' | '));
  });

  await test('Turning motion off flips the global anim-off class and stays after re-enable', async () => {
    const a = app();
    try {
      const w = a.w;
      assert.equal(w.document.documentElement.classList.contains('anim-off'), true, 'harness boots with motion off');
      w.Anim.setEnabled(true);
      assert.equal(w.document.documentElement.classList.contains('anim-off'), false);
      assert.equal(w.Anim.enabled(), true);
      w.Anim.setEnabled(false);
      assert.equal(w.document.documentElement.classList.contains('anim-off'), true);
    } finally { a.close(); }
  });

  await test('The signature Lottie plays only when motion is on and never piles up', async () => {
    const a = app();
    try {
      const w = a.w;
      /* 运行时在 jsdom 里被跳过，这里补一个最小桩，验证的是「调用与不叠加」 */
      w.lottie = { loadAnimation: () => ({ addEventListener: () => {} }) };
      /* 关着动效：不插任何节点 */
      assert.equal(w.Anim.enabled(), false);
      assert.equal(w.Motion.verify(), false);
      assert.equal(w.document.querySelector('.verify-burst'), null);
      /* 打开：插一层遮罩，重复调用不会叠第二层 */
      w.Anim.setEnabled(true);
      assert.equal(w.Motion.verify(), true);
      assert.ok(w.document.querySelector('.verify-burst'));
      assert.equal(w.Motion.verify(), true);
      assert.equal(w.document.querySelectorAll('.verify-burst').length, 1);
    } finally { a.close(); }
  });

  await test('Closing a sheet plays the leave animation before the node goes away', async () => {
    const a = app();
    try {
      const w = a.w;
      w.Anim.setEnabled(true);
      w.sheet('标题', [{ label: '确定', value: true }]);
      await settle(w);
      const mask = w.document.querySelector('.mask');
      assert.ok(mask);
      w.document.querySelector('.sheet-item').click();
      assert.ok(mask.classList.contains('m-leave'), 'leave class applied');
      mask.querySelector('.sheet').dispatchEvent(new w.Event('animationend'));
      assert.equal(mask.isConnected, false, 'node removed after the leave animation');
    } finally { a.close(); }
  });

  await test('Deleting a contact collapses the row before removing it', async () => {
    const a = app(false, { deviceId: () => 'xj-a1b2c3d4e5f6', start: () => true, stop() {}, send: () => true });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      w.Anim.setEnabled(true);
      w.Pigeon.openLan('xj-b1c2d3e4f5a6', 'Peer');
      w.Pigeon.addFriend('xj-b1c2d3e4f5a6', 'Peer');
      w.Nav.reset('contacts');
      await settle(w);
      const row = find('.ct-row');
      assert.ok(row);
      row.querySelector('[data-do="delete"]').click();
      await settle(w);
      find('.sheet-item[data-i="0"]').click();
      await settle(w);
      assert.ok(row.classList.contains('leaving'), 'row collapses first');
      assert.equal(w.Pigeon.friend('xj-b1c2d3e4f5a6') !== null, true, 'still present during the animation');
      await new Promise(done => setTimeout(done, 520));
      assert.equal(w.Pigeon.friend('xj-b1c2d3e4f5a6'), null, 'removed after the collapse');
    } finally { a.close(); }
  });

  await test('Tab switches use a crossfade while nested screens use push and pop', async () => {
    const a = app();
    try {
      const w = a.w;
      const calls = [];
      w.Anim.setEnabled(true);
      const real = w.Anim.swap;
      w.Anim.swap = (oldEl, newEl, dir) => { calls.push(dir); return real(oldEl, newEl, dir); };
      w.Nav.reset('home');
      await settle(w);
      w.document.querySelector('[data-tab=me]').click();
      await settle(w);
      assert.deepEqual(calls, ['tab']);
      w.document.querySelector('[data-tab=home]').click();
      await settle(w);
      assert.deepEqual(calls, ['tab', 'tab']);
      w.Nav.go('settings');
      await settle(w);
      w.Nav.back();
      assert.deepEqual(calls, ['tab', 'tab', 'push', 'pop']);
    } finally { a.close(); }
  });
};
