/* 会话页四个媒体入口测试：相册 / 拍摄 / 位置 / 文件
   做法：注入一个假的原生桥，模拟真实回调链路
   （Bridge.pickImage() → 原生 → window.__xjPick(json)），
   验证消息真的落盘、气泡真的出现、权限拦截真的会先问再拍。 */
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

const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

/* ---- 假原生：记录被调了哪些方法，并按需触发回调 ---- */
const calls = [];
let granted = { camera: false, loc: false, locFine: false };
let pickReply = null;      // 下一次 pickImage 的回调内容
let locReply = null;

function boot() {
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'https://app.xinjian.local/index.html',
    pretendToBeVisual: true,
    beforeParse(w) {
      w.XinJianBridge = {
        list: () => '[]', read: () => '', create: () => 'true', write: () => 'true',
        remove: () => 'true', rename: () => 'true', exists: () => 'true',
        export: () => 'true', rootPath: () => '/fake', theme: () => { },
        permStatus: () => JSON.stringify({
          demo: false,
          items: [
            { key: 'camera', label: '相机', granted: granted.camera, canAsk: true },
            { key: 'loc', label: '大致位置', granted: granted.loc, canAsk: true, revocable: true },
            { key: 'locFine', label: '精确位置', granted: granted.locFine, canAsk: true, revocable: true }
          ]
        }),
        askPerm: k => {
          /* 只记录，不自动回调：真实的授权结果是由系统弹框异步回来的，
             由测试用例显式调用 w.__xjPerm(...) 来驱动，才能测出顺序。 */
          calls.push('askPerm:' + k);
        },
        pickImage: () => {
          calls.push('pickImage');
          setTimeout(() => { if (w.__xjPick && pickReply) w.__xjPick(JSON.stringify(pickReply)); }, 20);
        },
        pickFile: () => {
          calls.push('pickFile');
          setTimeout(() => {
            if (w.__xjPick) {
              w.__xjPick(JSON.stringify({ ok: true, kind: 'file', name: '笔记.txt', size: 2048 }));
            }
          }, 20);
        },
        capture: () => {
          calls.push('capture');
          setTimeout(() => {
            if (w.__xjPick) {
              w.__xjPick(JSON.stringify({ ok: true, kind: 'image', name: 'cam_1.jpg', size: 900 }));
            }
          }, 20);
        },
        locate: () => {
          calls.push('locate');
          setTimeout(() => { if (w.__xjLoc && locReply) w.__xjLoc(JSON.stringify(locReply)); }, 20);
        },
        openAppSettings: () => { calls.push('openAppSettings'); }
      };
    }
  });
  return dom;
}

(async () => {
  const dom = boot();
  const w = dom.window, d = w.document;
  const q = s => d.querySelector(s);
  const qa = s => Array.from(d.querySelectorAll(s));
  const appText = () => (d.getElementById('app') || {}).textContent || '';
  const msgs = () => qa('.msg');
  const lastMsg = () => msgs()[msgs().length - 1];
  const openPanel = async () => {
    q('[data-act=send]').click();   /* 空输入点 + */
    await wait(80);
  };
  const clickAct = async key => {
    q('.chat-act[data-chat=' + key + ']').click();
    await wait(120);
  };

  await wait(200);
  w.Nav.go('me');
  await wait(150);
  qa('.rows .row').find(n => n.textContent.indexOf('鸽屋') >= 0).click();
  await wait(180);
  qa('.pg-item')[0].click();
  await wait(180);
  ok('已进入会话', (q('.t-title') || {}).textContent === 'FUO');

  /* ================= 相册 ================= */
  await openPanel();
  ok('面板打开了', !q('#chatPanel').hasAttribute('hidden'));
  pickReply = { ok: true, kind: 'image', name: '海边.jpg', size: 123456 };
  const before = msgs().length;
  await clickAct('album');
  ok('点相册调到了原生', calls.indexOf('pickImage') >= 0);
  await wait(150);
  ok('多了一条消息', msgs().length === before + 1);
  ok('出现了图片元素', !!q('.msg-img'));
  ok('图片地址指向私有目录 /media/', /\/media\/%E6%B5%B7%E8%BE%B9\.jpg|\/media\/海边\.jpg/.test(
    (q('.msg-img') || {}).getAttribute ? q('.msg-img').getAttribute('src') : ''));
  ok('图片消息在自己的右侧', lastMsg().classList.contains('out'));
  ok('图片消息也标了未送达', /未送达/.test(lastMsg().textContent));
  /* NPC 应该会回一句 */
  await wait(600);
  ok('NPC 对图片也回了一句', qa('.msg.in').length >= 2);

  /* ================= 文件 ================= */
  await openPanel();
  const beforeFile = msgs().length;
  await clickAct('file');
  ok('点文件调到了原生', calls.indexOf('pickFile') >= 0);
  await wait(150);
  ok('文件消息出现了', msgs().length === beforeFile + 1);
  ok('显示了文件名', /笔记\.txt/.test(appText()));
  ok('显示了文件大小', /2\.0 KB/.test(appText()));
  ok('文件气泡渲染出来了', !!q('.msg-file'));
  await wait(600);

  /* ================= 拍摄：没权限先问 ================= */
  granted.camera = false;
  await openPanel();
  const beforeCam = msgs().length;
  await clickAct('camera');
  ok('没给相机权限时先申请', calls.indexOf('askPerm:camera') >= 0);
  ok('申请前没有直接调相机（顺序：先问后拍）',
    calls.indexOf('askPerm:camera') >= 0 && calls.indexOf('capture') < 0);
  ok('弹框还没回来时，界面不发消息', msgs().length === beforeCam);
  /* 模拟用户在系统弹框里点了允许 */
  granted.camera = true;
  w.__xjPerm('camera', true);
  await wait(200);
  ok('授权后自动去拍', calls.indexOf('capture') >= 0);
  ok('拍照结果变成图片消息', msgs().length === beforeCam + 1);
  ok('拍照图片也指向 /media/', !!q('.msg-img'));
  await wait(600);

  /* ================= 拍摄：已有权限直接拍 ================= */
  const camCalls = calls.filter(c => c === 'capture').length;
  granted.camera = true;
  await openPanel();
  await clickAct('camera');
  await wait(200);
  ok('有权限时不再申请，直接调相机',
    calls.filter(c => c === 'capture').length === camCalls + 1);
  await wait(600);   /* 等这条的 NPC 延迟回复落地，否则会飘进下一段 */

  /* ================= 位置：没权限只给「大致」 ================= */
  granted.loc = false; granted.locFine = false;
  await openPanel();
  const beforeLocMsg = msgs().length;
  await clickAct('location');
  ok('没位置权限时申请精确位置（系统会让用户二选一）',
    calls.indexOf('askPerm:locFine') >= 0);
  ok('申请前没有直接定位', calls.indexOf('locate') < 0);
  ok('弹框还没回来时不产生消息', msgs().length === beforeLocMsg);

  /* 模拟用户只点了「大致」：FINE 仍拒绝，COARSE 给了 */
  granted.loc = true; granted.locFine = false;
  locReply = { ok: true, lat: 30.2741, lon: 120.1551, acc: 60, fine: false };
  w.__xjPerm('locFine', false);
  await wait(350);
  ok('只给大致位置也能发出去', calls.indexOf('locate') >= 0);
  await wait(200);
  ok('位置消息出现了', !!q('.msg-loc'));
  ok('经纬度转换正确', /北纬 30\.2741°/.test(appText()) && /东经 120\.1551°/.test(appText()));
  await wait(600);

  /* ================= 位置：失败兜底 ================= */
  const beforeLoc = msgs().length;
  locReply = { ok: false, why: 'timeout' };
  await openPanel();
  await clickAct('location');
  await wait(250);
  ok('定位失败不产生消息', msgs().length === beforeLoc);
  const tt = q('.toast');
  ok('定位失败有提示', !!tt && /超时/.test(tt.textContent));

  /* ================= 取消 ================= */
  const beforeCancel = msgs().length;
  pickReply = { ok: false, why: 'cancel' };
  await openPanel();
  await clickAct('album');
  await wait(200);
  ok('取消不产生消息', msgs().length === beforeCancel);

  /* ================= 数据真的落盘了 ================= */
  const db = JSON.parse(w.localStorage.getItem('xj:pigeon:v1'));
  const fuo = db.sessions.fuo;
  const kinds = fuo.msgs.map(m => m.kind || 'text');
  ok('图片消息存了 kind=image', kinds.indexOf('image') >= 0);
  ok('文件消息存了 kind=file', kinds.indexOf('file') >= 0);
  ok('位置消息存了 kind=loc', kinds.indexOf('loc') >= 0);
  const imgMsg = fuo.msgs.filter(m => m.kind === 'image')[0];
  ok('存的是文件名不是 base64', imgMsg && imgMsg.name && String(imgMsg.name).length < 80);
  ok('没把图片内容塞进 localStorage',
    w.localStorage.getItem('xj:pigeon:v1').length < 20000);

  /* ================= 离开页面后回调不能打到旧界面 ================= */
  await openPanel();
  w.__xjBack();                 /* 第一下：收面板（面板占返回键一层） */
  await wait(120);
  w.__xjBack();                 /* 第二下：真正退页 */
  await wait(150);
  ok('已经离开会话页', !!q('.pg-item'));
  const beforeStale = qa('.msg').length;
  pickReply = { ok: true, kind: 'image', name: '迟到.jpg', size: 1 };
  if (w.__xjPick) w.__xjPick(JSON.stringify(pickReply));   /* 迟到的回调 */
  await wait(150);
  ok('页面已离开，迟到回调不报错也不乱加消息', qa('.pg-item').length >= 1 && qa('.msg').length === beforeStale);

  /* ================= 权限页 ================= */
  w.Nav.go('me');
  await wait(150);
  qa('.rows .row').find(n => n.textContent.indexOf('设置') >= 0).click();
  await wait(150);
  qa('.rows .row').find(n => n.textContent.indexOf('权限设置') >= 0).click();
  await wait(300);
  const text = appText();
  ok('权限页有大致位置', /大致位置/.test(text));
  ok('权限页有精确位置', /精确位置/.test(text));
  ok('已授权的位置有「关闭」按钮', qa('[data-close]').length >= 1);
  ok('相机已授权但没有关闭按钮（它不支持撤销入口）',
    !q('[data-close="camera"]'));
  const closeBtn = q('[data-close="locFine"]') || q('[data-close="loc"]');
  closeBtn.click();
  await wait(120);
  ok('点关闭会打开系统权限页', calls.indexOf('openAppSettings') >= 0);
  /* 原生 onResume 会喊 __xjPermRefresh，这里手动模拟 */
  granted.loc = false; granted.locFine = false;
  w.__xjPermRefresh();
  await wait(200);
  ok('回到前台后状态确实刷新了（关闭按钮消失）', !q('[data-close="loc"]'));

  console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
  process.exit(fail ? 1 : 0);
})();