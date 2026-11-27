/* Loaded only in the isolated local runtime Worker. */
'use strict';

async function runOfflineC(job, emit, log, input, root) {
  const cpp = job.language === 'cpp';
  const encoder = new TextEncoder();
  const source = encoder.encode(job.source);
  if (source.length > 256 * 1024) throw new Error('源码不能超过 256 KB');

  async function asset(name) {
    const response = await fetch(new URL(name, root));
    if (!response.ok) throw new Error('本地 C 运行组件不完整');
    return response;
  }
  const host = await import(new URL('shim/index.js', root).href);
  const { WASI, Fd, File, Directory, PreopenDirectory, OpenFile, ConsoleStdout } = host;
  const stdout = new TextDecoder(), stderr = new TextDecoder();
  const out = new ConsoleStdout(bytes => log('stdout', stdout.decode(bytes, { stream: true })));
  const err = new ConsoleStdout(bytes => log('stderr', stderr.decode(bytes, { stream: true })));
  function start(bytes, args, env, fds) {
    const wasi = new WASI(args, env, fds, { debug: false });
    // WASI has access only to the descriptors passed here. A user's executable receives the three streams.
    const module = new WebAssembly.Module(withMemoryLimit(bytes));
    return wasi.start(new WebAssembly.Instance(module, { wasi_snapshot_preview1: wasi.wasiImport }));
  }
  let executable;
  if (cpp) {
    const { commands, Exit } = await import(new URL('../clang/bundle.js', root).href);
    emit('compiling');
    try {
      const result = await commands['clang++'](
        ['-std=c++17', '-fno-exceptions', '-fno-color-diagnostics', '-O0',
          'main.cpp', '-Wl,--max-memory=67108864', '-o', 'main.wasm'],
        { 'main.cpp': job.source }, {
          decodeASCII: false,
          fetchProgress() {},
          stdout: data => { if (data) out.fd_write(data); },
          stderr: data => { if (data) err.fd_write(data); }
        });
      executable = result && result['main.wasm'];
    } catch (error) {
      if (!(error instanceof Exit)) throw error;
    }
  } else {
    const [cc, sysroot] = await Promise.all([
      asset('cc.wasm').then(response => response.arrayBuffer()),
      asset('sysroot.json').then(response => response.json())
    ]);
    const tree = new Map([['tmp', new Directory(new Map())], ['main.c', new File(source)]]);
    for (const [path, encoded] of Object.entries(sysroot)) {
      const dirs = path.split('/');
      const leaf = dirs.pop();
      let entries = tree;
      for (const dir of dirs) {
        if (!entries.has(dir)) entries.set(dir, new Directory(new Map()));
        entries = entries.get(dir).contents;
      }
      entries.set(leaf, new File(Uint8Array.from(atob(encoded), char => char.charCodeAt(0))));
    }
    emit('compiling');
    const result = start(cc, ['cc', '-o', 'main.wasm', 'main.c'],
      ['PWD=/', 'INCLUDE=/usr/include', 'LIB=/usr/lib'],
      [new OpenFile(new File([])), out, err, new PreopenDirectory('/', tree), new PreopenDirectory('.', tree)]);
    if (result === 0) executable = tree.get('main.wasm')?.data;
  }
  if (!executable) {
    log('stderr', stderr.decode());
    emit('exit', { ok: false });
    return;
  }

  const prefill = job.stdin && !job.stdin.endsWith('\n') ? job.stdin + '\n' : job.stdin;
  let buffered = encoder.encode(prefill || '');
  let inputId = 0, eof = false;
  class Stdin extends Fd {
    fd_fdstat_get() {
      const fdstat = new host.wasi.Fdstat(host.wasi.FILETYPE_CHARACTER_DEVICE, 0);
      fdstat.fs_rights_base = BigInt(host.wasi.RIGHTS_FD_READ);
      return { ret: 0, fdstat };
    }
    fd_read(size) {
      if (!size || eof) return { ret: 0, data: new Uint8Array(0) };
      if (buffered.length === 0) {
        const line = input ? input.read(++inputId, '') : null;
        if (line === null) {
          eof = true;
          return { ret: 0, data: buffered };
        }
        buffered = encoder.encode(line + '\n');
      }
      const data = buffered.subarray(0, size);
      buffered = buffered.subarray(data.length);
      return { ret: 0, data };
    }
  }
  emit('stdin-mode', { mode: input ? input.mode : 'preloaded' });
  emit('ready');
  if (!input) log('stderr', '当前环境使用预填标准输入。\n');
  const code = start(executable, ['main.wasm'], [], [new Stdin(), out, err]);
  log('stdout', stdout.decode());
  log('stderr', stderr.decode());
  if (code !== 0) log('stderr', '\n程序退出码 ' + code + '\n');
  emit('exit', { ok: code === 0 });
}

// Both compilers emit one ordinary 32-bit memory. Limit it to 1024 WASM pages (64 MiB).
function withMemoryLimit(bytes) {
  const wasm = new Uint8Array(bytes);
  const failure = () => new Error('C 运行模块的内存布局不受支持');
  let offset = 8;
  function read() {
    let value = 0;
    for (let shift = 0; shift < 35 && offset < wasm.length; shift += 7) {
      const byte = wasm[offset++];
      value += (byte & 127) * 2 ** shift;
      if (byte < 128 && value <= 0xffffffff) return value;
    }
    throw failure();
  }
  function leb(value) {
    const result = [];
    do {
      result.push((value & 127) | (value > 127 ? 128 : 0));
      value >>>= 7;
    } while (value);
    return result;
  }
  while (offset < wasm.length) {
    const section = offset;
    const id = wasm[offset++];
    const length = read();
    const end = offset + length;
    if (end > wasm.length) throw failure();
    if (id === 5) {
      if (read() !== 1) throw failure();
      const flags = read();
      if (flags > 1) throw failure();
      const minimum = read();
      const maximum = flags === 1 ? Math.min(read(), 1024) : 1024;
      if (offset !== end || minimum > maximum) throw failure();
      const memory = [1, 1, ...leb(minimum), ...leb(maximum)];
      const header = [5, ...leb(memory.length), ...memory];
      const result = new Uint8Array(wasm.length - (end - section) + header.length);
      result.set(wasm.subarray(0, section));
      result.set(header, section);
      result.set(wasm.subarray(end), section + header.length);
      return result;
    }
    offset = end;
  }
  throw failure();
}
