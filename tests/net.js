/* 鸽屋 · 局域网 回归测试

   原生那半边（UDP 广播 / TCP socket / MulticastLock）jsdom 测不到，只能真机。
   这里用「假的原生桥 + 假的 __xjNet 事件」验证 JS 这半边的全部行为：

   1. 身份：鸽子窝号来自原生 deviceId()
   2. 发现：peer 事件 → 附近的人里出现
   3. 加好友：必须手动点，不自动建会话；建完会话绑定 peer
   4. 发送：netSend 收到正确的 (peerId, mid, text)
   5. 回执：ack 到达才算送达，之前是「发送中…」
   6. 接收：陌生人的消息不进当前会话（0.4 起改为转成验证请求，见 verify.js）
   7. 去重：同一 mid 重复到达只入一条
   8. 掉线：offline 事件 → 列表小圆点变灰、会话提示「不在线」
   9. 失败：netSend 返回 ok:false → 标「未送达」

   反证方法（写下来供复核）：把 chat.js 的 mySink 去掉 `ev.id !== pid` 判断，
   「陌生人不入库」会红；去掉 hasMid 判断，「重复不重复入库」会红。 */

const fs = require('fs');
const { JSDOM } = require('jsdom');
const dir = '/sdcard/信笺/app/';
const rd = f => fs.readFileSync(dir + f, 'utf8');
let html = rd('index.html');
html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + rd('style.css') + '</style>');
html = html.replace('<script src="bridge.js"></script>', () => '<scr' + 'ipt>' + rd('bridge.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="highlight.js"></script>', () => '<scr' + 'ipt>' + rd('highlight.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="md.js"></script>', () => '<scr' + 'ipt>' + rd('md.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="anim.js"></script>', () => '<scr' + 'ipt>' + rd('anim.js') + '<' + '/scr' + 'ipt>');
for (const f of ['net.js', 'navindicator.js', 'spotlight.js', 'themereveal.js', 'app.js', 'data.js', 'views/home.js', 'views/shelf.js', 'views/create.js', 'views/editor.js', 'views/me.js', 'views/chat.js', 'boot.js']) html = html.replace('<script src="' + f + '"></script>', () => '<scr' + 'ipt>' + rd(f) + '<' + '/scr' + 'ipt>');

const SELF = 'xj-aaaaaaaaaaaa';
const PEER = 'xj-bbbbbbbbbbbb';
const STRANGER = 'xj-cccccccccccc';

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) {
    w.__calls = [];
    w.__sendResult = { ok: true };
    w.XinJianBridge = {
      list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
      remove: () => 'true', rename: () => 'true', exists: () => 'true',
      export: () => 'true', rootPath: () => '/fake',
      deviceId: () => SELF,
      netStart: function (nick) {
        w.__calls.push(['start', nick]);
        return JSON.stringify({ ok: true, id: SELF, port: 45790 });
      },
      netStop: function () { w.__calls.push(['stop']); },
      netPeers: () => '[]',
      netSend: function (pid, mid, text) {
        w.__calls.push(['send', pid, mid, text]);
        return JSON.stringify(w.__sendResult);
      }
    };
  }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
const appText = () => (d.getElementById('app') || {}).textContent || '';
const toastText = () => (q('.toast') || {}).textContent || '';
const store = () => {
  try { return JSON.parse(w.localStorage.getItem('xj:pigeon:v1') || '{}'); } catch (e) { return {}; }
};
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
const fire = ev => w.__xjNet(JSON.stringify(ev));

(async () => {
  /* ---------- 1. 身份 ---------- */
  ok('Net 可用（原生桥有 netStart）', w.Net.available() === true);
  ok('鸽子窝号来自原生 deviceId', w.Net.id() === SELF);

  /* ---------- 2. 进鸽屋会启动监听 ---------- */
  w.Nav.go('pigeon');
  await wait(150);
  ok('进鸽屋调用了 netStart', w.__calls.some(c => c[0] === 'start'));

  /* ---------- 3. 发现 ---------- */
  ok('一开始附近没人', w.Net.list().length === 0);
  fire({ t: 'peer', id: PEER, nick: '小镇邮差', online: true });
  await wait(50);
  ok('peer 事件后能看到对方', w.Net.list().length === 1);
  ok('对方在线', w.Net.online(PEER) === true);

  /* 一台从没加过的设备，不能自己变成会话 */
  ok('发现不等于加好友（还没有会话）', qa('.pg-item').length === 1);

  /* ---------- 4. 添加好友 ---------- */
  q('[data-act=new]').click();
  await wait(120);
  q('.pop-item[data-i="1"]').click();      /* 添加朋友 */
  await wait(150);
  const near = qa('.pop-item').find(n => n.textContent.indexOf('小镇邮差') >= 0);
  ok('「附近的人」里列出了对方', !!near);
  ok('附近的人带鸽子窝号', !!near && near.textContent.indexOf(PEER) >= 0);

  near.click();
  await wait(200);
  ok('点添加后进了会话页', !!q('#chatIpt'));
  ok('会话页标题是对方昵称', (q('.t-title') || {}).textContent === '小镇邮差');

  const db1 = store();
  const sid = Object.keys(db1.sessions || {}).find(k => db1.sessions[k].peer === PEER);
  ok('会话里绑定了对方鸽子窝号', !!sid);
  ok('会话提示显示在线', /在线/.test(appText()));

  /* ---------- 5. 发送 ---------- */
  const before = w.__calls.length;
  q('#chatIpt').value = '你好';
  q('[data-act=send]').click();
  await wait(150);

  const sent = w.__calls.slice(before).find(c => c[0] === 'send');
  ok('发送调用了 netSend', !!sent);
  ok('发给正确的设备', !!sent && sent[1] === PEER);
  ok('带上了配对的 mid', !!sent && typeof sent[2] === 'string' && sent[2].length > 4);
  ok('正文正确', !!sent && sent[3] === '你好');
  ok('气泡出来了', !!q('.msg.out .bubble'));
  ok('回执没到之前是「发送中」', /发送中/.test(appText()));

  const mid = sent[2];

  /* ---------- 6. 回执 ---------- */
  fire({ t: 'ack', mid: mid });
  await wait(100);
  ok('ack 之后不再是「发送中」', !/发送中/.test(appText()));
  ok('ack 之后也不标未送达', !/未送达/.test(appText()));

  /* ---------- 7. 接收 ---------- */
  const n1 = qa('.msg').length;
  fire({ t: 'msg', id: PEER, mid: 'p-mid-1', text: '收到，你呢', ts: Date.now() });
  await wait(100);
  ok('收到对方消息，多了一条', qa('.msg').length === n1 + 1);
  const inBubble = qa('.msg.in .bubble').pop();
  ok('收到的是对方气泡', !!inBubble && inBubble.textContent.indexOf('收到，你呢') >= 0);

  /* ---------- 8. 去重 ---------- */
  const n2 = qa('.msg').length;
  fire({ t: 'msg', id: PEER, mid: 'p-mid-1', text: '收到，你呢', ts: Date.now() });
  await wait(80);
  ok('同一 mid 重复到达不会重复入库', qa('.msg').length === n2);

  /* ---------- 9. 陌生人消息不进当前会话（并转成验证请求） ---------- */
  fire({ t: 'msg', id: STRANGER, mid: 'x-mid-1', text: '加个好友呗', ts: Date.now() });
  await wait(80);
  ok('陌生人消息不进当前会话', qa('.msg').length === n2);
  ok('陌生人消息没进正文', !/加个好友呗/.test(appText()));

  /* ---------- 10. 掉线 ---------- */
  fire({ t: 'offline', id: PEER });
  await wait(80);
  ok('掉线后会话提示不在线', /不在线/.test(appText()));

  w.Nav.go('pigeon');
  await wait(150);
  const dot = q('.pg-dot');
  ok('列表里有在线状态点', !!dot);
  ok('掉线后点不带 on', !!dot && !dot.classList.contains('on'));

  fire({ t: 'peer', id: PEER, nick: '小镇邮差', online: true });
  await wait(80);
  const dot2 = q('.pg-dot');
  ok('重新上线后点变亮', !!dot2 && dot2.classList.contains('on'));

  /* ---------- 11. 发送失败 ---------- */
  w.Nav.go('chat', { sid: sid });
  await wait(150);
  w.__sendResult = { ok: false, why: 'offline' };
  q('#chatIpt').value = '这条发不出去';
  q('[data-act=send]').click();
  await wait(150);
  ok('发送失败标「未送达」', /未送达/.test(appText()));

  /* ---------- 12. 重复添加同一台设备 ---------- */
  w.Nav.go('pigeon');
  await wait(150);
  const cnt = qa('.pg-item').length;
  q('[data-act=new]').click();
  await wait(120);
  q('.pop-item[data-i="1"]').click();
  await wait(150);
  const near2 = qa('.pop-item').find(n => n.textContent.indexOf('小镇邮差') >= 0);
  ok('已加过的设备不再出现在附近的人里', !near2);
  w.Nav.back(false);
  await wait(120);

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });