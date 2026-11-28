/* 信笺 · AI（OpenAI 兼容接口） */
var AI = (function () {
  'use strict';

  var KEY = 'xj:ai:v1';
  var SYSTEM = '你是 FUO，一个住在信笺里的朋友。请用自然、简洁的中文回复。';
  var PROVIDERS = [
    { group: '通用兼容', id: 'openai', name: 'OpenAI 通用', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
    { group: '通用兼容', id: 'openai-responses', name: 'OpenAI Responses 通用', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
    { group: '通用兼容', id: 'gemini', name: 'Gemini 通用', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.0-flash' },
    { group: '通用兼容', id: 'anthropic', name: 'Anthropic 通用', endpoint: '', model: 'claude-3-5-sonnet-latest' },

    { group: '专有供应商', id: 'chatgpt', name: 'ChatGPT API', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o' },
    { group: '专有供应商', id: 'grok', name: 'SpaceXAI (Grok)', endpoint: 'https://api.x.ai/v1/chat/completions', model: 'grok-2-latest' },
    { group: '专有供应商', id: 'claude', name: 'Anthropic (Claude 系列)', endpoint: '', model: 'claude-3-5-sonnet-latest' },
    { group: '专有供应商', id: 'google-gemini', name: 'Google (Gemini 系列)', endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemini-2.0-flash' },
    { group: '专有供应商', id: 'baidu', name: '百度 (文心一言系列)', endpoint: 'https://qianfan.baidubce.com/v2/chat/completions', model: 'ernie-4.0-8k' },
    { group: '专有供应商', id: 'aliyun', name: '阿里云 (通义千问系列)', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus' },
    { group: '专有供应商', id: 'xunfei', name: '讯飞 (星火认知系列)', endpoint: 'https://spark-api-open.xf-yun.com/v1/chat/completions', model: 'generalv3.5' },
    { group: '专有供应商', id: 'zhipu', name: '智谱 AI (ChatGLM 系列)', endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', model: 'glm-4-flash' },
    { group: '专有供应商', id: 'baichuan', name: '百川大模型', endpoint: 'https://api.baichuan-ai.com/v1/chat/completions', model: 'Baichuan4' },
    { group: '专有供应商', id: 'moonshot', name: '月之暗面大模型', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: 'moonshot-v1-8k' },
    { group: '专有供应商', id: 'xiaomi', name: 'Xiaomi MiMo', endpoint: '', model: '' },
    { group: '专有供应商', id: 'deepseek', name: 'Deepseek 大模型', endpoint: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
    { group: '专有供应商', id: 'mistral', name: 'Mistral AI (Codestral)', endpoint: 'https://api.mistral.ai/v1/chat/completions', model: 'mistral-large-latest' },
    { group: '专有供应商', id: 'siliconflow', name: '硅基流动', endpoint: 'https://api.siliconflow.cn/v1/chat/completions', model: 'Qwen/Qwen2.5-7B-Instruct' },
    { group: '专有供应商', id: 'iflow', name: 'iFlow', endpoint: '', model: '' },
    { group: '专有供应商', id: 'openrouter', name: 'OpenRouter (多模型聚合)', endpoint: 'https://openrouter.ai/api/v1/chat/completions', model: 'openai/gpt-4o-mini' },
    { group: '专有供应商', id: 'opencode', name: 'OpenCode', endpoint: '', model: '' },
    { group: '专有供应商', id: '4router', name: '4Router', endpoint: '', model: '' },
    { group: '专有供应商', id: 'nous', name: 'Nous Portal', endpoint: '', model: '' },
    { group: '专有供应商', id: 'wuwen', name: '无问芯穹', endpoint: '', model: '' },
    { group: '专有供应商', id: 'alipay', name: '支付宝百灵大模型', endpoint: '', model: '' },
    { group: '专有供应商', id: 'doubao', name: '豆包 (火山模型)', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', model: 'doubao-pro-32k' },
    { group: '专有供应商', id: 'nvidia', name: 'NVIDIA (API Catalog)', endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions', model: 'meta/llama-3.1-70b-instruct' },
    { group: '专有供应商', id: 'ppio', name: '派欧云', endpoint: '', model: '' },
    { group: '专有供应商', id: 'novita', name: 'Novita AI', endpoint: 'https://api.novita.ai/v3/openai/chat/completions', model: '' },
    { group: '专有供应商', id: 'minimax', name: 'MiniMax', endpoint: 'https://api.minimax.chat/v1/text/chatcompletion_v2', model: 'abab6.5s-chat' },

    { group: '本地 / 兼容', id: 'lmstudio', name: 'LM Studio (本地模型)', endpoint: 'http://127.0.0.1:1234/v1/chat/completions', model: 'local-model' },
    { group: '本地 / 兼容', id: 'ollama', name: 'Ollama (本地模型)', endpoint: 'http://127.0.0.1:11434/v1/chat/completions', model: 'llama3.1' },
    { group: '本地 / 兼容', id: 'openai-compatible', name: 'OpenAI 兼容 (本地模型)', endpoint: '', model: '' },
    { group: '本地 / 兼容', id: 'mnn', name: 'MNN 本地推理', endpoint: '', model: '' },
    { group: '本地 / 兼容', id: 'llamacpp', name: 'llama.cpp 本地推理', endpoint: 'http://127.0.0.1:8080/v1/chat/completions', model: 'local-model' },
    { group: '本地 / 兼容', id: 'other', name: '其他供应商', endpoint: '', model: '' }
  ];

  var pending = Object.create(null);
  var data = load();

  function defaults() {
    return {
      active: 'default',
      list: {
        default: {
          id: 'default', name: '默认配置', provider: 'deepseek',
          endpoint: 'https://api.deepseek.com/v1/chat/completions',
          key: '', model: 'deepseek-chat', vision: false
        }
      }
    };
  }

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && raw.list && raw.list[raw.active]) return raw;
    } catch (e) {}
    var fresh = defaults();
    try { localStorage.setItem(KEY, JSON.stringify(fresh)); } catch (e) {}
    return fresh;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function provider(id) {
    for (var i = 0; i < PROVIDERS.length; i++) if (PROVIDERS[i].id === id) return PROVIDERS[i];
    return PROVIDERS[0];
  }

  function active() {
    return data.list[data.active] || data.list.default;
  }

  function configure(value) { return !!(value && value.endpoint && value.key && value.model); }

  function update(patch) {
    var current = active();
    for (var key in patch) if (patch.hasOwnProperty(key)) current[key] = patch[key];
    save();
    return current;
  }

  function select(id) {
    if (!data.list[id]) return false;
    data.active = id;
    save();
    return true;
  }

  function create(name) {
    var id = 'cfg' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var base = provider('deepseek');
    data.list[id] = {
      id: id, name: name || '新配置', provider: base.id,
      endpoint: base.endpoint, key: '', model: base.model, vision: false
    };
    data.active = id;
    save();
    return data.list[id];
  }

  function errorText(data) {
    var text = String(data.body || '');
    try {
      var parsed = JSON.parse(text);
      if (parsed.error && parsed.error.message) return parsed.error.message;
      if (parsed.message) return parsed.message;
    } catch (e) {}
    if (data.error) return data.error;
    return 'HTTP ' + (data.status || 0) + (text ? '：' + text.slice(0, 180) : '');
  }

  function request(payload, config) {
    return new Promise(function (resolve, reject) {
      if (!configure(config)) return reject(new Error('请先填写 API 端点、密钥和模型名称'));
      var id = 'ai' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.key };
      var body = JSON.stringify(payload);
      var timer = setTimeout(function () {
        delete pending[id];
        reject(new Error('请求超时'));
      }, 70000);
      pending[id] = function (result) {
        clearTimeout(timer);
        delete pending[id];
        if (result && result.ok) resolve(result.body);
        else reject(new Error(errorText(result || {})));
      };
      try {
        if (Bridge.aiRequest && Bridge.aiRequest(id, config.endpoint, JSON.stringify(headers), body)) return;
      } catch (e) {}
      clearTimeout(timer);
      delete pending[id];
      fetch(config.endpoint, { method: 'POST', headers: headers, body: body }).then(function (response) {
        return response.text().then(function (text) {
          if (!response.ok) throw new Error('HTTP ' + response.status + '：' + text.slice(0, 180));
          resolve(text);
        });
      }).catch(function (error) { reject(error); });
    });
  }

  function contentOf(body) {
    var data = JSON.parse(body);
    var choice = data.choices && data.choices[0];
    var message = choice && (choice.message || choice.delta);
    var content = message && message.content;
    if (Array.isArray(content)) {
      content = content.map(function (part) { return part && part.text ? part.text : ''; }).join('');
    }
    if (!content && typeof data.output_text === 'string') content = data.output_text;
    if (!content) throw new Error('模型没有返回文本');
    return String(content);
  }

  function chat(messages, config, extra) {
    var payload = {
      model: config.model, messages: messages, stream: false,
      temperature: extra && typeof extra.temperature === 'number' ? extra.temperature : 0.8
    };
    if (extra && extra.max_tokens) payload.max_tokens = extra.max_tokens;
    return request(payload, config).then(contentOf);
  }

  function imagePart(name) {
    return fetch('/media/' + encodeURIComponent(name)).then(function (response) {
      if (!response.ok) return null;
      return response.blob().then(function (blob) {
        return new Promise(function (resolve) {
          var reader = new FileReader();
          reader.onload = function () {
            resolve({ type: 'image_url', image_url: { url: String(reader.result) } });
          };
          reader.onerror = function () { resolve(null); };
          reader.readAsDataURL(blob);
        });
      });
    }).catch(function () { return null; });
  }

  function reply(messages, config) {
    var history = messages.slice(-20);
    return Promise.all(history.map(function (message) {
      var role = message.dir === 'out' ? 'user' : 'assistant';
      if (message.kind === 'image') {
        if (!config.vision) return null;
        return imagePart(message.name).then(function (part) {
          return part ? { role: role, content: [part] } : null;
        });
      }
      if (!message.text) return null;
      return { role: role, content: message.text };
    })).then(function (list) {
      var api = [{ role: 'system', content: SYSTEM }].concat(list.filter(Boolean));
      return chat(api, config);
    });
  }

  function test(config) {
    return chat([{ role: 'user', content: 'ping' }], config, { max_tokens: 8, temperature: 0 });
  }

  window.__xjAi = function (raw) {
    var result;
    try { result = JSON.parse(raw); } catch (e) { return; }
    var handler = result && pending[result.id];
    if (handler) handler(result);
  };

  return {
    providers: function () { return PROVIDERS.slice(); },
    provider: provider,
    active: active,
    configs: function () {
      return Object.keys(data.list).map(function (id) { return data.list[id]; });
    },
    select: select,
    create: create,
    update: update,
    configure: configure,
    reply: reply,
    chat: chat,
    test: test,
    system: SYSTEM
  };
})();
