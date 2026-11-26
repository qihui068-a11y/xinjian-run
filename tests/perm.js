/* 权限设置页测试
   验证：三条权限（网络 / 照片 / 相机）能读状态、能申请、
   申请完状态会变、演示模式有兜底文案。 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const dir = '/sdcard/信笺/app/';
const rd = f => fs.readFileSync(dir + f, 'utf8');

function buildHtml() {
  let html = rd('index.html');
  html = html.replace('<link rel="stylesheet" href="style.css">', () => '<style>' + rd('style.css') + '</style>');
  html = html.replace('<script src="bridge.js"></script>', () => '<scr' + 'ipt>' + rd('bridge.js') + '<' + '/scr' + 'ipt>');
  html = html.replace('<script src="highlight.js"></script>', () => '<scr' + 'ipt>' + rd('highlight.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="md.js"></script>', () => '<scr' + 'ipt>' + rd('md.js') + '<' + '/scr' + 'ipt>');
html = html.replace('<script src="anim.js"></script>', () => '<scr' + 'ipt>' + rd('anim.js') + '<' + '/scr' + 'ipt>');
  for (const f of ['net.js', 'navindicator.js', 'spotlight.js', 'themereveal.js', 'app.js', 'data.js', 'views/home.js', 'views/shelf.js', 'views/create.js', 'views/editor.js', 'views/me.js', 'views/chat.js', 'boot.js']) html = html.replace('<script src="' + f + '"></script>', () => '<scr' + 'ipt>' + rd(f) + '<' + '/scr' + 'ipt>');
  return html;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

(async () => {
  /* ================= 原生模式 ================= */
  const state = { storage: false, camera: false };
  let wRef = null;
  const files = {};

  const dom = new JSDOM(buildHtml(), {
    runScripts: 'dangerously',
    url: 'https://app.xinjian.local/index.html',
    pretendToBeVisual: true,
    beforeParse(w) {
      wRef = w;
      w.XinJianBridge = {
        list: () => JSON.stringify(Object.keys(files).map(n => ({ name: n, size: 1, mtime: Date.now(), excerpt: '', ext: 'txt' }))),
        read: () => '', create: () => 'true', write: () => 'true', remove: () => 'true',
        rename: () => 'true', exists: () => 'false', export: () => 'true', rootPath: () => '/fake',
        permStatus: () => JSON.stringify({
          sdk: 34, demo: false,
          items: [
            { key: 'net', label: '网络', note: '鸽屋收发消息。安装时自动授予，无法拒绝。', granted: true, canAsk: false },
            { key: 'storage', label: '照片和视频', note: '自定义头像与背景板。', granted: state.storage, canAsk: true },
            { key: 'camera', label: '相机', note: '扫一扫、拍照。', granted: state.camera, canAsk: true }
          ]
        }),
        askPerm: (k) => {
          if (k === 'storage') state.storage = true;
          if (k === 'camera') state.camera = true;
          setTimeout(() => { if (wRef.__xjPerm) wRef.__xjPerm(k, true); }, 40);
        }
      };
    }
  });
  const w = dom.window, d = w.document;
  const q = s => d.querySelector(s);
  const qa = s => Array.from(d.querySelectorAll(s));
  const appText = () => (d.getElementById('app') || {}).textContent || '';
  async function back() {
    const r = w.__xjBack();
    await wait(90);
    return r;
  }

  await wait(200);

  /* ---------- 从设置进权限页 ---------- */
  w.Nav.reset('me');
  await wait(160);
  qa('.rows .row').find(n => n.textContent.indexOf('设置') >= 0).click();
  await wait(160);
  qa('.rows .row').find(n => n.textContent.indexOf('权限设置') >= 0).click();
  await wait(220);

  ok('进入权限设置页', (q('.t-title') || {}).textContent === '权限设置');
  ok('不再走占位页', !/还没做，先占位/.test(appText()));

  const rows = qa('.perm-row');
  ok('三条权限', rows.length === 3);
  const labels = qa('.perm-name').map(n => n.textContent);
  ok('标签是 网络/照片和视频/相机', labels.join(',') === '网络,照片和视频,相机');
  ok('每条都有说明文字', qa('.perm-note').length === 3);
  ok('每条都有状态标签', qa('.perm-state').length === 3);

  ok('网络显示已授权', /已授权/.test(rows[0].textContent));
  ok('照片显示未授权', /未授权/.test(rows[1].textContent));
  ok('相机显示未授权', /未授权/.test(rows[2].textContent));

  /* ---------- 申请按钮只出现在能申请且未授权的行 ---------- */
  ok('只有 2 个申请按钮', qa('[data-ask]').length === 2);
  ok('网络行没有申请按钮（普通权限不可申请）', !rows[0].querySelector('[data-ask]'));
  ok('照片行有申请按钮', !!rows[1].querySelector('[data-ask=camera], [data-ask=storage]'));
  ok('状态标签的 on 类只加在已授权上',
    rows[0].querySelector('.perm-state').classList.contains('on') &&
    !rows[1].querySelector('.perm-state').classList.contains('on'));

  /* ---------- 申请照片权限 ---------- */
  rows[1].querySelector('[data-ask]').click();
  await wait(200);
  ok('申请后照片变已授权', /已授权/.test(qa('.perm-row')[1].textContent));
  ok('照片行的申请按钮消失', !qa('.perm-row')[1].querySelector('[data-ask]'));
  ok('申请后剩 1 个申请按钮', qa('[data-ask]').length === 1);
  ok('申请后有 toast 提示', /已授权/.test((q('.toast') || {}).textContent || ''));

  /* ---------- 申请相机权限 ---------- */
  qa('.perm-row')[2].querySelector('[data-ask]').click();
  await wait(200);
  ok('相机也变已授权', /已授权/.test(qa('.perm-row')[2].textContent));
  ok('全部授权后没有申请按钮了', qa('[data-ask]').length === 0);

  /* ---------- 页面底部说明 ---------- */
  const noteText = appText();
  ok('底部说明讲清「相册/相机/位置不需要长期权限」', /不需要长期权限/.test(noteText));
  ok('底部说明把「存储访问权限」单独拎出来', /只决定稿子存在哪儿/.test(noteText));
  ok('底部说明写明不开时卸载会清', /卸载会一并清掉/.test(noteText));
  ok('底部「关闭」说明没被字符串拼接截断', /「关闭」会跳到系统的本应用权限页/.test(noteText));

  /* ---------- 返回层级 ---------- */
  ok('权限页返回被接管', await back() === 'handled');
  ok('退回设置', (q('.t-title') || {}).textContent === '设置');
  ok('权限页没有底栏', !q('.tabbar'));

  /* ================= 演示模式（没有原生桥） ================= */
  const dom2 = new JSDOM(buildHtml(), {
    runScripts: 'dangerously',
    url: 'https://app.xinjian.local/index.html',
    pretendToBeVisual: true,
    beforeParse(w2) {
      w2.XinJianBridge = {
        list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
        remove: () => 'true', rename: () => 'true', exists: () => 'false',
        export: () => 'true', rootPath: () => '/demo'
      };
    }
  });
  const w2 = dom2.window, d2 = dom2.window.document;
  await wait(200);
  w2.Nav.go('perm');
  await wait(220);
  const t2 = (d2.getElementById('app') || {}).textContent || '';
  ok('演示模式给出兜底文案', /演示模式读不到系统权限/.test(t2));
  ok('演示模式不会画出假权限行', !d2.querySelector('.perm-row'));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();