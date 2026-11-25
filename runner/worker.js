import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core';
import variant from '@jitl/quickjs-singlefile-browser-release-sync';

self.onmessage = async ({ data }) => {
  try {
    const engine = await newQuickJSWASMModuleFromVariant(variant);
    const vm = engine.newContext();
    vm.runtime.setMemoryLimit(16 * 1024 * 1024);
    vm.runtime.setMaxStackSize(512 * 1024);
    const deadline = Date.now() + 3000;
    vm.runtime.setInterruptHandler(() => Date.now() >= deadline);
    let lines = 0;
    let remaining = 32000;
    const consoleObject = vm.newObject();
    for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
      const print = vm.newFunction(level, (...args) => {
        if (remaining <= 0 || lines >= 300) return;
        const parts = args.map(arg => {
          const value = vm.dump(arg);
          if (typeof value !== 'object' || value === null) return String(value);
          return JSON.stringify(value);
        });
        const prefix = { warn: '警告：', error: '错误：' }[level] || '';
        const line = prefix + parts.join(' ');
        const clipped = line.slice(0, remaining);
        remaining -= clipped.length + 1;
        lines++;
        self.postMessage({ line: clipped });
        if (remaining <= 0 || lines === 300) self.postMessage({ line: '（已达到输出上限）' });
      });
      vm.setProp(consoleObject, level, print);
      print.dispose();
    }
    vm.setProp(vm.global, 'console', consoleObject);
    consoleObject.dispose();

    function report(error) {
      const detail = vm.dump(error);
      error.dispose();
      if (Date.now() >= deadline) throw new Error('运行超时（3 秒）');
      const message = detail && detail.message
        ? (detail.name || 'Error') + ': ' + detail.message + '\n' + (detail.stack || '')
        : String(detail);
      throw new Error(message.slice(0, 4000));
    }
    const commonJS = /\.cjs$/i.test(data.name);
    const code = commonJS ? '(function(){var module={exports:{}}; (function(module,exports){' + data.source + '\n}).call(module.exports,module,module.exports)})()' : data.source;
    const result = vm.evalCode(code, data.name, { type: /\.mjs$/i.test(data.name) ? 'module' : 'global' });
    if (result.error) report(result.error);
    result.value.dispose();
    const jobs = vm.runtime.executePendingJobs();
    if (jobs.error) report(jobs.error);
    self.postMessage({ status: '运行完成' });
  } catch (error) {
    self.postMessage({ status: '运行出错', line: String(error.message || error).slice(0, 4000) });
  }
  self.close();
};
