/* 存储位置 · 桥接层测试（0.4.3）
   原生判断「用 /sdcard/xinjian 还是私有目录」，Web 只负责显示和转发。
   这里测的是 Web 这一侧的四件事：
   1) 有原生时向原生要状态，没原生时给一个「演示」占位，不能崩；
   2) requestAllFiles 在两种环境下的返回；
   3) 原生推 __xjStorage 时能广播给所有注册者；
   4) 从私有切到公共（migrated=true）且正停在书架页时，书架要重画
      —— 否则用户看到的还是切换前那批稿子。
   ！原生那一半（权限判断、迁移文件）jsdom 测不到，只能真机验；这里不假装测到了。 */
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

/* 用一个带计数的假原生：能验证「有没有真的调用原生」 */
const native = {
  listCalls: 0,
  askCalls: 0,
  state: { mode: 'private', root: '/sdcard/Android/data/tt.xinjian.cn/files/xinjian', wanted: '/storage/emulated/0/xinjian', sdk: 34, canAsk: true, method: 'settings' },
  list: () => { native.listCalls++; return '[]'; },
  read: () => '',
  create: () => 'true', write: () => 'true', remove: () => 'true', rename: () => 'true',
  exists: () => 'true', export: () => 'true', rootPath: () => '/fake',
  storageState: () => JSON.stringify(native.state),
  requestAllFiles: () => { native.askCalls++; }
};
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) { w.XinJianBridge = native; }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
(async () => {
  await wait(200);
  const B = w.Bridge;
  ok('识别为原生环境', B.isNative === true);
  ok('原生注入了 __xjStorage 回调', typeof w.__xjStorage === 'function');
  ok('有原生桥时不挂演示模式横幅', !w.document.querySelector('.demo-bar'));

  /* ---------- 1. 向原生要状态 ---------- */
  const st = await B.storageState();
  ok('storageState 拿到对象', st && typeof st === 'object');
  ok('mode 是原生报的 private', st.mode === 'private');
  ok('root 是原生报的私有路径', /Android\/data/.test(st.root));
  ok('wanted 给出目标是 /xinjian', /\/xinjian$/.test(st.wanted));
  ok('method=settings 表示要走系统页', st.method === 'settings');

  /* ---------- 2. 没有原生时的降级 ---------- */
  const savedState = native.storageState;
  delete native.storageState;
  const demo = await B.storageState();
  ok('没有原生 storageState 时给 demo 占位', demo.mode === 'demo');
  ok('demo 下 canAsk 是 false（不骗界面）', demo.canAsk === false);
  native.storageState = savedState;

  /* ---------- 3. 申请所有文件访问 ---------- */
  ok('requestAllFiles 有原生时返回 true', B.requestAllFiles() === true);
  ok('确实调了原生一次', native.askCalls === 1);
  const savedAsk = native.requestAllFiles;
  delete native.requestAllFiles;
  ok('没有原生能力时返回 false', B.requestAllFiles() === false);
  native.requestAllFiles = savedAsk;

  /* ---------- 4. 广播 ---------- */
  let got1 = null, got2 = null, order = [];
  B.onStorage(function (s, m) { order.push('a'); got1 = [s, m]; });
  B.onStorage(function () { order.push('b'); throw new Error('故意的'); });
  B.onStorage(function (s, m) { order.push('c'); got2 = [s, m]; });
  w.__xjStorage({ mode: 'public', root: '/storage/emulated/0/xinjian' }, false);
  ok('第一个注册者收到', got1 && got1[0].mode === 'public');
  ok('migrated 透传为 false', got1 && got1[1] === false);
  ok('前一个注册者抛错不影响后面的', got2 && got2[0].mode === 'public');
  ok('三个都被叫到（异常被隔离）', order.join(',') === 'a,b,c');

  /* ---------- 5. 迁移后书架重画 ---------- */
  w.Nav.go('shelf');
  await wait(200);
  ok('已进入书架页', !!q('.book') || !!q('.shelf-empty') || /书架/.test((q('.t-title') || {}).textContent || ''));
  const before = native.listCalls;
  w.__xjStorage({ mode: 'public', root: '/storage/emulated/0/xinjian' }, true);
  await wait(250);
  ok('migrated=true 时书架重新读了列表', native.listCalls > before);

  /* 不在书架页时不该白重画 */
  w.Nav.go('home');
  await wait(200);
  const before2 = native.listCalls;
  w.__xjStorage({ mode: 'public', root: '/storage/emulated/0/xinjian' }, true);
  await wait(250);
  ok('不在书架页时不乱刷列表', native.listCalls === before2);

  /* ---------- 6. 回调缺失也不能崩 ---------- */
  w.__xjStorage();
  ok('__xjStorage() 不带参数不抛异常', true);

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();