'use strict';
const assert = require('node:assert/strict');

module.exports = async function ({ test, app }) {
  await test('Runner accepts multiline stdin verbatim except line endings and checks its UTF-8 size', () => {
    const a = app();
    try {
      const io = a.w.RunIO;
      assert.equal(io.stdin('  测试\r\n\r\n2\r'), '  测试\n\n2\n');
      assert.equal(io.stdin(''), '');
      assert.throws(() => io.stdin('中'.repeat(23000)), /64 KB/);
      for (const ext of ['py', 'c', 'java']) assert.equal(a.w.RunFormats.payload(ext, 'test', io.stdin('1\n2\n')).stdin, '1\n2\n');
    } finally { a.close(); }
  });

  await test('Runner treats errors as text and caps streamed output', () => {
    const a = app();
    try {
      const { w } = a;
      const body = w.document.createElement('div');
      const renderer = w.RunIO.output(body);
      renderer.emit({ kind: 'stderr', text: '<b>错误</b>' });
      renderer.emit({ kind: 'stdout', text: 'x'.repeat(70000) });
      renderer.emit({ kind: 'stdout', text: 'this must be discarded' });
      assert.equal(body.querySelectorAll('b').length, 0);
      assert.equal(body.querySelector('.run-error').textContent, '<b>错误</b>');
      assert.equal(body.textContent.length, 65536 + '\n（输出已截断）'.length);
      assert(!body.textContent.includes('this must be discarded'));
      renderer.dispose();
    } finally { a.close(); }
  });

  await test('Runner previews only bounded PNGs and revokes all artifact URLs on close', () => {
    const a = app();
    try {
      const { w } = a;
      const revoked = [];
      let count = 0;
      w.URL.createObjectURL = () => 'blob:' + ++count;
      w.URL.revokeObjectURL = url => revoked.push(url);
      const body = w.document.createElement('div');
      const renderer = w.RunIO.output(body);
      const png = new w.ArrayBuffer(33);
      const header = new w.DataView(png);
      [0x89504e47, 0x0d0a1a0a, 13, 0x49484452, 8, 8].forEach((v, i) => header.setUint32(i * 4, v));
      renderer.emit({ kind: 'artifact', name: 'plot.png', mime: 'image/png', data: png });
      renderer.emit({ kind: 'artifact', name: '../outside.png', mime: 'image/png', data: png });
      renderer.emit({ kind: 'artifact', name: 'bad.png', mime: 'image/png', data: new w.ArrayBuffer(33) });
      renderer.emit({ kind: 'artifact', name: 'page.html', mime: 'text/html', data: new w.ArrayBuffer(20) });
      assert.equal(body.querySelectorAll('img').length, 1);
      assert.equal(body.querySelectorAll('a[download]').length, 2);
      assert.equal(body.querySelector('img').alt, 'plot.png');
      renderer.dispose();
      assert.deepEqual(revoked, ['blob:1', 'blob:2']);
    } finally { a.close(); }
  });
};
