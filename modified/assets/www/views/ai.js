/* 信笺 · AI 模型配置（四级） */
'use strict';

VIEWS.aiConfig = function (el) {
  el.innerHTML =
    '<div class="topbar"><button class="icon-btn" data-act="back">' + svg('back') + '</button>' +
    '<div class="t-title">模型与参数配置</div><div class="t-gap"></div></div>' +
    '<div class="scroll"><div class="ai-page">' +
    '<div class="rows">' +
    '<button type="button" class="row" data-act="configs"><span class="row-t">模型配置</span>' +
    '<span class="row-v" data-ai-config-name></span><span class="row-arrow">' + svg('chevron') + '</span></button>' +
    '<button type="button" class="row" data-act="newConfig"><span class="row-t">新建配置</span>' +
    '<span class="row-arrow">' + svg('chevron') + '</span></button>' +
    '</div>' +
    '<div class="field"><label>API 提供商</label>' +
    '<button type="button" class="row ai-provider-row" data-act="provider">' +
    '<span class="row-t" data-ai-provider>Deepseek 大模型</span>' +
    '<span class="row-arrow">' + svg('chevron') + '</span></button></div>' +
    '<div class="field"><label>API 端点</label>' +
    '<input type="text" id="aiEndpoint" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="https://…/v1/chat/completions"></div>' +
    '<div class="field"><label>API 密钥</label>' +
    '<input type="password" id="aiKey" spellcheck="false" autocapitalize="off" autocomplete="new-password" placeholder="输入 API 密钥"></div>' +
    '<div class="field"><label>模型名称</label>' +
    '<input type="text" id="aiModel" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="例如 deepseek-chat"></div>' +
    '<div class="rows">' +
    '<button type="button" class="row" data-act="vision"><span class="row-t">模型支持识图</span>' +
    '<span class="row-v" data-ai-vision></span><span class="row-arrow">' + svg('chevron') + '</span></button>' +
    '</div>' +
    '<div class="chips"><button type="button" class="chip" data-act="test">测试连接</button></div>' +
    '<div class="set-note" data-ai-status>密钥只保存在本机。</div>' +
    '</div></div>';

  var nameEl = el.querySelector('[data-ai-config-name]');
  var providerEl = el.querySelector('[data-ai-provider]');
  var endpoint = el.querySelector('#aiEndpoint');
  var key = el.querySelector('#aiKey');
  var model = el.querySelector('#aiModel');
  var visionEl = el.querySelector('[data-ai-vision]');
  var status = el.querySelector('[data-ai-status]');

  function paint() {
    var cfg = AI.active();
    var provider = AI.provider(cfg.provider);
    nameEl.textContent = cfg.name || '未命名';
    providerEl.textContent = provider.name;
    endpoint.value = cfg.endpoint || '';
    key.value = cfg.key || '';
    model.value = cfg.model || '';
    visionEl.textContent = cfg.vision ? '开启' : '关闭';
  }

  function save(field, value) {
    var patch = {};
    patch[field] = value;
    AI.update(patch);
    paint();
  }

  function pickConfig() {
    var items = AI.configs().map(function (cfg) {
      return { label: cfg.name || '未命名', value: cfg.id };
    });
    items.push('sep', { label: '新建配置', value: 'new' });
    sheet('选择模型配置', items).then(function (value) {
      if (!value) return;
      if (value === 'new') return createConfig();
      AI.select(value);
      paint();
    });
  }

  function createConfig() {
    inputBox('新建配置', '', '例如：日常对话').then(function (name) {
      if (name === null) return;
      AI.create(name || '新配置');
      paint();
    });
  }

  function pickProvider() {
    var mask = document.createElement('div');
    mask.className = 'mask';
    mask.innerHTML =
      '<div class="sheet ai-picker" role="dialog" aria-modal="true" aria-label="选择 API 提供商">' +
      '<div class="sheet-grab" aria-hidden="true"></div>' +
      '<div class="sheet-title">选择 API 提供商</div>' +
      '<div class="ai-search"><input type="text" placeholder="搜索提供商" aria-label="搜索提供商"></div>' +
      '<div class="ai-provider-list"></div>' +
      '<button type="button" class="sheet-item" data-close style="justify-content:center">取消</button></div>';
    document.body.appendChild(mask);
    var input = mask.querySelector('input');
    var list = mask.querySelector('.ai-provider-list');
    var layer = null, settled = false;

    function close() {
      if (settled) return;
      settled = true;
      mask.remove();
      if (layer) Back.done(layer);
    }

    function paintProviders() {
      var term = input.value.trim().toLowerCase();
      var group = '';
      var html = '';
      AI.providers().forEach(function (provider) {
        if (term && provider.name.toLowerCase().indexOf(term) < 0 && provider.id.indexOf(term) < 0) return;
        if (provider.group !== group) {
          group = provider.group;
          html += '<div class="ai-provider-group">' + esc(group) + '</div>';
        }
        html += '<button type="button" class="ai-provider' +
          (AI.active().provider === provider.id ? ' on' : '') +
          '" data-provider="' + provider.id + '"><span>' + esc(provider.name) + '</span>' +
          (provider.model ? '<small>' + esc(provider.model) + '</small>' : '') + '</button>';
      });
      list.innerHTML = html || '<div class="empty"><p>没有匹配的提供商</p></div>';
    }

    layer = Back.open(close);
    input.addEventListener('input', paintProviders);
    mask.addEventListener('click', function (event) {
      if (event.target === mask) return close();
      if (event.target.closest('[data-close]')) return close();
      var button = event.target.closest('[data-provider]');
      if (!button) return;
      var provider = AI.provider(button.dataset.provider);
      AI.update({ provider: provider.id, endpoint: provider.endpoint, model: provider.model });
      close();
      paint();
    });
    paintProviders();
    setTimeout(function () { input.focus(); }, 50);
  }

  paint();

  el.addEventListener('click', function (event) {
    if (event.target.closest('[data-act=back]')) return Nav.back(false);
    if (event.target.closest('[data-act=configs]')) return pickConfig();
    if (event.target.closest('[data-act=newConfig]')) return createConfig();
    if (event.target.closest('[data-act=provider]')) return pickProvider();
    if (event.target.closest('[data-act=vision]')) {
      save('vision', !AI.active().vision);
      return;
    }
    if (event.target.closest('[data-act=test]')) {
      var config = AI.active();
      status.textContent = '正在测试连接…';
      AI.test(config).then(function (text) {
        status.textContent = '连接成功：' + String(text).slice(0, 80);
      }, function (error) {
        status.textContent = '连接失败：' + (error && error.message ? error.message : '未知错误');
      });
    }
  });

  endpoint.addEventListener('change', function () { save('endpoint', endpoint.value.trim()); });
  key.addEventListener('change', function () { save('key', key.value.trim()); });
  model.addEventListener('change', function () { save('model', model.value.trim()); });
  endpoint.addEventListener('blur', function () { save('endpoint', endpoint.value.trim()); });
  key.addEventListener('blur', function () { save('key', key.value.trim()); });
  model.addEventListener('blur', function () { save('model', model.value.trim()); });
};
