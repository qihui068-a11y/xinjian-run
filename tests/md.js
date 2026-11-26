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

/* scrollIntoView 在 jsdom 里没实现，打桩后用来验证跳转真的被调用 */
w.Element.prototype.scrollIntoView = function () { this.setAttribute('data-scrolled', '1'); };

const DOC = [
  '# 死亡与解放',
  '',
  '> **作者**：森下野一',
  '',
  '---',
  '',
  '## 目录',
  '',
  '- [第一章　风雨欲来（上）](#第一章风雨欲来上)',
  '',
  '## 第一部　黑日将至',
  '',
  '### 第一章　风雨欲来（上）',
  '',
  '正文里有**粗体**、*斜体*、`行内代码`、[外链](http://example.com)。',
  '',
  '```js',
  'var a = 1 < 2;',
  '```',
  '',
  '| 名字 | 数量 |',
  '| --- | --- |',
  '| 甲 | 1 |',
  '',
  '- 无序一',
  '- 无序二',
  '  - 子项',
  '',
  '1. 有序一',
  '2. 有序二',
  ''
].join('\n');

(async () => {
  await wait(100);

  /* ================= 一、渲染器单元测试 ================= */
  const MD = w.MD;
  ok('MD 已加载', !!MD && typeof MD.render === 'function');

  ok('h1 带锚点', MD.render('# 标题') === '<h1 id="标题">标题</h1>');
  ok('h2', MD.render('## 小节').indexOf('<h2 id="小节">小节</h2>') === 0);
  ok('h3', MD.render('### 小节').indexOf('<h3') === 0);
  ok('h6 不越界', MD.render('###### 六').indexOf('<h6') === 0);

  ok('粗体', /<strong>粗<\/strong>/.test(MD.render('x **粗** y')));
  ok('斜体', /<em>斜<\/em>/.test(MD.render('x *斜* y')));
  ok('删除线', /<del>删<\/del>/.test(MD.render('x ~~删~~ y')));
  ok('行内代码', /<code>a<\/code>/.test(MD.render('用 `a` 调')));
  ok('行内代码里的星号不变成强调', MD.render('`a*b*c`').indexOf('<em>') === -1);

  ok('链接', MD.render('[字](http://a.b)').indexOf('href="http://a.b"') >= 0);
  ok('图片语法不被误判成链接',
    MD.render('![a](x.png)').indexOf('<img') >= 0 &&
    MD.render('![a](x.png)').indexOf('<a ') === -1);

  ok('无序列表', /<ul><li>一<\/li><li>二<\/li><\/ul>/.test(MD.render('- 一\n- 二')));
  ok('有序列表', /<ol><li>一<\/li><li>二<\/li><\/ol>/.test(MD.render('1. 一\n2. 二')));
  ok('嵌套列表', /<li>一<ul><li>子<\/li><\/ul><\/li>/.test(MD.render('- 一\n  - 子')));

  ok('引用', /<blockquote><p>引<\/p><\/blockquote>/.test(MD.render('> 引')));
  ok('分隔线', MD.render('---') === '<hr>');
  ok('段落之间分开', MD.render('甲\n\n乙').indexOf('</p>\n<p>') >= 0);
  ok('段内单换行变 br', MD.render('甲\n乙').indexOf('<br>') >= 0);

  ok('围栏代码块', /<pre class="md-code"><code>a&lt;b<\/code><\/pre>/.test(MD.render('```\na<b\n```')));
  ok('代码块带语言', MD.render('```js\nx\n```').indexOf('data-lang="js"') >= 0);
  ok('代码块内容不被当 markdown', MD.render('```\n**x**\n```').indexOf('<strong>') === -1);

  ok('表格', /<table class="md-table">.*<th>名字<\/th>.*<td>甲<\/td>/s.test(
    MD.render('| 名字 | 数量 |\n| --- | --- |\n| 甲 | 1 |')));

  /* ---- 注入防护 ---- */
  const x1 = MD.render('<script>alert(1)</script>');
  ok('尖括号被转义', x1.indexOf('&lt;script&gt;') >= 0 && x1.indexOf('<script>') === -1);
  const x2 = MD.render('<img src=x onerror=alert(1)>');
  ok('裸 HTML 标签不会执行', x2.indexOf('<img') === -1);
  const x3 = MD.render('![a" onerror="alert(1)](x.png)');
  ok('alt 里的引号不能撑开属性', x3.indexOf('onerror="') === -1);
  const x4 = MD.render('# <b>x</b>');
  ok('标题里也不允许 HTML', x4.indexOf('<b>') === -1);

  /* ================= 二、编辑器集成 ================= */
  await w.Bridge.create('渲染测试.md', DOC);
  await w.Bridge.create('纯文本.txt', '# 这不是标题\n');
  await w.Bridge.create('代码.bf', 'int main(){ }\n');

  d.querySelector('[data-go=shelf]').click();
  await wait(200);
  const openBook = nm => Array.prototype.filter.call(
    d.querySelectorAll('.book'), b => b.dataset.name === nm)[0];

  const mdBook = openBook('渲染测试.md');
  ok('书架里有渲染测试.md', !!mdBook);
  mdBook.click();
  await wait(250);

  const mdView = d.querySelector('#mdView');
  const wrapEl = d.querySelector('.editor-wrap');
  ok('阅读态显示渲染容器', mdView && !mdView.classList.contains('hidden'));
  ok('阅读态隐藏源码视图', wrapEl && wrapEl.classList.contains('hidden'));

  const body = mdView.querySelector('.md-body');
  ok('生成了 md-body', !!body);
  ok('h1 渲染成标题元素', !!body.querySelector('h1'));
  ok('h1 文本正确', body.querySelector('h1').textContent === '死亡与解放');
  ok('引用块存在', !!body.querySelector('blockquote'));
  ok('引用里的粗体生效', !!body.querySelector('blockquote strong'));
  ok('分隔线存在', !!body.querySelector('hr'));
  ok('列表存在', !!body.querySelector('ul li'));
  ok('嵌套子项存在', !!body.querySelector('ul ul li'));
  ok('有序列表存在', !!body.querySelector('ol li'));
  ok('代码块存在', !!body.querySelector('pre.md-code'));
  ok('表格存在', !!body.querySelector('table.md-table'));
  ok('行内代码存在', !!body.querySelector('p code'));
  ok('粗体、斜体、链接都在',
    !!body.querySelector('p strong') && !!body.querySelector('p em') &&
    !!body.querySelector('p a'));

  /* 关键：渲染后不该再看到 markdown 记号 */
  const shown = mdView.textContent;
  ok('渲染后看不到 # 记号', shown.indexOf('# ') === -1 && shown.indexOf('###') === -1);
  ok('渲染后看不到 ** 记号', shown.indexOf('**') === -1);
  ok('渲染后看不到 | --- | 表格线', shown.indexOf('| ---') === -1);
  ok('正文文字仍在', shown.indexOf('正文里有') >= 0);
  ok('代码块里的 < 被转义成文本', shown.indexOf('var a = 1 < 2;') >= 0);

  /* 状态栏：渲染态下不该再显示 行:列 */
  ok('渲染态隐藏行:列', d.querySelector('#stPos').classList.contains('hidden'));
  ok('渲染态仍显示字数', /\d+ 字/.test(d.querySelector('#stWords').textContent));

  /* ---- 目录跳转 ---- */
  const tocLink = Array.prototype.filter.call(
    body.querySelectorAll('a'), a => (a.getAttribute('href') || '').charAt(0) === '#')[0];
  ok('目录里有锚点链接', !!tocLink);
  tocLink.click();
  await wait(60);
  const jumped = body.querySelector('[data-scrolled="1"]');
  ok('点目录能跳到对应标题', !!jumped && jumped.textContent.indexOf('第一章') >= 0);

  /* ---- 编辑态：回到源码 ---- */
  d.querySelector('#edBar [data-act=edit]').click();
  await wait(120);
  ok('编辑态隐藏渲染容器', mdView.classList.contains('hidden'));
  ok('编辑态显示源码视图', !wrapEl.classList.contains('hidden'));
  ok('编辑态 textarea 有原始 markdown',
    d.querySelector('#ta').value.indexOf('# 死亡与解放') >= 0);
  ok('编辑态恢复行:列显示', !d.querySelector('#stPos').classList.contains('hidden'));
  ok('编辑态顶栏有完成按钮', d.querySelector('#edBar').textContent.indexOf('完成') >= 0);

  /* ---- 改内容 → 完成 → 重新渲染 ---- */
  const ta = d.querySelector('#ta');
  ta.value = '# 改过了\n\n新正文\n';
  ta.dispatchEvent(new w.Event('input'));
  d.querySelector('#edBar [data-act=done]').click();
  await wait(250);
  ok('完成回到渲染态', !mdView.classList.contains('hidden'));
  ok('渲染内容跟着变',
    mdView.querySelector('h1') && mdView.querySelector('h1').textContent === '改过了');

  /* 存盘确认 */
  const saved = await w.Bridge.read('渲染测试.md');
  ok('改动已写盘', saved.indexOf('改过了') >= 0);

  /* ---- .txt 不该被渲染 ---- */
  d.querySelector('#edBar [data-act=leave]').click();
  await wait(200);
  openBook('纯文本.txt').click();
  await wait(250);
  ok('.txt 不渲染（仍显示源码视图）',
    d.querySelector('.editor-wrap').classList.contains('hidden') === false);
  ok('.txt 的渲染容器保持隐藏', d.querySelector('#mdView').classList.contains('hidden'));

  /* ---- .bf 不受影响 ---- */
  d.querySelector('#edBar [data-act=leave]').click();
  await wait(200);
  openBook('代码.bf').click();
  await wait(250);
  ok('.bf 走源码视图', !d.querySelector('.editor-wrap').classList.contains('hidden'));
  ok('.bf 仍转成高亮', d.querySelector('#pre').innerHTML.indexOf('tk-') >= 0);

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();