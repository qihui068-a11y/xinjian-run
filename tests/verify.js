/* 鸽屋 · 好友验证 / 会话设置 / 通知策略 回归测试（0.4）
   这一轮修的是「a 加了 b，发给 b 消息，b 必须回加 a 才收得到」。
   根因有两层，都要有测试盯着：
     一层：会话页把陌生人的消息直接丢了（views/chat.js 里那句 ev.id !== pid）
     二层：Net 只在鸽屋/会话页启动，人不在那两页时 socket 都没开
   所以这里除了验证新功能，还专门测「停在主页也能收到消息」。

   测不到的部分（写清楚，别假装测了）：
   - 真实的 UDP/TCP 收发、两台机器之间能不能通 → 只能真机
   - 系统通知真实弹出来、点通知真的跳页 → 只能真机（jsdom 里只能验证「调了 notify」）
   - Android 13 通知权限被拒后的降级观感 → 只能真机

   反证方法（供复核，都是「拆掉防御应该变红」）：
   1. 把 data.js 里 PigeonInbox 的 addRequest 分支注释掉 → 「生成验证请求」会红
   2. 把 VIEWS.pigeon 里 requests 那段删掉 → 「列表出现验证条」会红
   3. 把 chat.js 的 !s.id 分支（回复即同意）删掉 → 「回复后建成了会话」会红
   4. 把 PigeonInbox 里 !s.mute 判断去掉 → 「免打扰不弹通知」会红
   5. 把 hasMid 判断去掉 → 「同一mid重复到达只入一条」会红
   6. 把 Pigeon.title 改成 return s.name → 「会话顶栏用备注」会红 */

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
    w.__notes = [];           /* 记录 notify(title, body) */
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
        return JSON.stringify(w.__sendResult || { ok: true });
      },
      notify: function (t, b) { w.__notes.push([t, b]); }
    };
  }
});

const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
const appText = () => (d.getElementById('app') || {}).textContent || '';
const fire = o => w.__xjNet(JSON.stringify(o));
const P = w.Pigeon;
const Nav = w.Nav;
const title = () => (q('.t-title') || {}).textContent;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
const byAct = act => qa('.row').find(r => r.dataset.act === act);

(async () => {
  /* ---------- 1. 默认值与启动 ---------- */
  ok('后台常驻默认开着', w.PgSet.resident() === true);
  ok('一进 App 就开了监听', w.__calls.some(c => c[0] === 'start'));

  /* ---------- 2. 陌生人发消息 → 验证请求 ---------- */
  fire({ t: 'msg', id: STRANGER, nick: '小王', mid: 'm1', text: '你好，我是隔壁的', ts: Date.now() });
  await wait(60);
  let rq = P.requests();
  ok('陌生人消息生成验证请求', rq.length === 1 && rq[0].peer === STRANGER);
  ok('请求里记下了正文', rq[0] && rq[0].text === '你好，我是隔壁的');
  ok('陌生人没有自动建成会话', P.byPeer(STRANGER) === null);
  ok('弹了「验证消息」通知', w.__notes.some(n => n[0] === '验证消息'));
  ok('通知里带对方昵称', w.__notes.some(n => n[0] === '验证消息' && /小王/.test(n[1])));

  /* ---------- 3. 同一个人再来消息：累加，不新建 ---------- */
  fire({ t: 'msg', id: STRANGER, nick: '小王', mid: 'm2', text: '在吗', ts: Date.now() });
  await wait(60);
  rq = P.requests();
  ok('同一个人不新建请求', rq.length === 1);
  ok('条数累加到 2', rq[0] && rq[0].n === 2);
  ok('未读数累加到 2', rq[0] && rq[0].unread === 2);

  /* ---------- 4. 鸽屋列表里的验证条 ---------- */
  Nav.go('pigeon');
  await wait(150);
  ok('列表出现验证条', !!q('.pg-req'));
  ok('验证条显示昵称', /小王/.test(appText()));
  ok('验证条带未读徽标', !!q('.pg-badge'));
  ok('验证条写着「请求加你为好友」', /请求加你为好友/.test(appText()));

  /* ---------- 5. 点验证条 → 待验证会话 ---------- */
  q('.pg-req').click();
  await wait(180);
  ok('进入待验证会话', title() === '小王');
  ok('待验证态显示对方最后一句', /在吗/.test(appText()));
  ok('待验证态写了「回复一句话就表示同意」', /回复一句话/.test(appText()));
  ok('打开后未读清零', P.requests()[0] && P.requests()[0].unread === 0);

  q('[data-act=cset]').click();
  await wait(120);
  ok('待验证态点三条杠不跳设置页', title() === '小王');

  /* ---------- 6. 回一句话 = 同意 ---------- */
  const ipt = q('#chatIpt');
  ipt.value = '好呀';
  q('[data-act=send]').click();
  await wait(150);
  const s = P.byPeer(STRANGER);
  ok('回复后建成了会话', !!s);
  ok('第一条是对方发来的', !!(s && s.msgs[0] && s.msgs[0].dir === 'in' && /在吗/.test(s.msgs[0].text)));
  ok('第二条是我的回复', !!(s && s.msgs[1] && s.msgs[1].dir === 'out' && s.msgs[1].text === '好呀'));
  ok('验证请求已删除', P.requests().length === 0);
  ok('回复真的发出去了', w.__calls.some(c => c[0] === 'send' && c[1] === STRANGER && c[3] === '好呀'));
  ok('顶栏用的是对方昵称', title() === '小王');

  /* ---------- 7. ack 回执 ---------- */
  const sends = w.__calls.filter(c => c[0] === 'send');
  const lastMid = sends[sends.length - 1][2];
  fire({ t: 'ack', mid: lastMid });
  await wait(100);
  ok('回执把消息标成已送达', P.get(s.id).msgs[1].st === 'ok');
  ok('已送达后不再显示「发送中」', !/发送中/.test(appText()));

  /* ---------- 8. 三条杠 → 会话设置 ---------- */
  q('[data-act=cset]').click();
  await wait(150);
  ok('进会话设置页', title() === '会话设置');
  const t8 = appText();
  ok('有备注', /备注/.test(t8));
  ok('有消息免打扰', /消息免打扰/.test(t8));
  ok('有切换蓝牙通讯（占位）', /切换蓝牙通讯/.test(t8));
  ok('有 p2p 通讯（占位）', /p2p通讯/.test(t8));
  ok('有终结通讯（原「删除好友」改名）', /终结通讯/.test(t8));

  /* ---------- 9. 备注 ---------- */
  byAct('note').click();
  await wait(150);
  ok('备注弹窗打开', !!q('.mask #_ipt'));
  q('.mask #_ipt').value = '隔壁老王';
  q('.mask [data-act=ok]').click();
  await wait(180);
  ok('备注存进去了', P.get(s.id).note === '隔壁老王');
  ok('备注有长度上限', P.setNote(s.id, '一二三四五六七八九十一二三四五六七八九十多余').note.length === 20);
  P.setNote(s.id, '隔壁老王');

  /* ---------- 10. 免打扰：通知压，消息不压 ---------- */
  const notesBefore = w.__notes.length;
  byAct('mute').click();
  await wait(120);
  ok('免打扰打开了', P.get(s.id).mute === true);
  ok('免打扰行显示已开启', /已开启/.test(appText()));

  Nav.back(false);
  await wait(150);
  ok('备注已生效到会话顶栏', title() === '隔壁老王');

  Nav.back(false);
  await wait(150);
  fire({ t: 'msg', id: STRANGER, nick: '小王', mid: 'm3', text: '免打扰测试', ts: Date.now() });
  await wait(100);
  ok('免打扰不弹通知', w.__notes.length === notesBefore);
  ok('免打扰不吞消息', P.get(s.id).msgs.some(m => m.text === '免打扰测试'));

  /* ---------- 11. 不在会话页也能收到（这是这轮 bug 的核心） ---------- */
  Nav.reset('home');
  await wait(150);
  const nBefore = P.get(s.id).msgs.length;
  fire({ t: 'msg', id: STRANGER, nick: '小王', mid: 'm4', text: '在主页时发的', ts: Date.now() });
  await wait(100);
  ok('人停在主页也能收到消息', P.get(s.id).msgs.length === nBefore + 1);
  ok('收到的那条内容对', P.get(s.id).msgs[P.get(s.id).msgs.length - 1].text === '在主页时发的');

  /* ---------- 12. 去重 ---------- */
  const n2 = P.get(s.id).msgs.length;
  fire({ t: 'msg', id: STRANGER, nick: '小王', mid: 'm4', text: '在主页时发的', ts: Date.now() });
  await wait(80);
  ok('同一 mid 重复到达只入一条', P.get(s.id).msgs.length === n2);

  /* ---------- 13. 终结通讯（删除会话） ---------- */
  Nav.go('pigeon');
  await wait(150);
  const item = qa('.pg-item').find(e => e.dataset.sid === s.id);
  ok('列表里能找到这个会话', !!item);
  item.click();
  await wait(180);
  q('[data-act=cset]').click();
  await wait(150);
  byAct('del').click();
  await wait(150);
  ok('删除前有确认框', !!q('.mask .sheet-item'));
  q('.mask .sheet-item').click();          /* 第一项就是「删除」 */
  await wait(220);
  ok('会话已删除', P.get(s.id) === null);
  ok('删完回到鸽屋列表', title() === '鸽屋');
  ok('列表里不再有这个会话', !qa('.pg-item').some(e => e.dataset.sid === s.id));

  /* ---------- 14. 删除后对方再发消息 → 重新变回验证请求 ---------- */
  const notes3 = w.__notes.length;
  fire({ t: 'msg', id: STRANGER, nick: '小王', mid: 'm5', text: '我还在', ts: Date.now() });
  await wait(120);
  ok('删掉好友后再来信变成验证请求', P.requests().length === 1);
  ok('并且又弹了验证通知', w.__notes.length === notes3 + 1);

  /* ---------- 15. a 侧：主动加好友后只能发一条，等对方回复 ---------- */
  /* 这里用 Pigeon.create(name, peer, true) 造出「我主动加」的会话，
     等价于在鸽屋里点「附近的人 → 添加」。 */
  Nav.reset('pigeon');
  await wait(150);
  const inv = P.create('小张', PEER, true);
  ok('主动加的会话带 invite 标记', !!P.get(inv.id).invite);
  Nav.go('chat', { sid: inv.id });
  await wait(180);
  ok('刚加时输入框还没锁', !q('[data-act=send].off'));
  ok('刚加时提示还是正常的', !/等对方回复/.test(appText()));

  q('#chatIpt').value = '加个好友';
  q('[data-act=send]').click();
  await wait(180);
  ok('第一条验证消息发出去了', P.get(inv.id).msgs.length === 1);
  ok('发出后按钮变灰', !!q('[data-act=send].off'));
  ok('发出后提示「等对方回复」', /验证消息已发出，等对方回复/.test(appText()));
  ok('输入框占位改成等回复', (q('#chatIpt') || {}).placeholder === '等对方回复后才能继续发');

  q('#chatIpt').value = '我再说一句';
  q('[data-act=send]').click();
  await wait(180);
  ok('对方没回之前发不出第二条', P.get(inv.id).msgs.length === 1);
  ok('输入框里的字没被清掉', q('#chatIpt').value === '我再说一句');

  /* 用回车也不行（send() 里那道拦截） */
  const ev = new w.KeyboardEvent('keydown', { key: 'Enter' });
  q('#chatIpt').dispatchEvent(ev);
  await wait(150);
  ok('回车也发不出去', P.get(inv.id).msgs.length === 1);

  /* 对方回复 → 自动解锁 */
  fire({ t: 'msg', id: PEER, nick: '小张', mid: 'p1', text: '好啊，加吧', ts: Date.now() });
  await wait(180);
  ok('对方回复后 invite 解除', !P.get(inv.id).invite);
  ok('对方那条进档', P.get(inv.id).msgs.some(m => m.text === '好啊，加吧'));
  ok('解锁后按钮不再变灰', !q('[data-act=send].off'));
  q('#chatIpt').value = '那就聊吧';
  q('[data-act=send]').click();
  await wait(180);
  ok('解锁后能正常发第二条', P.get(inv.id).msgs.filter(m => m.text === '那就聊吧').length === 1);

  /* ---------- 16. 第一条没送达 → 允许重试（否则永久锁死） ---------- */
  const inv2 = P.create('小李', 'xj-dddddddddddd', true);
  Nav.go('chat', { sid: inv2.id });
  await wait(180);
  w.__sendResult = { ok: false, why: 'offline' };
  q('#chatIpt').value = '第一次没送到';
  q('[data-act=send]').click();
  await wait(180);
  ok('发送失败的标记成未送达', P.get(inv2.id).msgs[0].st === 'fail');
  ok('没送达时按钮不锁', !q('[data-act=send].off'));
  w.__sendResult = { ok: true };
  q('#chatIpt').value = '再试一次';
  q('[data-act=send]').click();
  await wait(180);
  ok('没送达可以重发', P.get(inv2.id).msgs.length === 2);
  ok('重发成功后锁住', !!q('[data-act=send].off'));

  console.log('结果: ' + pass + ' 通过 ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();