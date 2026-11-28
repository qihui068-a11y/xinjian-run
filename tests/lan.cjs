'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app, settle }) {
  const OWN = 'xj-a1b2c3d4e5f6', PEER = 'xj-b1c2d3e4f5a6';

  function bridge(sent) {
    return {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: (id, mid, text) => { sent.push({ id, mid, text }); return true; }
    };
  }

  await test('LAN chat starts from the bottom bar, sends with receipt, and deduplicates received text', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      assert.ok(find('[data-act="lan-toggle"]'), 'bottom bar should carry the LAN toggle');
      assert.ok(find('[data-act="contacts"]'), 'bottom bar should carry the contact book');
      assert.equal(find('.radar-sheet'), null, 'discovery is not displayed inline');
      emit({ t: 'peer', id: PEER });
      assert.equal(w.Pigeon.get('lan-' + PEER), null, 'a peer announcement alone must not create a session');
      assert.equal(find('.radar-sheet'), null, 'LAN events do not open the radar');
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: OWN, nick: 'self' });
      emit({ t: 'peer', id: PEER, nick: '<b>Peer</b>' });
      find('#pgNearby').click();
      const scanRow = find('.radar-peer');
      assert.equal(scanRow.dataset.peer, PEER);
      assert.equal(scanRow.querySelector('small').textContent, 'b1c2d3e4', 'only the first 8 of the fingerprint');
      assert(scanRow.textContent.includes('<b>Peer</b>'));
      assert.equal(scanRow.querySelector('b'), null);
      scanRow.click();
      await settle(w);
      w.Pigeon.addFriend(PEER, 'Peer');
      const input = find('#chatIpt');
      input.value = 'Hello';
      input.dispatchEvent(new w.Event('input', { bubbles: true }));
      find('#sendBtn').click();
      assert.equal(sent.length, 1);
      assert.equal(sent[0].id, PEER);
      assert.equal(sent[0].text, 'Hello');
      const outgoing = sent[0].mid;
      const message = () => w.Pigeon.get('lan-' + PEER).msgs[0];
      assert.equal(message().delivery, 'pending');
      assert.equal(find('.msg-st'), null);
      emit({ t: 'delivery', id: 'xj-555555555555', mid: outgoing, ok: true });
      assert.equal(message().delivery, 'pending', 'another device cannot acknowledge the message');
      emit({ t: 'delivery', id: PEER, mid: outgoing, ok: false });
      assert.equal(message().delivery, 'failed');
      find('[data-retry]').click();
      assert.equal(sent.length, 2);
      assert.equal(sent[1].mid, outgoing, 'retry must reuse the original message id');
      assert.equal(w.Pigeon.get('lan-' + PEER).msgs.length, 1);
      emit({ t: 'delivery', id: PEER, mid: outgoing, ok: true });
      assert.equal(message().delivery, 'delivered');
      assert.equal(find('.msg-st'), null);
      const incoming = { t: 'msg', id: PEER, mid: 'remote-1', text: '<b>Hi</b>' };
      emit(incoming);
      emit(incoming);
      assert.equal(w.document.querySelectorAll('.msg.in').length, 1);
      assert.equal(find('.msg.in .bubble').textContent, '<b>Hi</b>');
      assert.equal(find('.msg.in b'), null);
      emit({ t: 'offline', id: PEER });
      assert.match(find('#chatTip').textContent, /离线/);
      emit({ t: 'state', on: false });
      emit({ ...incoming, mid: 'ignored' });
      assert.equal(w.Pigeon.get('lan-' + PEER).msgs.length, 2);
    } finally { a.close(); }
  });

  await test('Local conversations keep the media panel when no native LAN bridge exists', async () => {
    const a = app();
    try {
      const w = a.w;
      const s = w.Pigeon.create('Local');
      w.Nav.reset('pigeon');
      await settle(w);
      assert.equal(w.Lan.available, false);
      w.document.querySelector('[data-sid="' + s.id + '"]').click();
      await settle(w);
      assert.equal(w.document.querySelector('#sendBtn').textContent, '+');
      w.document.querySelector('#sendBtn').click();
      assert.equal(w.document.querySelector('#chatPanel').hidden, false);
      assert.equal(w.document.querySelectorAll('[data-chat]').length, 4);
    } finally { a.close(); }
  });

  await test('Contact book lists contacts with swipe actions, blocking and deleting', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.patchFriend(PEER, { alias: '老王' });
      w.Nav.reset('contacts');
      await settle(w);
      const row = find('.ct-row');
      assert.equal(row.dataset.peer, PEER);
      assert.match(row.textContent, /老王/);
      assert.equal(row.querySelectorAll('[data-do]').length, 3);
      row.querySelector('[data-do="block"]').click();
      await settle(w);
      assert.equal(w.Pigeon.friend(PEER).blocked, true);
      find('.ct-row [data-do="delete"]').click();
      await settle(w);
      const confirm = find('.sheet-item[data-i="0"]');
      assert.ok(confirm, 'delete should ask for confirmation');
      confirm.click();
      await settle(w);
      assert.equal(w.Pigeon.friend(PEER), null);
      assert.equal(w.Pigeon.get('lan-' + PEER), null);
    } finally { a.close(); }
  });

  await test('A stranger message lands in the verification page and accepting creates the session', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'm1', text: '在吗' });
      await settle(w);
      const reqs = w.Pigeon.requests();
      assert.equal(reqs.length, 1);
      assert.equal(reqs[0].text, '在吗');
      assert.equal(w.Pigeon.get('lan-' + PEER), null, 'a stranger must not create a session yet');
      w.Nav.reset('contacts');
      await settle(w);
      assert.equal(find('.ct-badge').textContent, '1');
      find('[data-act="requests"]').click();
      await settle(w);
      assert.equal(w.document.querySelectorAll('.req-item').length, 1);
      find('[data-req="accept"]').click();
      await settle(w);
      assert.ok(w.Pigeon.friend(PEER), 'accepting should create the contact');
      const s = w.Pigeon.get('lan-' + PEER);
      assert.ok(s, 'accepting should create the session');
      assert.equal(s.msgs.length, 1);
      assert.equal(s.msgs[0].text, '在吗');
      assert.equal(w.Pigeon.requests().length, 0);
    } finally { a.close(); }
  });

  await test('A pending request allows exactly one message until the peer answers', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      find('#pgNearby').click();
      find('.radar-peer').click();
      await settle(w);
      const input = find('#chatIpt');
      input.value = '你好';
      input.dispatchEvent(new w.Event('input', { bubbles: true }));
      find('#sendBtn').click();
      assert.equal(sent.length, 1, 'first verification message should go out');
      const s = w.Pigeon.get('lan-' + PEER);
      assert.equal(s.msgs.length, 1);
      assert.equal(w.Pigeon.canSend(s.id).ok, false, 'second message must be locked');
      assert.equal(input.disabled, true, 'input should be locked while waiting');
      assert.match(find('#chatTip').textContent, /等对方回复/);
      input.value = '再一条';
      assert.equal(w.Pigeon.canSend(s.id).ok, false);
      assert.equal(sent.length, 1);
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'r1', text: '好呀' });
      await settle(w);
      assert.ok(w.Pigeon.friend(PEER), 'replying should confirm the contact');
      assert.equal(w.Pigeon.canSend(s.id).ok, true, 'send should unlock after reply');
      assert.equal(find('#chatIpt').disabled, false);
    } finally { a.close(); }
  });

  await test('An accept signal confirms the contact without landing in history', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.markWaiting(PEER);
      w.Nav.reset('chat', { sid: 'lan-' + PEER });
      await settle(w);
      assert.match(find('#chatTip').textContent, /等对方回复/);
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'accept-1', text: '\u0001已同意你的好友申请' });
      await settle(w);
      assert.ok(w.Pigeon.friend(PEER), 'accept signal should create the contact');
      assert.equal(w.Pigeon.get('lan-' + PEER).msgs.length, 0, 'control message must not land in history');
      assert.equal(find('#chatIpt').disabled, false);
    } finally { a.close(); }
  });

  await test('Accepting a request notifies the peer with the control message', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'm1', text: '在吗' });
      await settle(w);
      w.Nav.reset('requests');
      await settle(w);
      find('[data-req="accept"]').click();
      await settle(w);
      assert.equal(sent.length, 1, 'accept should signal the peer');
      assert.equal(sent[0].text.charAt(0), '\u0001');
      assert.ok(w.Pigeon.friend(PEER));
    } finally { a.close(); }
  });

  await test('A terminate signal locks the chat and offers delete, backup or keep', async () => {
    const sent = [], exported = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.add(s.id, '旧消息', 'in');
      w.Pigeon.add(s.id, '', 'in', { kind: 'image', name: 'xj-b.jpg', mid: 'i9' });
      w.Bridge.exportOne = (name, text) => { exported.push({ name, text }); return Promise.resolve(true); };
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'bye-1', text: '\u0002已终止通讯' });
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).terminated, true);
      const sheetEl = find('.sheet');
      assert.ok(sheetEl, 'terminate should raise the three-way sheet');
      assert.match(sheetEl.textContent, /对方已终止通讯/);
      assert.match(sheetEl.textContent, /备份通讯后删除/);
      assert.match(sheetEl.textContent, /保留/);
      assert.equal(find('#chatIpt').disabled, true);
      sheetEl.querySelector('.sheet-item[data-i="1"]').click();
      await settle(w);
      assert.equal(exported.length, 1, 'backup should export the transcript');
      assert.match(exported[0].text, /旧消息/);
      /* 备份不能引用马上要被删掉的文件名 */
      assert.equal(/xj-b\.jpg/.test(exported[0].text), false, 'backup must not reference deleted media');
      assert.match(exported[0].text, /未包含在备份中/);
      assert.equal(w.Pigeon.friend(PEER), null);
    } finally { a.close(); }
  });

  await test('Image sharing compresses through canvas, sends once, and marks delivered', async () => {
    const sent = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: () => true,
      readMedia: () => 'A'.repeat(200000),
      sendImage: (id, mid, name, w, h, data) => { sent.push({ id, mid, name, w, h, len: data.length }); return true; }
    }, w => {
      w.Image = function () {
        const img = this;
        img.width = 3200;
        img.height = 1800;
        Object.defineProperty(img, 'src', { set() { setTimeout(() => img.onload && img.onload(), 0); } });
      };
      w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {} });
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,' + 'B'.repeat(500);
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      assert.equal(w.Lan.canSendImage(), true);
      assert.equal(w.Lan.shareImage(s, 'a.jpg'), true);
      await new Promise(done => setTimeout(done, 30));
      assert.equal(sent.length, 1, 'image should be sent once');
      assert.equal(sent[0].id, PEER);
      assert.equal(sent[0].w, 1600, 'long edge should shrink to 1600');
      assert.equal(sent[0].h, 900);
      const msg = w.Pigeon.get(s.id).msgs[0];
      assert.equal(msg.kind, 'image');
      assert.equal(msg.delivery, 'pending');
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      assert.equal(find('.msg-st'), null);
      emit({ t: 'delivery', id: PEER, mid: sent[0].mid, ok: true });
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).msgs[0].delivery, 'delivered');
      assert.equal(find('.msg-st'), null);
    } finally { a.close(); }
  });

  await test('Failed image shows a retry button that resends with the same message id', async () => {
    const sent = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: () => true,
      readMedia: () => 'A'.repeat(2000),
      sendImage: (id, mid, name, w, h, data) => { sent.push({ mid, name, len: data.length }); return true; }
    }, w => {
      w.Image = function () {
        const img = this;
        img.width = 800;
        img.height = 600;
        Object.defineProperty(img, 'src', { set() { setTimeout(() => img.onload && img.onload(), 0); } });
      };
      w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {} });
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,' + 'C'.repeat(400);
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.add(s.id, '', 'out', { kind: 'image', name: 'b.jpg', mid: 'fail-1', delivery: 'failed', w: 800, h: 600 });
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      assert.match(find('.msg-st button').getAttribute('aria-label'), /未送达/);
      const retry = find('[data-retry]');
      assert.ok(retry, 'failed image should offer a retry button');
      retry.click();
      await new Promise(done => setTimeout(done, 30));
      assert.equal(sent.length, 1, 'retry should resend');
      assert.equal(sent[0].mid, 'fail-1');
      assert.equal(w.Pigeon.get(s.id).msgs[0].delivery, 'pending');
    } finally { a.close(); }
  });

  await test('Session settings edit the note, toggle mute and terminate the contact', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      assert.ok(find('[data-act="chatMenu"]'), 'LAN chat should offer session menu');
      find('[data-act="chatMenu"]').click();
      await settle(w);
      const csetItem = Array.from(w.document.querySelectorAll('.pop-item'))
        .find(node => node.textContent.indexOf('会话设置') >= 0);
      assert.ok(csetItem, 'LAN chat should offer session settings');
      csetItem.click();
      await settle(w);
      assert.match(find('.t-title').textContent, /会话设置/);
      assert.equal(w.document.querySelectorAll('.row').length, 5);

      find('.row[data-act="note"]').click();
      await settle(w);
      const input = find('#_ipt');
      input.value = '老王';
      find('[data-act="ok"]').click();
      await settle(w);
      assert.equal(w.Pigeon.friend(PEER).alias, '老王');
      assert.match(find('.row[data-act="note"]').textContent, /老王/);

      find('.row[data-act="mute"]').click();
      await settle(w);
      assert.equal(w.Pigeon.friend(PEER).muted, true);

      find('.row[data-act="del"]').click();
      await settle(w);
      find('.sheet-item[data-i="0"]').click();
      await settle(w);
      assert.equal(w.Pigeon.friend(PEER), null);
      assert.equal(w.Pigeon.get(s.id), null);
      assert.ok(sent.some(m => m.text.charAt(0) === '\u0002'), 'terminate should tell the peer');
      assert.match(find('.t-title').textContent, /鸽屋/);
    } finally { a.close(); }
  });

  await test('Control signals need an exact match and a real friend', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.add(s.id, 'hi', 'in');
      /* 还不是好友：终止指令必须被丢弃 */
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'k1', text: '\u0002已终止通讯' });
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).terminated, undefined, 'stranger terminate must be ignored');
      /* 变成好友之后才认 */
      w.Pigeon.addFriend(PEER, 'Peer');
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'k2', text: '\u0002已终止通讯' });
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).terminated, true);
      /* 近似但不相等的文本不是控制信号 */
      const s2 = w.Pigeon.openLan('xj-b2c3d4e5f6a7', 'Other');
      w.Pigeon.addFriend('xj-b2c3d4e5f6a7', 'Other');
      emit({ t: 'msg', id: 'xj-b2c3d4e5f6a7', nick: 'Other', mid: 'k3', text: '\u0002' });
      await settle(w);
      assert.equal(w.Pigeon.get(s2.id).terminated, undefined, 'partial marker must not terminate');
      /* 不在等待状态时，同意信号不生效 */
      assert.equal(w.Pigeon.friend('xj-c3d4e5f6a7b8'), null);
      emit({ t: 'msg', id: 'xj-c3d4e5f6a7b8', nick: 'X', mid: 'k4', text: '\u0001已同意你的好友申请' });
      await settle(w);
      assert.equal(w.Pigeon.friend('xj-c3d4e5f6a7b8'), null, 'accept without an invite must be ignored');
    } finally { a.close(); }
  });

  await test('Blocked peer images are deleted from disk and never stored', async () => {
    const sent = [], deleted = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: () => true,
      deleteMedia: name => { deleted.push(name); return true; }
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.setBlocked(PEER, true);
      emit({ t: 'img', id: PEER, nick: 'Peer', mid: 'img-1', name: 'xj-img-1.jpg', w: 10, h: 10, size: 100 });
      await settle(w);
      assert.deepEqual(deleted, ['xj-img-1.jpg'], 'blocked image should be deleted');
      assert.equal(w.Pigeon.get('lan-' + PEER), null, 'blocked image must not create a session');
    } finally { a.close(); }
  });

  await test('Deleting a contact removes its image files too', async () => {
    const sent = [], deleted = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: (id, mid, text) => { sent.push(text); return true; },
      deleteMedia: name => { deleted.push(name); return true; }
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.add(s.id, '', 'in', { kind: 'image', name: 'xj-a.jpg', mid: 'i1' });
      w.Pigeon.add(s.id, '', 'out', { kind: 'image', name: 'xj-b.jpg', mid: 'i2' });
      w.Lan.dropContact(PEER);
      assert.deepEqual(deleted.sort(), ['xj-a.jpg', 'xj-b.jpg']);
      assert.equal(w.Pigeon.friend(PEER), null);
    } finally { a.close(); }
  });

  await test('Choosing keep stops the terminate sheet from coming back', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'bye', text: '\u0002已终止通讯' });
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      assert.ok(find('.sheet'), 'first entry should ask');
      find('.sheet .sheet-item[data-i="3"]').click();
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).termAck, true);
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      assert.equal(find('.sheet'), null, 'sheet must not come back');
      assert.match(find('#chatTip').textContent, /已终止通讯/);
    } finally { a.close(); }
  });

  await test('Image-only conversations show a placeholder summary and control chars are stripped', async () => {
    const sent = [];
    const a = app(false, bridge(sent));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.add(s.id, '', 'in', { kind: 'image', name: 'xj-a.jpg', mid: 'i1' });
      w.Nav.reset('pigeon');
      await settle(w);
      assert.match(find('.pg-last').textContent, /\[图片\]/);
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      const input = find('#chatIpt');
      input.value = '\u0002hi';
      input.dispatchEvent(new w.Event('input', { bubbles: true }));
      find('#sendBtn').click();
      assert.equal(sent.length, 1);
      assert.equal(sent[0].text, 'hi', 'leading control characters must be stripped');
    } finally { a.close(); }
  });

  await test('Deleting from the contact book removes image files even with LAN off', async () => {
    const deleted = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: () => true,
      deleteMedia: name => { deleted.push(name); return true; }
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.add(s.id, '', 'in', { kind: 'image', name: 'xj-a.jpg', mid: 'i1' });
      w.Nav.reset('contacts');
      await settle(w);
      find('.ct-row [data-do="delete"]').click();
      await settle(w);
      find('.sheet-item[data-i="0"]').click();
      await settle(w);
      assert.deepEqual(deleted, ['xj-a.jpg'], 'LAN off must still delete media');
      assert.equal(w.Pigeon.friend(PEER), null);
      assert.equal(w.Pigeon.get(s.id), null);
    } finally { a.close(); }
  });

  await test('Deleting from the terminate sheet removes image files too', async () => {
    const deleted = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: () => true,
      deleteMedia: name => { deleted.push(name); return true; }
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.add(s.id, '', 'in', { kind: 'image', name: 'xj-b.jpg', mid: 'i2' });
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'bye', text: '\u0002已终止通讯' });
      w.Nav.reset('chat', { sid: s.id });
      await settle(w);
      find('.sheet .sheet-item[data-i="0"]').click();
      await settle(w);
      assert.deepEqual(deleted, ['xj-b.jpg'], 'terminate delete must clean media');
      assert.equal(w.Pigeon.friend(PEER), null);
    } finally { a.close(); }
  });

  await test('A blocked friend cannot terminate the conversation', async () => {
    const a = app(false, bridge([]));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emit = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emit({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Pigeon.setBlocked(PEER, true);
      emit({ t: 'msg', id: PEER, nick: 'Peer', mid: 'k9', text: '\u0002已终止通讯' });
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).terminated, undefined, 'blocked peer must not terminate');
    } finally { a.close(); }
  });

  await test('Turning LAN off fails in-flight images instead of leaving them pending', async () => {
    const sent = [];
    const a = app(false, {
      deviceId: () => OWN,
      start: () => true,
      stop() {},
      send: () => true,
      readMedia: () => 'A'.repeat(2000),
      sendImage: (id, mid, name, w, h, data) => { sent.push(mid); return true; }
    }, w => {
      w.Image = function () {
        const img = this;
        img.width = 800;
        img.height = 600;
        Object.defineProperty(img, 'src', { set() { setTimeout(() => img.onload && img.onload(), 0); } });
      };
      w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {} });
      w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,' + 'D'.repeat(300);
    });
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      const emitEvent = event => w.__xjLan(JSON.stringify(event));
      w.Nav.reset('pigeon');
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      emitEvent({ t: 'peer', id: PEER, nick: 'Peer' });
      const s = w.Pigeon.openLan(PEER, 'Peer');
      w.Pigeon.addFriend(PEER, 'Peer');
      w.Lan.shareImage(s, 'a.jpg');
      await new Promise(done => setTimeout(done, 30));
      assert.equal(sent.length, 1);
      assert.equal(w.Pigeon.get(s.id).msgs[0].delivery, 'pending');
      emitEvent({ t: 'state', on: false });
      await settle(w);
      assert.equal(w.Pigeon.get(s.id).msgs[0].delivery, 'failed', 'in-flight image must be marked failed');
    } finally { a.close(); }
  });

  await test('First LAN toggle asks for confirmation and remembers the answer', async () => {
    const a = app(false, bridge([]));
    try {
      const w = a.w;
      const find = s => w.document.querySelector(s);
      w.localStorage.removeItem('xj:lan:warned');
      w.Nav.reset('pigeon');
      await settle(w);
      const hint = find('.pg-safe');
      assert.ok(hint, 'boundary hint should sit above the tab bar');
      assert.match(hint.textContent, /仅限可信网络/);
      find('[data-act="lan-toggle"]').click();
      await settle(w);
      assert.equal(w.Lan.running(), false, 'must not start before confirming');
      const sheetEl = find('.sheet');
      assert.ok(sheetEl, 'first enable should ask');
      assert.match(sheetEl.textContent, /可信局域网/);
      find('.sheet-item[data-i="0"]').click();
      await settle(w);
      assert.equal(w.Lan.running(), true);
      assert.equal(w.localStorage.getItem('xj:lan:warned'), '1');
      find('[data-act="lan-toggle"]').click();
      await settle(w);
      find('[data-act="lan-toggle"]').click();
      await settle(w);
      assert.equal(w.Lan.running(), true, 'second time must not ask again');
      assert.equal(find('.sheet'), null);
    } finally { a.close(); }
  });
};
