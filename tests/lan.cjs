'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app, settle }) {
  await test('LAN chat starts on request, sends with receipt, and deduplicates received text', async () => {
    const own = 'xj-a1b2c3d4e5f6', peer = 'xj-b1c2d3e4f5a6';
    const sent = [];
    let started = 0;
    const a = app(false, {
      deviceId: () => own,
      start: () => { started++; return true; },
      stop() {},
      send: (id, mid, text) => { sent.push({ id, mid, text }); return true; }
    });
    try {
      const w = a.w;
      const find = selector => w.document.querySelector(selector);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      assert.equal(started, 0);
      emit({ t: 'peer', id: peer });
      assert.equal(find('[data-peer]'), null);
      find('[data-act="lan-toggle"]').click();
      assert.equal(started, 1);
      emit({ t: 'peer', id: own, nick: 'self' });
      emit({ t: 'peer', id: peer, nick: '<b>Peer</b>' });
      const near = find('[data-peer]');
      assert.equal(near.dataset.peer, peer);
      assert(near.textContent.includes('<b>Peer</b>'));
      assert.equal(near.querySelector('b'), null);
      near.click();
      await settle(w);
      const input = find('#chatIpt');
      input.value = 'Hello';
      input.dispatchEvent(new w.Event('input', { bubbles: true }));
      find('#sendBtn').click();
      assert.equal(sent.length, 1);
      assert.equal(sent[0].id, peer);
      assert.equal(sent[0].text, 'Hello');
      const outgoing = sent[0].mid;
      assert.match(find('.msg-st').textContent, /发送中/);
      emit({ t: 'delivery', id: 'xj-555555555555', mid: outgoing, ok: true });
      assert.match(find('.msg-st').textContent, /发送中/);
      emit({ t: 'delivery', id: peer, mid: outgoing, ok: true });
      assert.equal(find('.msg-st').textContent, '已送达');
      const incoming = { t: 'msg', id: peer, mid: 'remote-1', text: '<b>Hi</b>' };
      emit(incoming);
      emit(incoming);
      assert.equal(w.document.querySelectorAll('.msg.in').length, 1);
      assert.equal(find('.msg.in .bubble').textContent, '<b>Hi</b>');
      assert.equal(find('.msg.in b'), null);
      emit({ t: 'offline', id: peer });
      assert.match(find('#chatTip').textContent, /离线/);
      emit({ t: 'state', on: false });
      emit({ ...incoming, mid: 'ignored' });
      assert.equal(w.Pigeon.get('lan-' + peer).msgs.length, 2);
    } finally { a.close(); }
  });

  await test('Local conversations retain the media panel without the native LAN bridge', async () => {
    const a = app();
    try {
      const w = a.w;
      const s = w.Pigeon.create('Local');
      w.Nav.reset('pigeon');
      await settle(w);
      assert.equal(w.document.querySelector('.lan-panel').hidden, true);
      w.document.querySelector('[data-sid="' + s.id + '"]').click();
      await settle(w);
      assert.equal(w.document.querySelector('#sendBtn').textContent, '+');
      w.document.querySelector('#sendBtn').click();
      assert.equal(w.document.querySelector('#chatPanel').hidden, false);
      assert.equal(w.document.querySelectorAll('[data-chat]').length, 4);
    } finally { a.close(); }
  });
};
