/* 小家 / 设置 / 鸽屋 / 会话 的界面测试
   验证：小家页是「我页」结构（头像 + 功能行）、设置收纳外观与备份、
   鸽屋二级 / 会话三级 能正常进出、消息能落本地、返回键逐级退。 */
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

const files = { '草稿.txt': '第一行' };
function bridge() {
  function valid(n) {
    const s = String(n == null ? '' : n).trim();
    if (!s || s.length > 200) return null;
    if (s.indexOf('/') >= 0 || s.indexOf('\\') >= 0) return null;
    if (s === '.' || s === '..') return null;
    return s;
  }
  return {
    list() {
      return JSON.stringify(Object.keys(files).map(n => ({
        name: n, size: files[n].length, mtime: Date.now(),
        excerpt: files[n].split('\n')[0].slice(0, 60),
        ext: (n.split('.').pop() || '').toLowerCase()
      })));
    },
    read(n) { const k = valid(n); if (!k || !(k in files)) throw new Error('x'); return files[k]; },
    create(n, t) { const k = valid(n); if (!k || k in files) return 'false'; files[k] = t || ''; return 'true'; },
    write(n, t) { const k = valid(n); if (!k) return 'false'; files[k] = t || ''; return 'true'; },
    remove(n) { const k = valid(n); if (!k || !(k in files)) return 'false'; delete files[k]; return 'true'; },
    rename(a, b) { const x = valid(a), y = valid(b); if (!x || !y || !(x in files) || (y in files)) return 'false'; files[y] = files[x]; delete files[x]; return 'true'; },
    exists(n) { const k = valid(n); return (k && (k in files)) ? 'true' : 'false'; },
    export() { return 'true'; },
    rootPath() { return '/fake'; }
  };
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  url: 'https://app.xinjian.local/index.html',
  pretendToBeVisual: true,
  beforeParse(w) { w.XinJianBridge = bridge(); }
});
const w = dom.window, d = w.document;
const wait = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
async function systemBack() {
  const r = typeof w.__xjBack === 'function' ? w.__xjBack() : 'missing';
  await wait(80);
  return r;
}
const q = s => d.querySelector(s);
const qa = s => Array.from(d.querySelectorAll(s));
/* 只取真正渲染出来的界面文本。
   注意不能用 body.textContent —— 它会把 <script> 里的 JS 源码也算进去，
   而源码里本来就写着「还没有通信」「未送达」这些字面量，断言会永远通过。 */
const appText = () => (d.getElementById('app') || {}).textContent || '';
async function fillInput(text) {
  const ipt = q('.mask #_ipt');
  if (!ipt) return false;
  ipt.value = text;
  await wait(30);
  q('.mask [data-act=ok]').click();
  await wait(120);
  return true;
}

(async () => {
  await wait(150);

  /* ---------- 1. 小家页结构 ---------- */
  ok('起始在主页', qa('.entry').length === 4);
  q('[data-tab=me]').click();
  await wait(150);

  ok('进入小家', !!q('.me-hero'));
  ok('顶栏标题是「小家」', (q('.t-title') || {}).textContent === '小家');
  ok('有头像位', !!q('.me-hero .avatar'));
  ok('有背景板', !!q('.me-cover'));
  ok('有昵称位', !!q('.me-name'));
  ok('功能行 5 条', qa('.rows .row').length === 5);

  const labels = qa('.rows .row .row-t').map(n => n.textContent);
  ok('功能行是 鸽屋/备份/设置/关于/赞助',
    labels.join(',') === '鸽屋,备份,设置,关于,赞助');

  const pigeonRow = qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0);
  ok('鸽屋行显示会话数（内置 FUO = 1 个）', !!pigeonRow && /1 个/.test(pigeonRow.textContent));

  /* ---------- 2. 小家页不再直接暴露外观/备份 ---------- */
  /* 外观不再是「设置里的一排胶囊」，改成右上角一个圆形按钮 */
  ok('小家页没有外观 chip', !q('#themeChips'));
  ok('小家右上角有主题按钮', !!q('.topbar .theme-btn'));
  ok('主题按钮在标题行的最右侧', !!q('.topbar .theme-slot .theme-btn'));
  ok('小家页没有直接放导出按钮', !q('[data-act=exportAll]'));

  /* ---------- 3. 设置 ---------- */
  const setRow = qa('.rows .row').find(n => n.textContent.indexOf('设置') >= 0);
  setRow.click();
  await wait(150);
  ok('进入设置', (q('.t-title') || {}).textContent === '设置');
  ok('设置里已经没有外观（已挪到右上角）', !q('#themeChips'));
  ok('设置里不再放备份（已移到小家备份页）',
    !q('[data-act=exportAll]') && !q('[data-act=pigeonBackup]'));
  ok('设置里有关于', !!q('[data-act=about]'));

  ok('设置页里没有旧的 [data-dark] 胶囊', !q('[data-dark]'));

  ok('设置里返回键被接管', await systemBack() === 'handled');
  ok('退回小家', !!q('.me-hero') && !!q('.rows'));

  /* ---------- 4. 背景板 ---------- */
  ok('默认背景板是第 0 套', (q('.me-hero') || {}).dataset.cover === '0');
  q('.me-cover').click();
  await wait(120);
  ok('背景板弹窗打开', !!q('.mask'));
  const coverItems = qa('.mask .sheet-item');
  coverItems[2].click();          /* 斜纹 */
  await wait(150);
  ok('背景板切到第 2 套', (q('.me-hero') || {}).dataset.cover === '2');

  /* ---------- 5. 昵称 ---------- */
  q('.me-name').click();
  await wait(120);
  ok('昵称弹窗打开', !!q('.mask #_ipt'));
  await fillInput('阿晚');
  ok('昵称改成阿晚', (q('.me-name') || {}).textContent === '阿晚');
  ok('头像取昵称首字', (q('.avatar') || {}).textContent.trim() === '阿');

  /* ---------- 6. 鸽屋（二级） ---------- */
  qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0).click();
  await wait(150);
  ok('进入鸽屋', (q('.t-title') || {}).textContent === '鸽屋');
  ok('鸽屋列表里有内置 FUO', /FUO/.test(appText()));
  ok('FUO 一进去就有一句开场白', /你好，我是FUO。/.test(appText()));
  ok('顶栏有添加好友按钮', !!q('[data-act=new]'));

  q('[data-act=new]').click();
  await wait(120);
  ok('+ 弹出下拉菜单', !!q('.pop-menu'));
  q('.pop-item[data-i="1"]').click();   /* 添加朋友 */
  await wait(150);
  /* 改成「从附近设备里挑一台」之后，测试桩没有 netStart，只能走降级分支。
     关键是不能静默造一个假会话 —— 好友必须由真实设备发现后手动添加。 */
  ok('添加朋友不再弹输入框', !q('.mask #_ipt'));
  ok('演示模式给出局域网提示', /演示模式/.test((q('.toast') || {}).textContent || ''));
  ok('没有凭空建出会话', qa('.pg-item').length === 1);

  /* 后面的发消息用例进内置 FUO 会话跑（它是本地 NPC，行为没变） */
  q('.pg-item').click();
  await wait(150);
  ok('会话页标题是 FUO', (q('.t-title') || {}).textContent === 'FUO');
  ok('会话页有占位提示', /FUO/.test(appText()));

  /* ---------- 7. 发消息 ---------- */
  const ipt = q('#chatIpt');
  ipt.value = '在吗';
  q('[data-act=send]').click();
  await wait(120);
  ok('消息气泡出现', !!q('.msg.out .bubble'));
  ok('气泡内容正确', (q('.msg.out .bubble') || {}).textContent.indexOf('在吗') >= 0);
  ok('标记为本机未送达', /未送达/.test(appText()));

  const n1 = qa('.msg').length;
  ipt.value = '   ';
  q('[data-act=send]').click();
  await wait(120);
  ok('空白消息不发送', qa('.msg').length === n1);
  /* 新行为：输入框空时按钮是 +，点它是展开面板而不是发送。
     先收掉面板，否则下面「返回」的第一下会被面板吃掉。 */
  ok('空白时点按钮是展开面板', !!q('#chatPanel') && !q('#chatPanel').hasAttribute('hidden'));
  ok('收面板的返回被接管', await systemBack() === 'handled');
  ok('面板已收起', q('#chatPanel').hasAttribute('hidden'));

  /* ---------- 8. 逐级返回 ---------- */
  ok('会话页返回被接管', await systemBack() === 'handled');
  ok('退回鸽屋列表', !!q('.pg-item'));
  ok('列表显示会话名', /FUO/.test(appText()));
  ok('列表显示最后一条摘要', /在吗/.test(appText()));

  ok('鸽屋返回被接管', await systemBack() === 'handled');
  ok('退回小家', !!q('.me-hero'));
  /* 加好友已经改成「从附近设备里挑」，演示模式下不会凭空多出会话 */
  ok('小家鸽屋行只算真会话（FUO = 1 个）', /1 个/.test(q('.rows .row').textContent));

  /* ---------- 9. 回到主页，返回键该放行 ---------- */
  ok('小家返回被接管', await systemBack() === 'handled');
  await wait(100);
  q('[data-tab=home]').click();
  await wait(150);
  ok('回到主页', qa('.entry').length === 4);
  ok('根层返回给 pass', await systemBack() === 'pass');

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();