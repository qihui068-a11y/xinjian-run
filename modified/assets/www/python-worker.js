'use strict';

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

  try {
    // Python's js module receives no browser globals. The worker's response CSP also restricts network and script loads.
    const indexURL = new URL('python-runtime/', self.location.href).href;
    importScripts(indexURL + 'pyodide.js');
    const py = await loadPyodide({ indexURL, jsglobals: Object.create(null),
      stdout: line => log('stdout', line + '\n'), stderr: line => log('stderr', line + '\n') });
    const stdin = job.stdin ? job.stdin.replace(/\n$/, '').split('\n') : [];
    const channel = job.channel && self.crossOriginIsolated ? new Int32Array(job.channel, 0, 2) : null;
    let inputIndex = 0;
    let inputId = 0;
    let eof = false;
    let pending;
    self.onmessage = ({ data }) => {
      if (!pending || !data || data.kind !== 'stdin' || data.id !== inputId ||
          (data.text !== null && (typeof data.text !== 'string' || data.text.length > 65536))) return;
      const accept = pending;
      pending = null;
      eof = data.text === null;
      accept(data.text);
    };
    py.registerJsModule('xinjian_terminal', {
      readline(prompt = '') {
        if (inputIndex < stdin.length) return Promise.resolve(stdin[inputIndex++]);
        if (!job.interactive || eof) return Promise.resolve(null);
        if (pending) return Promise.reject(new Error('请等待上一条输入完成'));
        return new Promise(resolve => {
          pending = resolve;
          emit('input', { id: ++inputId, prompt: typeof prompt === 'string' ? prompt.slice(0, 300) : '' });
        });
      }
    });
    py.setStdin({ stdin() {
      if (inputIndex < stdin.length) return stdin[inputIndex++];
      if (!channel || eof) return null;
      Atomics.store(channel, 0, 0);
      emit('input', { id: ++inputId, transport: 'shared' });
      if (Atomics.wait(channel, 0, 0, 90000) === 'timed-out') return null;
      const length = Atomics.load(channel, 1);
      if (length < 0 || length > 65536) { eof = true; return null; }
      return new TextDecoder().decode(new Uint8Array(job.channel, 8, length).slice());
    }});

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
