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

const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/', pretendToBeVisual: true });
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function ok(name, cond) { if (cond) { pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name); } }
const cs = (el, k) => w.getComputedStyle(el).getPropertyValue(k);

/* 一行 26 字，测试里用来验证“不是硬换行” */
const LONG = '- [第一章\u3000风雨欲来（上）](#第一章风雨欲来上)\n第二行\n';

(async () => {
  await wait(100);

  /* 造一个 .md，走 plain 分支（就是不显示高亮层的那个分支） */
  await w.Bridge.create('宽度测试.md', LONG + LONG);

  d.querySelector('[data-go=shelf]').click();
  await wait(150);
  ok('书架出现该文件', d.querySelectorAll('.book').length >= 1);

  const book = Array.prototype.filter.call(
    d.querySelectorAll('.book'), b => b.dataset.name === '宽度测试.md')[0];
  ok('找到目标书', !!book);
  book.click();
  await wait(200);

  const ca = d.querySelector('#ca');
  const ta = d.querySelector('#ta');
  const pre = d.querySelector('#pre');
  ok('进入编辑器', !!ta && !!ca);

  /* 核心：.md 走 plain 分支 */
  ok('.md 被判定为 plain（不加高亮层）', ca.classList.contains('plain'));
  ok('高亮层被隐藏', pre && cs(pre, 'display') === 'none');

  /* 这就是唯一的 bug 点：plain 把 textarea 改成 relative，
     如果没显式给尺寸，宽度会退回 HTML 默认 cols（20 字符）→ 只占左半边 */
  ok('plain 下 textarea 是 relative 定位', cs(ta, 'position') === 'relative');
  ok('plain 下 textarea 宽度 100%（关键）', cs(ta, 'width') === '100%');
  ok('plain 下 textarea 高度 100%', cs(ta, 'height') === '100%');
  ok('plain 下四边偏移已清空（否则会顶偏）',
    ['top', 'right', 'bottom', 'left'].every(k => {
      const v = cs(ta, k);
      return v === 'auto' || v === '';
    }));

  /* 内容确实是 26 字一行，没有被插入硬换行 */
  const lines = ta.value.split('\n');
  ok('内容最长行 26 字（证明换行是渲染出来的，不是文件里的）',
    Math.max.apply(null, lines.map(x => x.length)) === 26);

  /* .code-area 作为 flex 子项不能丢 min-width:0 */
  const css = rd('style.css');
  ok('.code-area 有 min-width:0（flex 子项不被内容撑开）',
    /\.code-area\{[^}]*min-width:0/.test(css.replace(/\n/g, '')));

  /* 绝对定位那组也必须自带宽高，不能只靠 inset */
  const absBlock = css.slice(css.indexOf('.code-area pre,.code-area textarea{'));
  const absRule = absBlock.slice(0, absBlock.indexOf('}'));
  ok('绝对定位组写死了 width:100%', absRule.indexOf('width:100%') >= 0);
  ok('绝对定位组写死了 height:100%', absRule.indexOf('height:100%') >= 0);
  ok('绝对定位组四边齐全',
    ['top:0', 'right:0', 'bottom:0', 'left:0'].every(k => absRule.indexOf(k) >= 0));

  /* 代码类文件（.bf）仍走高亮分支，别被误伤 */
  await w.Bridge.create('语法测试.bf', 'int main(){ do(so==12, over!){ } }\n');
  d.querySelector('#edBar [data-act=leave]').click();
  await wait(150);
  const bf = Array.prototype.filter.call(
    d.querySelectorAll('.book'), b => b.dataset.name === '语法测试.bf')[0];
  ok('书架出现 .bf', !!bf);
  bf.click();
  await wait(200);
  const ca2 = d.querySelector('#ca');
  ok('.bf 不走 plain（仍用高亮层）', ca2 && !ca2.classList.contains('plain'));
  ok('.bf 的高亮层可见', cs(d.querySelector('#pre'), 'display') !== 'none');

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();