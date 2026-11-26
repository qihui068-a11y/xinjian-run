'use strict';

const sharedInput = self.crossOriginIsolated === true && typeof SharedArrayBuffer === 'function' &&
  typeof Atomics.wait === 'function' && typeof Atomics.notify === 'function';
const promiseInput = typeof WebAssembly.Suspending === 'function' && typeof WebAssembly.promising === 'function';
self.postMessage({ kind: 'input-capabilities', shared: sharedInput });

self.onmessage = async ({ data: job }) => {
  self.onmessage = null;
  const emit = (kind, fields = {}, transfers = []) => self.postMessage({ kind, ...fields }, transfers);
  const fileLimit = 4 * 1024 * 1024;
  let remaining = 65536;
  let records = 0;
  function log(kind, text) {
    if (remaining <= 0 || records >= 599) return;
    const clipped = text.slice(0, remaining);
    records++;
    remaining -= clipped.length;
    emit(kind, { text: clipped });
    if (remaining <= 0 || records === 599) emit('stderr', { text: '\n（输出已截断）' });
  }

  function stream(kind) {
    const decoder = new TextDecoder();
    return { write(bytes) {
      const text = decoder.decode(bytes, { stream: true });
      if (text) log(kind, text);
      return bytes.length;
    }};
  }

  try {
    // Python's js module receives no browser globals. The worker's response CSP also restricts network and script loads.
    const indexURL = new URL('python-runtime/', self.location.href).href;
    importScripts(indexURL + 'pyodide.js');
    const py = await loadPyodide({ indexURL, jsglobals: Object.create(null),
      stdout: line => log('stdout', line + '\n'), stderr: line => log('stderr', line + '\n') });
    py.setStdout(stream('stdout'));
    py.setStderr(stream('stderr'));
    const stdin = job.stdin ? job.stdin.replace(/\n$/, '').split('\n') : [];
    const channel = job.channel && sharedInput ? new Int32Array(job.channel, 0, 2) : null;
    let jspi = false;
    if (job.interactive && !channel && promiseInput) {
      try {
        jspi = await py.runPythonAsync('from pyodide.ffi import can_run_sync as _xj_can_run_sync\n_xj_can_run_sync()');
      } catch (_) { /* Keep preloaded stdin when stack switching is unavailable. */ }
    }
    // On Android, only this local resource request reaches the stdin service.
    const terminalURL = job.nativeToken && new URL('terminal/' + job.nativeToken + '/', indexURL);
    let native = false;
    if (terminalURL && !channel && !jspi && typeof XMLHttpRequest === 'function') {
      try {
        const probe = await fetch(new URL('0', terminalURL), { cache: 'no-store' });
        native = probe.status === 204;
      } catch (_) { /* Fall back to prepared input when the local route is unavailable. */ }
    }
    let nativeLine = 0;
    let inputIndex = 0;
    let inputId = 0;
    let eof = false;
    let pending, inputPrompt = '';
    let fallbackExplained = false;
    const decoder = new TextDecoder();
    self.onmessage = ({ data }) => {
      if (!pending || !data || data.kind !== 'stdin' || data.id !== inputId ||
          (data.text !== null && (typeof data.text !== 'string' || data.text.length > 65536))) return;
      const accept = pending;
      pending = null;
      eof = data.text === null;
      // JS undefined converts to Python None. A submitted blank line is still a string.
      accept(eof ? undefined : data.text);
    };

    function readline(prompt = '') {
      if (inputIndex < stdin.length) return Promise.resolve(stdin[inputIndex++]);
      if (!job.interactive || eof) return Promise.resolve();
      if (pending) return Promise.reject(new Error('请等待上一条输入完成'));
      return new Promise(resolve => {
        pending = resolve;
        emit('input', { id: ++inputId, prompt: typeof prompt === 'string' ? prompt.slice(0, 300) : '' });
      });
    }
    py.registerJsModule('xinjian_terminal', {
      readline,
      _capture_prompt(text) { inputPrompt = text; }
    });

    // setStdin is synchronous. Shared memory and the local Android request can wait here.
    py.setStdin({ stdin() {
      if (inputIndex < stdin.length) return stdin[inputIndex++] + '\n';
      if (eof) return null;
      if (!channel && !native) {
        if (!fallbackExplained) {
          fallbackExplained = true;
          log('stderr', job.interactive
            ? '\n预填输入已用完。当前环境需要预填输入，运行中可改用 await readline()。\n'
            : '\n预填输入已用完。请补充标准输入，或选择「本地运行」在运行中输入。\n');
        }
        return null;
      }
      if (pending) throw new Error('请等待上一条输入完成');
      const prompt = inputPrompt.slice(0, 300);
      if (native) {
        const number = ++nativeLine;
        const request = new XMLHttpRequest();
        request.open('GET', new URL(String(number), terminalURL).href, false);
        emit('input', { id: ++inputId, transport: 'native', number, prompt });
        try { request.send(); }
        catch (_) { throw new Error('无法读取本地终端输入，请停止后重试'); }
        if (request.status === 204 || request.status === 410) { eof = true; return null; }
        if (request.status !== 200) throw new Error('本地终端不可用，请停止后重试');
        return request.responseText + '\n';
      }
      Atomics.store(channel, 0, 0);
      emit('input', { id: ++inputId, transport: 'shared', prompt });
      Atomics.wait(channel, 0, 0);
      const length = Atomics.load(channel, 1);
      if (length < 0 || length > 65536) { eof = true; return null; }
      return decoder.decode(new Uint8Array(job.channel, 8, length).slice()) + '\n';
    }});

    if (channel || native) {
      py.runPython(`import builtins as _xj_builtins
from xinjian_terminal import _capture_prompt as _xj_capture_prompt
def _xj_input_with_prompt(original, capture_prompt):
    def input(prompt="", /):
        text = str(prompt)
        capture_prompt(text)
        try:
            return original(text)
        finally:
            capture_prompt("")
    return input
_xj_builtins.input = _xj_input_with_prompt(_xj_builtins.input, _xj_capture_prompt)
del _xj_builtins, _xj_capture_prompt, _xj_input_with_prompt`);
    } else if (jspi) {
      // JSPI suspends the Python stack without blocking the Worker event loop.
      py.runPython(`import builtins as _xj_builtins
import sys as _xj_sys
from pyodide.ffi import can_run_sync as _xj_can_run_sync, run_sync as _xj_run_sync
from xinjian_terminal import readline as _xj_readline
def _xj_input_with_jspi(original, sys, stdin, can_run_sync, run_sync, readline):
    def input(prompt="", /):
        if sys.stdin is not stdin or not can_run_sync():
            return original(prompt)
        text = str(prompt)
        if text:
            print(text, end="", flush=True)
        line = run_sync(readline(text))
        if line is None:
            raise EOFError("EOF when reading a line")
        return line
    return input
_xj_builtins.input = _xj_input_with_jspi(_xj_builtins.input, _xj_sys, _xj_sys.stdin,
                                        _xj_can_run_sync, _xj_run_sync, _xj_readline)
del _xj_builtins, _xj_sys, _xj_can_run_sync, _xj_run_sync, _xj_readline, _xj_input_with_jspi`);
    }
    emit('stdin-mode', { mode: channel ? 'shared' : jspi ? 'jspi' : native ? 'native' : 'preloaded' });

    py.FS.mkdir('/input');
    py.FS.mkdir('/output');
    for (const file of job.files) py.FS.writeFile('/input/' + file.name, new Uint8Array(file.data));
    py.FS.chdir('/output');
    py.runPython('import os as _xj_os\n_xj_os.environ["MPLBACKEND"] = "Agg"');
    await py.loadPackagesFromImports(job.source, { messageCallback() {}, errorCallback() {} });
    if (py.loadedPackages.matplotlib) {
      py.runPython(`from matplotlib import pyplot as _xj_plt
_xj_plot_count = 0
def _xj_show(*args, **kwargs):
    global _xj_plot_count
    for number in _xj_plt.get_fignums():
        _xj_plot_count += 1
        if _xj_plot_count > 8:
            return
        _xj_plt.figure(number).savefig('/output/plot-%d.png' % _xj_plot_count)
_xj_plt.show = _xj_show`);
    }

    emit('ready');
    const result = await py.runPythonAsync(job.source, { filename: job.name });
    if (result && result.destroy) result.destroy();
    let count = 0;
    let total = 0;
    for (const name of py.FS.readdir('/output')) {
      if (!/^[^/\\:\u0000-\u001f\u007f]{1,100}$/.test(name) || name === '.' || name === '..') continue;
      const path = '/output/' + name;
      const info = py.FS.lstat(path);
      if (!py.FS.isFile(info.mode)) continue;
      if (info.size > fileLimit || total + info.size > fileLimit * 2 || count >= 8) {
        log('stderr', '已略过超出大小或数量上限的输出文件\n');
        break;
      }
      if (!info.size) continue;
      const data = py.FS.readFile(path).slice().buffer;
      count++;
      total += info.size;
      emit('artifact', { name, mime: /\.png$/i.test(name) ? 'image/png' : 'application/octet-stream', data }, [data]);
    }
    emit('exit', { ok: true });
  } catch (error) {
    log('stderr', String(error.message || error).slice(0, 8000) + '\n');
    emit('exit', { ok: false });
  }
  self.close();
};
