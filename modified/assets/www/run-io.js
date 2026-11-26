/* The editor receives data records from runners. It never executes runner output. */
var RunIO = (function () {
  'use strict';

  var textLimit = 65536;
  var fileLimit = 4 * 1024 * 1024;

  function stdin(text) {
    var input = String(text).replace(/\r\n?/g, '\n');
    if (input.length > textLimit || new Blob([input]).size > textLimit) throw new Error('标准输入不能超过 64 KB');
    return input;
  }

  function filename(name) {
    return typeof name === 'string' && name.length <= 100 && name !== '.' && name !== '..' &&
      /^[^/\\:\u0000-\u001f\u007f]+$/.test(name) && name === name.trim();
  }

  function isPng(data) {
    if (data.byteLength < 33) return false;
    var header = new DataView(data);
    var w = header.getUint32(16), h = header.getUint32(20);
    return header.getUint32(0) === 0x89504e47 && header.getUint32(4) === 0x0d0a1a0a &&
      header.getUint32(8) === 13 && header.getUint32(12) === 0x49484452 && w > 0 && h > 0 && w <= 4096 && h <= 4096;
  }

  function output(body) {
    var pre = document.createElement('pre');
    var remaining = textLimit, records = 0, bytes = 0;
    var artifacts = [];
    body.appendChild(pre);

    function emit(event) {
      if (!event) return;
      if ((event.kind === 'stdout' || event.kind === 'stderr') && typeof event.text === 'string') {
        if (remaining <= 0 || records >= 600 || !event.text) return;
        var chunk = event.text.slice(0, remaining);
        var node = document.createElement('span');
        if (event.kind === 'stderr') node.className = 'run-error';
        node.textContent = chunk;
        pre.appendChild(node);
        remaining -= chunk.length;
        if (++records === 600 || remaining <= 0) pre.appendChild(document.createTextNode('\n（输出已截断）'));
        body.scrollTop = body.scrollHeight;
      } else if (event.kind === 'artifact' && filename(event.name) && event.data instanceof ArrayBuffer &&
                 event.data.byteLength > 0 && event.data.byteLength <= fileLimit &&
                 bytes + event.data.byteLength <= 2 * fileLimit && artifacts.length < 8) {
        var image = event.mime === 'image/png';
        if (image && !isPng(event.data)) return;
        var type = image ? 'image/png' : 'application/octet-stream';
        var url = URL.createObjectURL(new Blob([event.data], { type: type }));
        bytes += event.data.byteLength;
        var figure = document.createElement('figure');
        figure.className = 'run-artifact';
        if (image) {
          var img = document.createElement('img');
          img.src = url;
          img.alt = event.name;
          figure.appendChild(img);
        }
        var link = document.createElement('a');
        link.href = url;
        link.download = event.name;
        link.textContent = '下载 ' + event.name;
        figure.appendChild(link);
        body.appendChild(figure);
        artifacts.push({ url: url, element: figure });
      }
    }

    function clear() {
      pre.textContent = '';
      artifacts.forEach(function (artifact) {
        URL.revokeObjectURL(artifact.url);
        artifact.element.remove();
      });
      artifacts = [];
      remaining = textLimit;
      records = bytes = 0;
    }

    return { emit: emit, clear: clear, dispose: clear, text: function () { return pre.textContent; } };
  }

  return { stdin: stdin, filename: filename, output: output, fileLimit: fileLimit };
})();
