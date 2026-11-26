/* 备份页测试
   验证：备份从设置搬到了小家「备份」行，点进去是独立的备份页，
   两项都在、说明在、返回键正常、两个按钮各自有反应。 */
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

/* 书架故意留空，好测「书架是空的」那条 */
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) {
    w.XinJianBridge = {
      list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
      remove: () => 'true', rename: () => 'true', exists: () => 'true',
      export: () => 'true', rootPath: () => '/fake',
      /* 真实原生有这个接口；没有的话页面会落到演示模式文案，那是另一种环境 */
      storageState: () => JSON.stringify({ mode: 'private', root: '/fake/private/xinjian', wanted: '/sdcard/xinjian' })
    };
  }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
const appText = () => (d.getElementById('app') || {}).textContent || '';
const toastText = () => {
  const t = q('.toast');
  return t && t.classList.contains('show') ? t.textContent : '';
};

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
async function back() {
  const r = w.__xjBack();
  await wait(90);
  return r;
}

(async () => {
  await wait(180);

  w.Nav.go('me');
  await wait(150);

  /* ---------- 设置里已经没有备份了 ---------- */
  qa('.rows .row').find(n => n.textContent.indexOf('设置') >= 0).click();
  await wait(150);
  ok('进入设置', (q('.t-title') || {}).textContent === '设置');
  ok('设置里没有「导出全部备份」', !q('[data-act=exportAll]'));
  ok('设置里没有「备份聊天记录」', !q('[data-act=pigeonBackup]'));
  ok('设置里没有数据说明', !q('.set-note'));
  await back();

  /* ---------- 小家备份行 → 备份页 ---------- */
  const backupRow = qa('.rows .row').find(n => n.textContent.indexOf('备份') >= 0);
  ok('小家列表有备份行', !!backupRow);
  backupRow.click();
  await wait(180);

  ok('点备份行进入备份页', (q('.t-title') || {}).textContent === '备份');
  ok('备份页有「导出全部备份」', !!q('[data-act=exportAll]'));
  ok('备份页有「备份聊天记录」', !!q('[data-act=pigeonBackup]'));
  ok('备份页有书架分组', /书架/.test(appText()));
  ok('备份页有鸽屋分组', /鸽屋/.test(appText()));
  ok('备份页有数据位置说明', /卸载应用会一起删除/.test(appText()));
  ok('备份页没有外观选项', !q('#themeChips'));

  /* ---------- 两个按钮的反应 ---------- */
  q('[data-act=pigeonBackup]').click();
  await wait(120);
  ok('备份聊天记录给了提示（原生未接入）', /选目录/.test(toastText()));

  q('[data-act=exportAll]').click();
  await wait(150);
  ok('书架空时导出提示「书架是空的」', /书架是空的/.test(toastText()));

  /* ---------- 返回 ---------- */
  ok('备份页返回被接管', await back() === 'handled');
  ok('退回到小家', !!q('.me-hero'));
  ok('小家里的备份行还在', /备份/.test(q('.rows').textContent));

  /* ---------- 备份页不该出现 tabbar ---------- */
  qa('.rows .row').find(n => n.textContent.indexOf('备份') >= 0).click();
  await wait(150);
  ok('备份页没有底栏', !q('.tabbar'));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();