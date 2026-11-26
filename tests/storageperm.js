/* 权限设置 · 「存储访问权限」行测试（0.4.4）
   测什么：权限页多出来的第 4 行确实存在、状态显示对、申请与关闭转发对。
   **不测什么**：原生那边 publicWritable() 判断得对不对、跳设置页成不成——
   jsdom 里没有环境，这里不假装测到。 */
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
  for (const f of ['net.js', 'navindicator.js', 'spotlight.js', 'themereveal.js', 'app.js', 'data.js',
    'views/home.js', 'views/shelf.js', 'views/create.js', 'views/editor.js', 'views/me.js', 'views/chat.js', 'boot.js']) {
    html = html.replace('<script src="' + f + '"></script>', () => '<scr' + 'ipt>' + rd(f) + '<' + '/scr' + 'ipt>');
  }
  return html;
}
const wait = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* 造一个带「存储访问权限」行的原生桥。granted 决定初始状态。 */
function makeDom(granted) {
  const st = { granted: granted, askCalls: [], settingsOpened: 0 };
  let wRef = null;
  const dom = new JSDOM(buildHtml(), {
    runScripts: 'dangerously',
    url: 'https://app.xinjian.local/index.html',
    pretendToBeVisual: true,
    beforeParse(w) {
      wRef = w;
      w.XinJianBridge = {
        list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
        remove: () => 'true', rename: () => 'true', exists: () => 'false',
        export: () => 'true', rootPath: () => '/fake',
        permStatus: () => JSON.stringify({
          sdk: 34, demo: false,
          items: [
            { key: 'net', label: '网络', note: '鸽屋收发消息。', granted: true, canAsk: false },
            { key: 'allFiles', label: '存储访问权限',
              note: st.granted ? '稿子存在 /sdcard/xinjian，卸载重装也不会丢。'
                : '现在存在应用私有目录，卸载会一并清掉；开启后自动搬过去，不覆盖同名文件。',
              granted: st.granted, canAsk: true, revocable: true },
            { key: 'storage', label: '照片和视频', note: '自定义头像。', granted: false, canAsk: true },
            { key: 'camera', label: '相机', note: '扫一扫、拍照。', granted: false, canAsk: true }
          ]
        }),
        askPerm: (k) => {
          st.askCalls.push(k);
          /* 真机上「申请」是跳系统设置页，回来才变 true；这里模拟「用户开了」 */
          if (k === 'allFiles') {
            st.granted = true;
            setTimeout(() => { if (wRef.__xjPerm) wRef.__xjPerm(k, true); }, 40);
          }
        },
        openAppSettings: () => { st.settingsOpened++; return true; },
        storageState: () => '{"mode":"private","root":"/fake/private"}'
      };
    }
  });
  return { dom, st };
}

(async () => {
  /* ================= 未授权状态 ================= */
  const A = makeDom(false);
  const d = A.dom.window.document;
  const qa = s => Array.from(d.querySelectorAll(s));
  await wait(200);
  A.dom.window.Nav.go('perm');
  await wait(220);

  const rows = qa('.perm-row');
  ok('权限页共 4 行', rows.length === 4);
  ok('第 2 行是存储访问权限', (rows[1].querySelector('.perm-name') || {}).textContent === '存储访问权限');
  ok('未授权时显示「未授权」', /未授权/.test(rows[1].textContent));
  ok('未授权的 .perm-state 不带 on 类',
    !rows[1].querySelector('.perm-state').classList.contains('on'));
  ok('说明里讲清「现在在私有目录、卸载会清」', /私有目录/.test(rows[1].textContent));
  ok('说明里讲清「开启后自动搬过去、不覆盖同名」', /不覆盖同名/.test(rows[1].textContent));

  const icon = rows[1].querySelector('.row-ico svg');
  ok('这一行有图标', !!icon);
  ok('用的是 folder 图标（不是默认的锁）',
    !!icon && icon.innerHTML.indexOf('M3 7a1 1 0 0 1 1-1h5') >= 0);

  const askBtn = rows[1].querySelector('[data-ask]');
  ok('有申请按钮且 key 是 allFiles', !!askBtn && askBtn.dataset.ask === 'allFiles');

  /* ---------- 点申请：必须原样把 allFiles 转发给原生 ---------- */
  askBtn.click();
  await wait(200);
  ok('申请转发给了原生（key=allFiles）',
    A.st.askCalls.length === 1 && A.st.askCalls[0] === 'allFiles');
  ok('拿到结果后变成已授权', /已授权/.test(qa('.perm-row')[1].textContent));
  ok('已授权后申请按钮消失', !qa('.perm-row')[1].querySelector('[data-ask]'));
  ok('已授权后 .perm-state 带上 on 类',
    qa('.perm-row')[1].querySelector('.perm-state').classList.contains('on'));
  ok('已授权后出现「关闭」按钮',
    !!qa('.perm-row')[1].querySelector('[data-close=allFiles]'));

  /* ---------- 点关闭：只能跳系统页面，不能自己撤 ---------- */
  qa('.perm-row')[1].querySelector('[data-close]').click();
  await wait(60);
  ok('关闭转发到系统设置页', A.st.settingsOpened === 1);
  ok('关闭时给出「在系统页面里关掉」的提示',
    /在系统页面里关掉这个权限/.test((d.querySelector('.toast') || {}).textContent || ''));

  /* ================= 已授权状态 ================= */
  const B = makeDom(true);
  const d2 = B.dom.window.document;
  await wait(200);
  B.dom.window.Nav.go('perm');
  await wait(220);
  const r2 = Array.from(d2.querySelectorAll('.perm-row'))[1];
  ok('已授权时直接显示「已授权」', /已授权/.test(r2.textContent));
  ok('已授权时没有申请按钮', !r2.querySelector('[data-ask]'));
  ok('已授权时说明里给出真实公共路径', /\/sdcard\/xinjian/.test(r2.textContent));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();
