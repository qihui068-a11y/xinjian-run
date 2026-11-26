/* 鸽屋 · 内置 NPC（FUO）测试
   验证：FUO 一进去就有开场白、发什么都只回同一句、每次必回、本机落盘、返回层级正常。 */
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
/* 只取渲染出来的界面文本，不能带 <script> 源码 */
const appText = () => (d.getElementById('app') || {}).textContent || '';

const LINE = '你好，我是FUO。';
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
function msgs() { return qa('.msg'); }
function outs() { return qa('.msg.out'); }
function ins() { return qa('.msg.in'); }
function bubbleText(el) {
  const b = el.querySelector('.bubble');
  if (!b) return '';
  /* 只把「本机 · 未送达」那行小字从文本里剔掉，绝不改 DOM——
     之前这函数用 remove() 删节点，导致后面再查「有没有未送达」永远查不到。 */
  const st = b.querySelector('.msg-st');
  return st ? b.textContent.replace(st.textContent, '') : b.textContent;
}
async function send(text) {
  const ipt = q('#chatIpt');
  ipt.value = text;
  q('[data-act=send]').click();
  await wait(60);
}
async function back() {
  const r = w.__xjBack();
  await wait(90);
  return r;
}

(async () => {
  await wait(180);

  /* ---------- 进入鸽屋 ---------- */
  w.Nav.go('me');
  await wait(150);
  qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0).click();
  await wait(180);

  ok('鸽屋列表有会话', qa('.pg-item').length >= 1);
  ok('第一项就是 FUO', /FUO/.test((qa('.pg-item')[0] || {}).textContent || ''));
  ok('列表摘要就是那句开场白', /你好，我是FUO。/.test((qa('.pg-item')[0] || {}).textContent || ''));

  /* ---------- 进会话 ---------- */
  qa('.pg-item')[0].click();
  await wait(180);
  ok('进入 FUO 会话', (q('.t-title') || {}).textContent === 'FUO');
  ok('开场白已存在', msgs().length === 1);
  ok('开场白在左侧（对方）', ins().length === 1 && outs().length === 0);
  ok('开场白内容正确', bubbleText(msgs()[0]) === LINE);
  ok('提示说明它是内置对象', /内置占位对象/.test(appText()));

  /* ---------- 发一句 ---------- */
  await send('你好啊');
  ok('发出去立刻有一条自己的气泡', outs().length === 1);
  ok('自己的消息在右侧', bubbleText(outs()[0]) === '你好啊');
  ok('自己的消息标了未送达', /未送达/.test(outs()[0].textContent));

  await wait(600);
  ok('FUO 回了一句', ins().length === 2);
  ok('回复内容就是那句台词', bubbleText(ins()[1]) === LINE);
  ok('消息总数 3', msgs().length === 3);

  /* ---------- 发完全不相干的内容，仍然同一句 ---------- */
  await send('1+1 等于几');
  await wait(600);
  ok('第二次仍然回同一句', bubbleText(ins()[2]) === LINE);
  ok('消息总数 5', msgs().length === 5);

  await send('   ');
  await wait(600);
  ok('空白输入不发送也不回复', msgs().length === 5);

  /* ---------- 连发三条，应该收到三条回复 ---------- */
  await send('a');
  await send('b');
  await send('c');
  await wait(900);
  ok('连发三条收到三条回复', ins().length === 6);
  ok('连发后消息总数 11', msgs().length === 11);
  const allIn = ins().map(bubbleText);
  ok('所有回复文本完全一致', allIn.every(t => t === LINE));

  /* ---------- 返回再看，数据还在 ---------- */
  ok('会话页返回被接管', await back() === 'handled');
  ok('退回鸽屋列表', !!q('.pg-item'));
  ok('列表摘要跟着变成最后一条', /你好，我是FUO。/.test((q('.pg-item') || {}).textContent || ''));

  qa('.pg-item')[0].click();
  await wait(180);
  ok('再进来消息还在', msgs().length === 11);

  /* ---------- 返回层级到底 ---------- */
  await back();   /* 回鸽屋 */
  await back();   /* 回小家 */
  ok('回到小家', !!q('.me-hero'));
  ok('小家显示 1 个会话', /1 个/.test(q('.rows .row').textContent));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();