/* 信笺 · 视图：小家 / 设置 / 关于 / 权限 / 备份 / 赞助 / 日志

   这些页面都挂在「我」这一层，公用一套功能行样式。 */
'use strict';



  /* ================= 视图：小家（我页） ================= */
  VIEWS.me = function (el) {
    var p = Profile.get();
    el.innerHTML =
      '<div class="topbar"><div class="t-gap"></div>' +
      '<div class="t-title">小家</div>' +
      '<span class="theme-slot">' + ThemeReveal.buttonHtml() + '</span></div>' +
      '<div class="scroll">' +
      '<div class="me-hero" data-cover="' + (p.cover | 0) + '">' +
      '<div class="me-cover" data-act="cover"></div>' +
      '<div class="avatar" data-act="avatar">' +
      (p.nick ? esc(p.nick.slice(0, 1)) : svg('me')) + '</div>' +
      '<div class="me-name" data-act="avatar">' + esc(p.nick || '未命名') + '</div>' +
      '<div class="me-sub">' + esc(p.sid) + '</div>' +
      '</div>' +
      '<div class="rows">' +
      rowHtml('backup', 'download', '备份', '') +
      rowHtml('settings', 'gear', '设置', '') + '</div><div class="rows">' +
      rowHtml('about', 'info', '关于', '') +
      rowHtml('sponsor', 'cup', '赞助', '') +
      '</div>' +
      '</div>';

    var themeBtn = ThemeReveal.attach(el.querySelector('[data-theme-btn]'));
    el.__cleanup = function () {
      if (themeBtn) themeBtn.destroy();
      themeBtn = null;
    };

    el.addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]');
      if (!a) return;
      var act = a.dataset.act;

      if (act === 'settings') return Nav.go('settings');
      if (act === 'backup') return Nav.go('backup');
      if (act === 'about') return Nav.go('about');
      if (act === 'sponsor') return Nav.go('sponsor');
      if (act === 'avatar') {
        inputBox('昵称', Profile.get().nick, '例如：阿晚').then(function (v) {
          if (v === null) return;
          Profile.set('nick', v.slice(0, 12));
          Nav.render();
        });
        return;
      }
      if (act === 'cover') {
        sheet('背景板', [
          { label: '素白', value: 0 },
          { label: '柔光', value: 1 },
          { label: '斜纹', value: 2 },
          'sep',
          { label: '自定义图片（要接相册，暂未开放）', value: -1 }
        ]).then(function (v) {
          if (v === null || v === undefined) return;
          if (v === -1) return toast('自定义图片要等相册接入');
          Profile.set('cover', v);
          Nav.render();
        });
        return;
      }
    });
  };


  /* ================= 视图：设置 ================= */
  VIEWS.settings = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">设置</div><div class="t-gap"></div></div>' +
      '<div class="scroll set-body">' +
      '<div class="form"><div class="field"><label>动效</label>' +
      '<div class="chips anim-settings" id="animChips"></div></div></div>' +
      '<div class="rows">' +
      rowHtml('perm', null, '权限设置', '') +
      rowHtml('pigeonSet', null, '鸽屋设置', '') +
      rowHtml('update', null, '应用更新', '') +
      rowHtml('logs', null, '日志', '') +
      '</div>' +
      '</div>';

    /* 外观（主题）已经不在这里了：挪到主页天气条右侧和小家右上角（见 themereveal.js） */
    var animChips = el.querySelector('#animChips');
    function paintAnim() {
      /* 和新建页的胶囊同一个道理：只建一次，之后只切类。
         重建 innerHTML 会换掉刚点的那颗节点，观感就是「点了没反应」。 */
      if (!animChips.children.length) {
        animChips.innerHTML =
          '<button class="chip" data-anim="1">开启</button>' +
          '<button class="chip" data-anim="0">关闭</button>';
      }
      var on = Anim.enabled();
      Array.prototype.forEach.call(animChips.children, function (b) {
        b.classList.toggle('on', (b.dataset.anim === '1') === on);
      });
    }
    paintAnim();

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      var an = e.target.closest('[data-anim]');
      if (an) { Anim.setEnabled(an.dataset.anim === '1'); paintAnim(); return; }

      var a = e.target.closest('[data-act]');
      if (!a) return;
      var act = a.dataset.act;
      if (act === 'perm') return Nav.go('perm');
      if (act === 'update') return Nav.go('update');
      if (act === 'logs') return Nav.go('logs');
      if (act === 'pigeonSet') {
        return Nav.go('stub', { title: '鸽屋设置', text: '鸽屋设置还没做，先占位。' });
      }
    });
  };


  /* ================= 视图：关于（三级） ================= */
  VIEWS.about = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">关于</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="form">' +
      '<div class="field"><label>信笺</label>' +
      '<div class="set-note">' + (Bridge.isNative ? '版本 ' + esc(AppUpdate.status().current || '未知') : '浏览器演示模式') + '</div></div>' +
      '<div class="field"><label>鸽屋的使用边界</label>' +
      '<div class="set-note">只能在可信局域网里用（家里的 WiFi、或只有你自己连的手机热点）。<br>' +
      '当前版本不做身份校验，传输也是明文：同一个网络里的人可以冒充别人、可以抓包看内容。<br>' +
      '咖啡厅、学校、共享办公这类公共 WiFi 请不要开鸽屋。</div></div>' +
      '<div class="field"><label>图标</label>' +
      '<div class="set-note">Tabler Icons / Remix Icon</div></div>' +
      '<div class="field"><label>文档</label>' +
      '<div class="set-note">Python / HTML / CSS / Java / JSON / JavaScript / XML<br>输入实时彩色高亮，HTML 内嵌脚本与样式同步着色。<br>JavaScript 可离线运行，Python、Java、C、C++ 和 C# 可在线运行。</div></div>' +
      '</div></div>';

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
    });
  };

  /* ================= 视图：赞助（二级）/ 赞赏码（三级） =================
     两位开发者的收款码随 APK 打包；点整行看码，点 QQ 号才问要不要拉起 QQ。 */
  var SPONSOR_CODES = {
    huiqi: { name: '烩气', qq: '1924744295', image: 'sponsor/huiqi.webp' },
    zhangwanqiu: { name: '张晚秋', qq: '2729262309', image: 'sponsor/zhangwanqiu.webp' }
  };

  function sponsorRow(code, role, qq) {
    return '<button type="button" class="row sponsor-row" data-code="' + code + '">' +
      '<span class="row-t">' +
      '<span class="sponsor-role">' + esc(role) + '</span>' +
      '<span class="sponsor-meta">QQ：<span class="sponsor-qq" data-qq="' + qq + '">' + qq +
      '</span>　（赞助他！）</span></span>' +
      '<span class="row-arrow">' + svg('chevron') + '</span></button>';
  }

  function askQQ(qq) {
    sheet('打开 QQ', [
      { title: '是否立即打开 QQ 联系 ' + qq + '？' },
      { label: '同意', value: true },
      'sep',
      { label: '拒绝', value: false }
    ]).then(function (ok) {
      if (ok !== true) return;
      if (!Bridge.openQQ(qq)) toast('当前环境无法打开 QQ');
    });
  }

  VIEWS.sponsor = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">赞助</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="form sponsor-form">' +
      '<p class="sponsor-intro">感谢您赞助支持我们的独立产品，希望它给您带来新的体验！</p>' +
      '<div class="field"><label>开发者名单</label>' +
      '<div class="rows sponsor-list">' +
      sponsorRow('huiqi', '技术支持：烩气', '1924744295') +
      sponsorRow('zhangwanqiu', '产品构建及主持：张晚秋', '2729262309') +
      '</div></div>' +
      '</div></div>';

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      var qq = e.target.closest('[data-qq]');
      if (qq) {
        e.preventDefault();
        askQQ(qq.dataset.qq);
        return;
      }
      var row = e.target.closest('[data-code]');
      if (row) return Nav.go('sponsorCode', { code: row.dataset.code });
    });
  };

  VIEWS.sponsorCode = function (el, p) {
    var person = SPONSOR_CODES[p.code] || SPONSOR_CODES.huiqi;
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">' + esc(person.name) + ' 的赞赏码</div><div class="t-gap"></div></div>' +
      '<div class="scroll sponsor-code-page">' +
      '<img class="sponsor-code" src="' + person.image + '" alt="' + esc(person.name) + ' 的赞赏码">' +
      '<p class="sponsor-hint">长按图片保存</p>' +
      '</div>';

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
    });
  };


  VIEWS.update = function (el) {
    el.innerHTML =
      '<div class="topbar"><button type="button" class="icon-btn" data-act="back" aria-label="返回">' + svg('back') + '</button>' +
      '<div class="t-title">应用更新</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="form">' +
      '<div class="field"><label>当前版本</label><div data-update-current></div></div>' +
      '<div class="field"><div class="update-status" data-update-status role="status"></div>' +
      '<progress data-update-progress max="100" aria-label="下载进度" hidden></progress></div>' +
      '<div class="chips update-actions"><button type="button" class="chip" data-act="check">检查更新</button>' +
      '<button type="button" class="chip on" data-act="apply" hidden></button></div>' +
      '</div></div>';

    var current = el.querySelector('[data-update-current]');
    var message = el.querySelector('[data-update-status]');
    var progress = el.querySelector('[data-update-progress]');
    var check = el.querySelector('[data-act=check]');
    var apply = el.querySelector('[data-act=apply]');
    el.__cleanup = AppUpdate.watch(function (status) {
      current.textContent = status.current || '—';
      var labels = {
        idle: '启动时自动检查更新', demo: '请在 Android 应用中检查更新', checking: '正在检查更新…',
        current: '已是最新版本', available: '发现新版本 ' + status.latest,
        downloading: '正在下载 ' + status.latest, ready: status.latest + ' 已下载，可以安装',
        verifying: '正在校验安装包…', checkError: '检查更新失败', downloadError: '下载失败'
      };
      var description = status.message || labels[status.state] || '';
      if (message.textContent !== description) message.textContent = description;
      progress.hidden = status.state !== 'downloading';
      progress.value = status.percent;
      check.hidden = status.state === 'demo';
      check.disabled = ['checking', 'downloading', 'verifying'].indexOf(status.state) !== -1;
      apply.hidden = ['ready', 'available', 'downloadError'].indexOf(status.state) === -1;
      apply.textContent = status.state === 'ready' ? '安装更新' : status.state === 'downloadError' ? '重新下载' : '下载更新';
    });
    el.addEventListener('click', function (e) {
      var action = e.target.closest('[data-act]');
      if (!action) return;
      if (action.dataset.act === 'back') return Nav.back(false);
      if (action === check) AppUpdate.check();
      if (action === apply) AppUpdate.act();
    });
  };


  /* ================= 视图：权限设置（三级） ================= */
  VIEWS.perm = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">权限设置</div><div class="t-gap"></div></div>' +
      '<div class="scroll" id="permList"><div class="empty"><p>读取中…</p></div></div>';

    var listEl = el.querySelector('#permList');

    function render() {
      Bridge.permStatus().then(function (st) {
        var items = (st && st.items) ? st.items.slice() : [];
        /* 安装未知应用不是运行时权限，系统只给「按应用开关」，单独补一行 */
        if (st && st.sdk >= 26) {
          var install = Bridge.installStatus();
          if (install !== null) items.push({
            key: 'install', label: '安装未知应用',
            note: '应用内更新安装 APK 时需要手动允许，安装完成后可以再关掉。',
            granted: install, canAsk: true, revocable: true
          });
        }
        if (!items.length) {
          listEl.innerHTML = '<div class="empty"><p>' +
            (st && st.demo ? '演示模式读不到系统权限' : '拿不到权限状态') + '</p></div>';
          return;
        }
        var h = '<div class="rows">';
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          h += '<div class="row perm-row">' +
            '<span class="row-t">' +
            '<span class="perm-name">' + esc(it.label) + '</span>' +
            '<span class="perm-note">' + esc(it.note) + '</span>' +
            '<span class="perm-state' + (it.granted ? ' on' : '') + '">' +
            (it.granted ? '已授权' : '未授权') + '</span>' +
            '</span>' +
            (!it.granted && it.canAsk
              ? '<button class="chip" data-ask="' + esc(it.key) + '">申请</button>'
              : (it.granted && it.revocable
                ? '<button class="chip off" data-close="' + esc(it.key) + '">关闭</button>'
                : '')) +
            '</div>';
        }
        listEl.innerHTML = h + '</div>' +
          '<div class="set-note" style="padding:.5rem 1.25rem 1.5rem">' +
          '不授权也不影响用：相册和文件走系统选择器，不需要存储权限。' +
          '「关闭」会跳到系统的本应用权限页或安装设置——' +
          '系统不允许应用自己撤销已给的权限，只能由你在那里点掉。</div>';
      });
    }

    /* 原生申请完会回调这个，重读一次状态 */
    window.__xjPerm = function (key, ok) {
      toast(ok ? '已授权' : '未授权');
      render();
    };
    /* 从系统权限页返回时原生会喊一声，这里同步刷新真实状态 */
    window.__xjPermRefresh = function () { render(); };
    el.__cleanup = function () {
      window.__xjPerm = null;
      window.__xjPermRefresh = null;
    };

    render();

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      var b = e.target.closest('[data-ask]');
      if (b) {
        if (b.dataset.ask === 'install') return Bridge.openInstallSettings();
        Bridge.askPerm(b.dataset.ask);
        return;
      }
      var c = e.target.closest('[data-close]');
      if (c) {
        /* 真实撤销只能在系统页面完成，我们只负责把你送过去，回来自动刷新 */
        if (c.dataset.close === 'install') return Bridge.openInstallSettings();
        if (!Bridge.openAppSettings()) return toast('演示模式打不开系统设置');
        toast('在系统页面里关掉这个权限');
      }
    });
  };


  /* ================= 视图：日志（三级）/ 日志详情（四级） ================= */

  function logModeRow() {
    return '<button type="button" class="row log-mode-row" data-act="logMode">' +
      '<span class="row-t">当前模式</span>' +
      '<span class="row-v" data-log-mode-label>' + esc(Logs.label(Logs.mode())) + '</span>' +
      '<span class="row-arrow">' + svg('chevron') + '</span></button>';
  }

  function paintLogMode() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-log-mode-label]'), function (node) {
      node.textContent = Logs.label(Logs.mode());
    });
  }

  function applyLogMode(value) {
    Logs.setMode(value);
    paintLogMode();
    toast('已切换为' + Logs.label(value));
  }

  function chooseLogMode() {
    var current = Logs.mode();
    sheet('记录行为', [
      { label: '完整记录', value: 'full' },
      { label: '仅记录错误', value: 'error' },
      { label: '完全不记录', value: 'off' }
    ]).then(function (value) {
      if (!value || value === current) return;
      if (value === 'full') {
        return confirmBox('完整记录会记录页面切换、点击等行为；在低端机上可能拖慢运行速度，也会暴露应用隐私。确认选择吗？', '确认')
          .then(function (ok) { if (ok) applyLogMode('full'); });
      }
      if (value === 'off') {
        return confirmBox('完全不记录后，应用不会记录任何行为，包括报错。遇到问题可能无法向开发者求助。确认选择吗？', '确认')
          .then(function (ok) { if (ok) applyLogMode('off'); });
      }
      applyLogMode('error');
    });
  }

  function logPathLabel(path) {
    return String(path || '').replace(/^\/storage\/emulated\/0/, '/0');
  }

  VIEWS.logs = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">日志</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="form">' +
      '<div class="field"><label>记录行为</label>' + logModeRow() +
      '<div class="set-note" data-log-path>读取中…</div>' +
      '<div class="chips"><button type="button" class="chip" data-act="logStorage" hidden>授权写入 /0/xinjian/wrong</button></div>' +
      '</div>' +
      '<div class="field"><label>日志文件</label>' +
      '<div class="rows" data-log-list><div class="empty"><p>读取中…</p></div></div>' +
      '</div></div></div>';

    var path = el.querySelector('[data-log-path]');
    var storage = el.querySelector('[data-act=logStorage]');
    var listEl = el.querySelector('[data-log-list]');

    function renderPath() {
      Logs.state().then(function (state) {
        var note = '';
        if (!state.demo && !state.public) {
          note = state.sdk === 29 ? '（Android 10 无法授权公共目录，暂存应用私有目录）' : '（公共目录未授权，暂存应用私有目录）';
        }
        path.textContent = '位置：' + logPathLabel(state.path) + note;
        var locked = state.demo || state.public || state.sdk === 29;
        storage.hidden = locked;
        storage.style.display = locked ? 'none' : '';
      });
    }

    function renderList() {
      Logs.list().then(function (list) {
        if (!list.length) {
          listEl.innerHTML = '<div class="empty"><p>还没有日志</p></div>';
          return;
        }
        listEl.innerHTML = list.map(function (item) {
          return '<button type="button" class="row log-row" data-log="' + esc(item.name) + '">' +
            '<span class="row-t"><span class="log-name">' + esc(item.name) + '</span>' +
            '<span class="log-meta">' + fmtSize(item.size) + ' · ' + fmtTime(item.mtime) + '</span></span>' +
            '<span class="row-arrow">' + svg('chevron') + '</span></button>';
        }).join('');
      });
    }

    function render() { renderPath(); renderList(); }

    function visible() { if (!document.hidden) render(); }

    render();
    document.addEventListener('visibilitychange', visible);
    el.__cleanup = function () { document.removeEventListener('visibilitychange', visible); };

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=logMode]')) return chooseLogMode();
      if (e.target.closest('[data-act=logStorage]')) {
        if (!Logs.requestStorage()) toast('当前系统不支持自动授权，请到系统设置里开启');
        else toast('授权后返回这里，路径会自动更新');
        return;
      }
      var row = e.target.closest('[data-log]');
      if (row) return Nav.go('logDetail', { name: row.dataset.log });
    });
  };

  VIEWS.logDetail = function (el, p) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">日志</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="form">' +
      '<div class="field"><label>记录行为</label>' + logModeRow() + '</div>' +
      '<div class="field"><label>日志内容</label>' +
      '<pre class="log-detail" data-log-body>读取中…</pre></div>' +
      '<div class="chips"><button type="button" class="chip off" data-act="logDelete">删除这条日志</button></div>' +
      '</div></div>';

    var body = el.querySelector('[data-log-body]');
    Logs.read(p.name).then(function (text) { body.textContent = text || '（空日志）'; });

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=logMode]')) return chooseLogMode();
      if (e.target.closest('[data-act=logDelete]')) {
        confirmBox('删除这条日志？', '删除').then(function (ok) {
          if (!ok) return;
          Logs.remove(p.name).then(function (ok) {
            if (ok === false) return toast('删除失败');
            toast('已删除');
            Nav.back(false);
          });
        });
      }
    });
  };


  /* ================= 视图：备份（二级） ================= */
  VIEWS.backup = function (el) {
    el.innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
      '<div class="t-title">备份</div><div class="t-gap"></div></div>' +
      '<div class="scroll"><div class="form">' +
      '<div class="field"><label>书架</label>' +
      '<div class="chips"><button class="chip" data-act="exportAll">导出全部备份</button></div>' +
      '</div>' +
      '<div class="field"><label>鸽屋</label>' +
      '<div class="chips"><button class="chip" data-act="pigeonBackup">备份聊天记录</button></div>' +
      '</div>' +
      '<div class="field"><label>数据位置</label>' +
      '<div class="set-note">书架和鸽屋都在本机私有目录，卸载应用会一起删除。</div>' +
      '</div>' +
      '</div></div>';

    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-act=back]')) return Nav.back(false);
      if (e.target.closest('[data-act=exportAll]')) return exportAll();
      if (e.target.closest('[data-act=pigeonBackup]')) return toast('导出到自定义文件夹要等原生接入选目录');
    });
  };
