import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core';
import variant from '@jitl/quickjs-singlefile-browser-release-sync';

self.onmessage = async ({ data }) => {
  self.onmessage = null;
  const send = (kind, props = {}) => self.postMessage({ kind, ...props });
  const done = (ok, error) => {
    if (error) send('stderr', { text: String(error.message || error).slice(0, 4000) + '\n' });
    send('exit', { ok });
    self.close();
  };
  try {
    const engine = await newQuickJSWASMModuleFromVariant(variant);
    const vm = engine.newContext();
    vm.runtime.setMemoryLimit(16 * 1024 * 1024);
    vm.runtime.setMaxStackSize(512 * 1024);
    let remainingTime = 3000;
    let deadline;
    let pending;
    let inputId = 0;
    let evaluated;
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
        send(level === 'error' ? 'stderr' : 'stdout', { text: clipped + '\n' });
        if (remaining <= 0 || lines === 300) send('stdout', { text: '（已达到输出上限）\n' });
      });
      vm.setProp(consoleObject, level, print);
      print.dispose();
    }
    vm.setProp(vm.global, 'console', consoleObject);
    consoleObject.dispose();

    const read = vm.newFunction('readline', prompt => {
      if (pending) throw new Error('请等待上一条输入完成');
      const text = prompt ? vm.getString(prompt).slice(0, 300) : '';
      pending = vm.newPromise();
      send('input', { id: ++inputId, prompt: text });
      return pending.handle;
    });
    vm.setProp(vm.global, 'readline', read);
    read.dispose();

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

    function step(run) {
      deadline = Date.now() + remainingTime;
      run();
      const jobs = vm.runtime.executePendingJobs();
      if (jobs.error) report(jobs.error);
      if (Date.now() >= deadline) throw new Error('运行超时（3 秒）');
      remainingTime = deadline - Date.now();
      if (pending) return;
      const state = vm.getPromiseState(evaluated);
      if (state.type === 'rejected') report(state.error);
      if (state.type === 'fulfilled' && !state.notAPromise) state.value.dispose();
      evaluated.dispose();
      done(true);
    }

    self.onmessage = ({ data: input }) => {
      if (!pending || !input || input.kind !== 'stdin' || input.id !== inputId ||
          (input.text !== null && (typeof input.text !== 'string' || input.text.length > 65536))) return;
      try {
        step(() => {
          const request = pending;
          pending = null;
          const value = input.text === null ? vm.null : vm.newString(input.text);
          try { request.resolve(value); }
          finally { if (input.text !== null) value.dispose(); }
        });
      } catch (error) { done(false, error); }
    };
    send('ready');
    step(() => {
      const result = vm.evalCode(code, data.name, { type: /\.mjs$/i.test(data.name) ? 'module' : 'global' });
      if (result.error) report(result.error);
      evaluated = result.value;
    });
  } catch (error) {
    done(false, error);
  }
};
