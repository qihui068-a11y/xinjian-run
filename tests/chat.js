/* 会话页 · 发送键变 + 与功能面板测试
   验证：空输入键显示 +、有字变「发送」、点 + 开面板、面板只有四项
   （相册/拍摄/位置/文件）、收藏音乐名片已删、面板占返回键一层、
   面板开着离开页面不会漏掉返回层。

   注意：不读 Back.count()（Back 没暴露到 window），
   一律用「按一次返回停在哪」这个用户可见行为来验证层级。 */
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
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) {
    w.XinJianBridge = {
      list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
      remove: () => 'true', rename: () => 'true', exists: () => 'true',
      export: () => 'true', rootPath: () => '/fake'
    };
  }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
/* 只取渲染出来的界面文本，不能带 <script> 源码（上轮踩过的假阳性坑） */
const appText = () => (d.getElementById('app') || {}).textContent || '';
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
const sendBtn = () => q('[data-act=send]');
const panel = () => q('#chatPanel');
const panelOpen = () => { const p = panel(); return !!p && !p.hasAttribute('hidden'); };
const title = () => (q('.t-title') || {}).textContent;
/* 模拟真人输入：改 value 后必须派发 input 事件，否则按钮状态不会更新 */
async function type(text) {
  const ipt = q('#chatIpt');
  ipt.value = text;
  ipt.dispatchEvent(new w.Event('input', { bubbles: true }));
  await wait(60);
}
async function back() {
  const r = w.__xjBack();
  await wait(90);
  return r;
}
const acts = () => qa('.chat-act');
const actLabels = () => acts().map(n => n.textContent.trim());
async function openChat() {
  w.Nav.go('me');
  await wait(150);
  qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0).click();
  await wait(180);
  qa('.pg-item')[0].click();
  await wait(180);
}

(async () => {
  await wait(180);
  await openChat();
  ok('已进入会话页', title() === 'FUO');

  /* ---------- 空输入：按钮是 + ---------- */
  ok('输入框为空', q('#chatIpt').value === '');
  ok('空输入时按钮显示 +', sendBtn().textContent === '+');
  ok('空输入时按钮带 plus 类', sendBtn().classList.contains('plus'));
  ok('面板默认收起', !panelOpen());

  /* ---------- 有字：变「发送」 ---------- */
  await type('你好');
  ok('有字时按钮显示发送', sendBtn().textContent === '发送');
  ok('有字时 plus 类被摘掉', !sendBtn().classList.contains('plus'));

  /* ---------- 清空：变回 + ---------- */
  await type('');
  ok('清空后变回 +', sendBtn().textContent === '+');
  await type('   ');
  ok('只输入空格仍算空，显示 +', sendBtn().textContent === '+');
  await type('');

  /* ---------- 点 + 展开面板 ---------- */
  sendBtn().click();
  await wait(120);
  ok('点 + 展开面板', panelOpen());
  ok('按钮进入打开态', sendBtn().classList.contains('on'));

  /* ---------- 面板内容：只有四项 ---------- */
  ok('面板里正好 4 项', acts().length === 4);
  ok('四项依次是 相册/拍摄/位置/文件', actLabels().join(',') === '相册,拍摄,位置,文件');
  ok('四项的 key 正确',
    acts().map(n => n.dataset.chat).join(',') === 'album,camera,location,file');
  ok('每项都有图标', qa('.chat-act .chat-act-ico svg').length === 4);
  ok('面板里没有 收藏', !/收藏/.test((panel() || {}).textContent || ''));
  ok('面板里没有 音乐', !/音乐/.test((panel() || {}).textContent || ''));
  ok('面板里没有 个人名片', !/名片/.test((panel() || {}).textContent || ''));
  ok('整个页面也没有 收藏/音乐/名片', !/收藏|音乐|名片/.test(appText()));

  /* ---------- 点面板项：给提示，但不动数据 ---------- */
  const msgCountBefore = qa('.msg').length;
  acts()[0].click();
  await wait(100);
  const t = q('.toast');
  ok('点相册有提示', !!t && /相册/.test(t.textContent));
  ok('点面板项不发消息', qa('.msg').length === msgCountBefore);
  ok('点面板项后面板仍开着', panelOpen());

  /* ---------- 返回键：先收面板，再退页 ---------- */
  ok('第一次返回被 Web 接管', await back() === 'handled');
  ok('第一次返回只收面板', !panelOpen());
  ok('仍停在会话页', title() === 'FUO');
  ok('按钮退出打开态', !sendBtn().classList.contains('on'));
  ok('第二次返回才离开会话', await back() === 'handled' && !!q('.pg-item'));
  ok('确认退回鸽屋列表', qa('.pg-item').length >= 1);

  /* ---------- 开合两次，不能留下幻影返回层 ---------- */
  qa('.pg-item')[0].click();
  await wait(180);
  ok('重新进入会话', title() === 'FUO');
  sendBtn().click();
  await wait(100);
  sendBtn().click();
  await wait(100);
  ok('再点一次收起面板', !panelOpen());
  ok('开合后按一次返回就离开会话（无幻影层）',
    await back() === 'handled' && !!q('.pg-item'));

  /* ---------- 有字时点按钮 = 直接发送，不弹面板 ---------- */
  qa('.pg-item')[0].click();
  await wait(180);
  const outBefore = qa('.msg.out').length;
  await type('测试一句');
  sendBtn().click();
  await wait(120);
  ok('有字时点按钮直接发送', qa('.msg.out').length === outBefore + 1);
  ok('有字时点按钮不弹面板', !panelOpen());
  ok('发送后输入框清空', q('#chatIpt').value === '');
  ok('发送后按钮回到 +', sendBtn().textContent === '+');
  await wait(600);   /* 等 NPC 回话，别让后面的断言被异步打乱 */

  /* ---------- 面板开着时发送，面板要收起来 ---------- */
  sendBtn().click();          /* 空输入 → 开面板 */
  await wait(100);
  ok('面板已开', panelOpen());
  await type('面板开着发一句');
  sendBtn().click();
  await wait(120);
  ok('面板开着发送后面板收起', !panelOpen());
  ok('消息发出去了', qa('.msg.out').length === outBefore + 2);
  await wait(600);
  /* ---------- 输入法焦点：三层修复 ----------
     ！jsdom 的 click() 既不派发 mousedown，也不会真的把焦点转给按钮，
     所以「点完还有没有焦点」在这里天然测不到（那样写就是假绿）。
     要测得出来，只能分别盯三件事：
       1) mousedown 的默认行为有没有被拦掉（defaultPrevented）
       2) 主动失焦后再发送，焦点会不会自己回来
       3) 回车的默认行为有没有被拦掉（defaultPrevented）
     少任何一层，Android 上发完就会收键盘。 */
  const iptEl = q('#chatIpt');
  const mEv = new w.MouseEvent('mousedown', { bubbles: true, cancelable: true });
  sendBtn().dispatchEvent(mEv);
  ok('点发送键的 mousedown 被拦截（按钮不抢焦点）', mEv.defaultPrevented === true);

  const outFocus = qa('.msg.out').length;
  await type('焦点兜底');
  iptEl.blur();
  ok('先手动让输入框失焦', d.activeElement !== iptEl);
  sendBtn().click();
  await wait(150);
  ok('失焦状态下发送，焦点自动回到输入框', d.activeElement === iptEl);
  ok('这一句确实发出去了', qa('.msg.out').length === outFocus + 1);

  await type('回车兜底');
  const kEv = new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  iptEl.dispatchEvent(kEv);
  await wait(150);
  ok('回车被 preventDefault（输入法不会当「完成」收键盘）', kEv.defaultPrevented === true);
  ok('回车确实把消息发出去了', qa('.msg.out').length === outFocus + 2);
  ok('回车发送后焦点仍在输入框', d.activeElement === iptEl);
  await wait(600);
  /* ---------- 面板开着离开页面，返回层不能漏 ---------- */
  sendBtn().click();
  await wait(100);
  ok('面板又开了', panelOpen());
  w.Nav.back(false);          /* 直接退页，模拟非返回键的离开 */
  await wait(150);
  ok('离开会话回到鸽屋列表', !!q('.pg-item'));
  ok('旧面板已从 DOM 移除', !q('#chatPanel'));
  ok('离开后按一次返回就回到小家（面板层没漏）',
    await back() === 'handled' && !!q('.me-hero'));
  ok('小家仍只有 1 个会话', (q('.rows .row') || {}).textContent.indexOf('1 个') >= 0);
  /* ---------- 发完立刻离开：不能去 focus 一个已销毁的节点 ----------
     场景：点发送后马上按返回，send() 的回焦是 setTimeout 0，
     那时视图可能已经拆掉。若无条件 focus，在 Android WebView 上
     会对着游离节点弹键盘 —— 表现是「已经退出会话，键盘自己跳出来」。
     ！jsdom 里 focus 一个脱离文档的节点根本不生效（activeElement 不变），
     直接断言焦点会是假绿。所以给 ipt 挂一个调用计数器，直接数「有没有被叫过」。 */
  await openChat();
  ok('离开兜底：重新进入会话页', title() === 'FUO');
  await type('离开兜底一句');
  const iptGone = q('#chatIpt');
  let focusCalls = 0;
  iptGone.focus = function () { focusCalls++; };   /* 只数次数，不真的 focus */
  sendBtn().click();
  w.Nav.back(false);            /* 同步离开，不等 setTimeout(0) 落地 */
  await wait(200);
  ok('发完立刻返回，回焦没有打到已销毁的输入框', focusCalls === 0);
  ok('发完立刻返回，确实回到了鸽屋列表', !!q('.pg-item'));
  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();