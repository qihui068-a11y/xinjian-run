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

(async () => {
  await wait(100);
  ok('主页 4 入口', d.querySelectorAll('.entry').length === 4);
  ok('底栏 3 项', d.querySelectorAll('.tabbar .tab').length === 3);

  d.querySelector('[data-go=shelf]').click();
  await wait(80);
  ok('书架空态', !!d.querySelector('.empty'));

  d.querySelector('[data-act=new]').click();
  await wait(80);
  ok('新建页有输入框', !!d.querySelector('#nameIpt'));
  /* ---------- 格式清单：BF/BFH 撤下、7 种语言进来 ---------- */
  const fmtIds = Array.prototype.slice.call(d.querySelectorAll('#fmtChips .chip'))
    .map(c => c.dataset.fmt);
  ok('新建页 12 种格式', fmtIds.length === 12);
  ok('格式顺序：TXT/Markdown/C/C++/C#/Python/Java/JS/JSON/CSS/HTML/XML',
    fmtIds.join(',') === 'txt,md,c,cpp,cs,py,java,js,json,css,html,xml');
  ok('BF 已从新建页撤下', fmtIds.indexOf('bf') < 0);
  ok('BFH 已从新建页撤下', fmtIds.indexOf('bfh') < 0);
  ok('胶囊上显示后缀（.py）', /\.py/.test(d.querySelector('#fmtChips').textContent));


  d.querySelector('#nameIpt').value = '冒烟测试';
  d.querySelector('[data-fmt=c]').click();       /* BF 已从新建页撤下，冒烟改用 C */
  d.querySelector('[data-act=ok]').click();
  await wait(200);
  ok('进入编辑器', !!d.querySelector('#ta'));
  ok('编辑态含完成按钮', d.querySelector('#edBar').textContent.indexOf('完成') >= 0);

  const ta = d.querySelector('#ta');
  ta.value = '/*注释 (嵌套) 结束*/\nint main(){\n  int a = 12;\n  return a;\n}\n';
  ta.dispatchEvent(new w.Event('input'));
  await wait(150);
  ok('高亮产出 span', d.querySelector('#pre').innerHTML.indexOf('tk-') > 0);
  ok('行号已生成', d.querySelectorAll('#gin br').length >= 5);
  ok('状态栏字数', d.querySelector('#stWords').textContent.indexOf('字') > 0);

  d.querySelector('[data-act=done]').click();
  await wait(150);
  ok('回到阅读态', !!d.querySelector('[data-act=edit]'));

  d.querySelector('[data-act=leave]').click();
  await wait(200);
  ok('书架出现 1 个文件', d.querySelectorAll('.book').length === 1);
  ok('文件名正确', (d.querySelector('.b-name') || {}).textContent === '冒烟测试.c');
  ok('摘要非空', ((d.querySelector('.b-excerpt') || {}).textContent || '').length > 0);

  const B = w.Bridge;
  const list = await B.list();
  ok('桥接层落盘', list.length === 1 && list[0].name === '冒烟测试.c');
  ok('摘要字段', (list[0].excerpt || '').indexOf('注释') >= 0);
  const txt = await B.read('冒烟测试.c');
  ok('内容持久化', txt.indexOf('int a = 12') > 0);

  /* ---------- 演示模式横幅（没有原生桥时必须显眼） ---------- */
  const bar = d.querySelector('.demo-bar');
  ok('没有原生桥时挂出演示模式横幅', !!bar);
  ok('横幅明说改动不会保存', /改动不会保存/.test((bar || {}).textContent || ''));
  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();