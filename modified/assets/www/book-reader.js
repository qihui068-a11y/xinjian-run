/* File formats and state shared by the bookshelf and the reader. */
'use strict';

var Books = (function () {
  var CHUNK = 256 * 1024;
  var LIMIT = 64 * 1024 * 1024;
  var SEGMENT = 12000;
  var KEY = 'xj:reader:v1';
  var ENCODINGS = [['auto', '自动识别'], ['utf-8', 'UTF-8'], ['utf-16le', 'UTF-16 LE'],
    ['utf-16be', 'UTF-16 BE'], ['gb18030', 'GBK / GB18030']];

  function format(name) {
    var ext = Bridge.extOf(name);
    return ext === 'txt' || ext === 'epub' ? ext : '';
  }

  function unsupported(name) {
    return ['pdf', 'mobi', 'azw3'].indexOf(Bridge.extOf(name)) !== -1;
  }

  function readState() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY));
      if (data && data.books && typeof data.books === 'object') return data;
    } catch (error) {}
    return { books: {}, settings: {} };
  }

  var state = readState();

  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (error) {}
  }

  function key(name) { return 'bookcase/' + String(name).trim(); }

  function record(name) {
    return state.books[key(name)] || {};
  }

  function save(name, changes) {
    var id = key(name);
    state.books[id] = Object.assign({}, record(name), changes);
    saveState();
  }

  function rename(oldName, newName) {
    if (key(oldName) === key(newName) || !state.books[key(oldName)]) return;
    if (format(newName) === format(oldName)) state.books[key(newName)] = state.books[key(oldName)];
    delete state.books[key(oldName)];
    saveState();
  }

  function remove(name) {
    if (!state.books[key(name)]) return;
    delete state.books[key(name)];
    saveState();
  }

  function settings() { return Object.assign({ size: 18, line: 1.75, theme: 'system', mode: 'scroll' }, state.settings); }
  function saveSettings(values) { state.settings = values; saveState(); }

  function clearRecent() {
    Object.keys(state.books).forEach(function (id) { delete state.books[id].openedAt; });
    saveState();
  }

  function recent(names) {
    return names.filter(function (name) { return !!record(name).openedAt; }).sort(function (left, right) {
      return record(right).openedAt - record(left).openedAt;
    }).slice(0, 3);
  }

  function native(method) {
    var bridge = window.XinJianBridge;
    return bridge && typeof bridge[method] === 'function' ? bridge[method].bind(bridge) : null;
  }

  function bytes(encoded) {
    if (typeof encoded !== 'string') throw new Error('无法读取书籍内容。');
    var binary = atob(encoded), result = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) result[i] = binary.charCodeAt(i);
    return result;
  }

  function base64(buffer) {
    var data = new Uint8Array(buffer), chunks = [];
    for (var offset = 0; offset < data.length; offset += 8192) {
      chunks.push(String.fromCharCode.apply(null, data.subarray(offset, offset + 8192)));
    }
    return btoa(chunks.join(''));
  }

  function yieldUi() { return new Promise(function (resolve) { setTimeout(resolve, 0); }); }

  function readBlob(blob, binary) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('读取所选文件失败。')); };
      reader.onabort = reader.onerror;
      if (binary) reader.readAsArrayBuffer(blob);
      else reader.readAsText(blob);
    });
  }

  async function importFile(file) {
    if (!format(file.name)) return Bridge.create(file.name, String(await readBlob(file, false)));
    if (file.size > LIMIT) throw new Error('书籍超过 64 MiB。');
    var name = file.name.trim(), start = native('bookBegin');
    if (!start) {
      if (format(name) === 'epub') throw new Error('请在 Android 应用中导入 EPUB。');
      if (file.size > 1024 * 1024) throw new Error('请在 Android 应用中导入较大的 TXT。');
      return Bridge.create(name, decode(new Uint8Array(await readBlob(file, true)), 'auto').text);
    }
    var token = start(name, file.size);
    if (!token) return false;
    var committed = false;
    try {
      var append = native('bookAppend');
      for (var offset = 0; offset < file.size; offset += CHUNK) {
        var buffer = await readBlob(file.slice(offset, offset + CHUNK), true);
        if (!append(name, token, offset, base64(buffer))) throw new Error('写入所选文件失败。');
      }
      committed = native('bookFinish')(name, token, file.size);
      return committed;
    } finally {
      if (!committed) native('bookCancel')(name, token);
    }
  }

  function exportFile(name) {
    var direct = format(name) && native('bookExport');
    if (direct) return Promise.resolve().then(function () { return direct(name); });
    return Bridge.read(name).then(function (text) { return Bridge.exportOne(name, text); });
  }

  function chooseEncoding(sample, requested) {
    if (requested !== 'auto') return requested;
    if (sample[0] === 255 && sample[1] === 254) return 'utf-16le';
    if (sample[0] === 254 && sample[1] === 255) return 'utf-16be';
    var count = Math.min(512, sample.length) & ~1, even = 0, odd = 0;
    for (var i = 0; i < count; i += 2) {
      if (sample[i] === 0) even++;
      if (sample[i + 1] === 0) odd++;
    }
    if (count >= 8 && even > count / 8 && odd === 0) return 'utf-16be';
    if (count >= 8 && odd > count / 8 && even === 0) return 'utf-16le';
    return 'utf-8';
  }

  function decode(sample, requested) {
    var encoding = chooseEncoding(sample, requested);
    return { text: new TextDecoder(encoding, { fatal: true }).decode(sample), encoding: encoding };
  }

  function segmenter() {
    var sections = [], toc = [];
    var heading = '正文', partial = '', body = '', offset = 0, start = 0;

    function flush() {
      if (body) sections.push({ title: heading, text: body, offset: start });
      body = '';
      start = offset;
    }

    function write(line, complete) {
      var title = complete && line.length <= 160 &&
        /^\s*(?:第\s*[0-9０-９零〇一二两三四五六七八九十百千万上中下]+\s*[章节卷回部篇集]|chapter\s+(?:\d+|[ivxlcdm]+)\b)/i.test(line);
      if (title) {
        flush();
        heading = line.trim();
        toc.push({ title: heading, index: sections.length });
      }
      if (body.length + line.length > SEGMENT) flush();
      body += line;
      offset += line.length;
    }

    return {
      push: function (text) {
        var input = partial + text, startAt = 0;
        for (var end = input.indexOf('\n'); end !== -1; end = input.indexOf('\n', startAt)) {
          appendRange(end + 1, true);
        }
        appendRange(input.length, false);
        partial = input.slice(startAt);

        function appendRange(endAt, complete) {
          while (endAt - startAt > SEGMENT) {
            var at = startAt + SEGMENT;
            if (/[\uDC00-\uDFFF]/.test(input.charAt(at))) at--;
            write(input.slice(startAt, at), false);
            startAt = at;
          }
          if (complete) {
            write(input.slice(startAt, endAt), true);
            startAt = endAt;
          }
        }
      },
      end: function () {
        write(partial, true);
        flush();
        if (!sections.length) sections.push({ title: '正文', text: '', offset: 0 });
        if (!toc.length || toc[0].index > 0) toc.unshift({ title: '正文', index: 0 });
        return { sections: sections, toc: toc };
      }
    };
  }

  async function textBook(name, encoding, current) {
    var size = native('bookSize'), chunk = native('bookChunk'), pieces = segmenter();
    if (!size || !chunk) {
      var text = await Bridge.read(name);
      pieces.push(text);
      return Object.assign(pieces.end(), { encoding: 'utf-8', title: name });
    }
    var length = size(name);
    if (length < 0) throw new Error('书籍已移动或删除。');
    if (length > LIMIT) throw new Error('书籍超过 64 MiB。');
    var detected = encoding === 'auto' ? 'utf-8' : encoding;
    var decoder;
    for (var offset = 0; offset < length; offset += CHUNK) {
      if (!current()) return null;
      var part = bytes(chunk(name, offset, Math.min(CHUNK, length - offset)));
      if (!decoder) {
        detected = chooseEncoding(part, encoding);
        decoder = new TextDecoder(detected, { fatal: true });
      }
      try {
        var decoded = decoder.decode(part, { stream: offset + part.length < length });
        if (decoded.indexOf('\0') !== -1) throw new Error();
        pieces.push(decoded);
      } catch (error) {
        throw new Error('无法用所选编码读取，请在阅读设置中更换编码。');
      }
      if ((offset / CHUNK) % 4 === 3) await yieldUi();
    }
    return Object.assign(pieces.end(), { encoding: detected, title: name });
  }

  return {
    format: format, unsupported: unsupported, record: record, save: save, rename: rename, remove: remove,
    settings: settings, saveSettings: saveSettings, recent: recent, clearRecent: clearRecent, native: native,
    bytes: bytes, decode: decode, importFile: importFile, exportFile: exportFile, textBook: textBook,
    encodings: ENCODINGS
  };
})();
