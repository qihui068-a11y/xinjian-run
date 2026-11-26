/* 「去网页感」测试

   三件事：
   1) 全局禁选 + 白名单（阅读态 .md-body、聊天气泡、输入框要能选）；
   2) 暗色下白色不是纯白，是米黄白 #F7F2E8，且 --fg-rgb 同步改成 247,242,232；
   3) 原生侧关掉浏览器行为：overscroll 辉光、滚动条、长按震动、系统字体缩放。

   两个容易假通过的坑，这里都绕开了：
   - jsdom 会把 `user-select` 和 `var()` 颜色都算出来（先探过），所以断言用 getComputedStyle，
     不是只 grep 源码；
   - 白名单必须验**后代**（.md-body *）。`*{user-select:none}` 会把每个元素都显式设成 none，
     继承就断了 —— 只测 .md-body 自己是会假通过的。
*/
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
  pretendToBeVisual: true
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const cs = el => w.getComputedStyle(el);
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }

(async () => {
  await wait(150);
  const css = rd('style.css').replace(/\s+/g, ' ');
  const java = fs.readFileSync('/sdcard/信笺/android/app/src/main/java/tt/xinjian/cn/MainActivity.java', 'utf8');

  /* ============ 一、全局禁选 + 白名单 ============ */
  w.Nav.go('home');
  await wait(250);
  const entry = d.querySelector('.entry');
  ok('主页卡片不能选字（user-select:none）', cs(entry).userSelect === 'none');
  ok('外壳容器也不能选（.view）', cs(d.querySelector('.view')).userSelect === 'none');
  ok('顶栏标题不能选', cs(d.querySelector('.tabbar') || entry).userSelect === 'none');

  /* 白名单：插一个阅读态节点验「自己和后代都能选」 */
  const md = d.createElement('div');
  md.className = 'md-body';
  md.innerHTML = '<p>正文 <code>代码</code></p>';
  d.getElementById('app').appendChild(md);
  const mdP = md.querySelector('p'), mdCode = md.querySelector('code');
  ok('阅读态正文可选中', cs(md).userSelect === 'text');
  ok('阅读态的后代也可选中（白名单写了 .md-body *，否则继承被 * 规则掐断）',
    cs(mdP).userSelect === 'text' && cs(mdCode).userSelect === 'text');

  /* 输入框：编辑器与聊天输入框都要能选 */
  ok('textarea 可选中（编辑器 / 聊天输入框）',
    /textarea[^{]*\{[^}]*user-select:text|textarea,/.test(css) && /textarea/.test(css));
  const ta = d.createElement('textarea');
  d.getElementById('app').appendChild(ta);
  ok('textarea 的计算值是 text', cs(ta).userSelect === 'text');
  const inp = d.createElement('input');
  d.getElementById('app').appendChild(inp);
  ok('input 的计算值是 text', cs(inp).userSelect === 'text');

  /* 聊天气泡 */
  const bub = d.createElement('div');
  bub.className = 'bubble';
  const wrap = d.createElement('div');
  wrap.className = 'msg';
  wrap.appendChild(bub);
  d.getElementById('app').appendChild(wrap);
  ok('聊天气泡可选中（要复制消息）', cs(bub).userSelect === 'text');

  /* ============ 二、暗色下米黄白 ============ */
  ok('亮色主题仍是纯白底 + 深字（未受影响）',
    cs(d.body).backgroundColor === 'rgb(255, 255, 255)');
  d.documentElement.classList.add('dark');
  await wait(30);
  const darkFg = cs(d.body).color;
  ok('暗色正文颜色是米黄白 rgb(247, 242, 232)', darkFg === 'rgb(247, 242, 232)');
  ok('暗色正文不再是纯白', darkFg !== 'rgb(255, 255, 255)');
  ok('暗色底色没变（还是 #1E1E1E）', cs(d.body).backgroundColor === 'rgb(30, 30, 30)');
  ok('CSS 里 --fg-rgb 同步改成 247,242,232（否则描边 / 光斑还带着纯白）',
    /html\.dark, body\.dark\{[^}]*--fg-rgb:247,242,232/.test(css));
  ok('CSS 里 --fg 是 #F7F2E8', /html\.dark, body\.dark\{[^}]*--fg:#F7F2E8/.test(css));
  /* 用 --fg-rgb 画的分隔线也应该跟着变暖 */
  const line = d.createElement('div');
  line.className = 'line';
  d.getElementById('app').appendChild(line);
  ok('用 --fg-rgb 的线也跟着变暖（rgba 247,242,232）',
    cs(line).backgroundColor.replace(/\s/g, '').indexOf('247,242,232') >= 0);
  d.documentElement.classList.remove('dark');

  /* ============ 三、其它网页感（CSS 侧） ============ */
  ok('没有点击高亮（tap-highlight 透明）', /-webkit-tap-highlight-color:transparent/.test(css));
  ok('没有 overscroll 弹性/辉光', /html,body\{[^}]*overscroll-behavior:none/.test(css));
  ok('滚动条不画', /::-webkit-scrollbar\{width:0;height:0/.test(css));
  ok('不吃系统字体缩放', /text-size-adjust:100%/.test(css));
  ok('焦点框去掉', /:focus\{outline:none/.test(css));

  /* ============ 四、原生侧的浏览器行为 ============ */
  ok('原生：滚到头没有辉光（OVER_SCROLL_NEVER）', /setOverScrollMode\(View\.OVER_SCROLL_NEVER\)/.test(java));
  ok('原生：竖滚动条关掉', /setVerticalScrollBarEnabled\(false\)/.test(java));
  ok('原生：横滚动条关掉', /setHorizontalScrollBarEnabled\(false\)/.test(java));
  ok('原生：长按那一下震动关掉', /setHapticFeedbackEnabled\(false\)/.test(java));
  ok('原生：不吃系统字体缩放（setTextZoom(100)）', /setTextZoom\(100\)/.test(java));
  ok('原生：缩放支持仍关闭', /setSupportZoom\(false\)/.test(java) && /setBuiltInZoomControls\(false\)/.test(java));
  /* 关键取舍：不能调 setLongClickable(false)，否则阅读态长按复制就没了。
     注意：必须先把注释剥掉再断言 —— 上面那段解释文字里就带着
     `setLongClickable(false)` 这个字面量，直接 grep 源码会被自己的注释绊倒（假红）。 */
  const javaCode = java.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  ok('原生：真的没调 setLongClickable(false)（阅读态要保留长按复制）',
    !/setLongClickable\(false\)/.test(javaCode));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('CRASH ' + e.stack); process.exit(1); });