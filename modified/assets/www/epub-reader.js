/* EPUB metadata and safe rendering. ZIP entries are read by Android without extracting files. */
'use strict';

var EpubReader = (function () {
  var IMAGE = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  var BLOCKED = new Set(['script', 'style', 'link', 'meta', 'base', 'iframe', 'object', 'embed',
    'audio', 'video', 'source', 'canvas', 'svg', 'math', 'form', 'input', 'textarea', 'select', 'button']);
  var TAGS = new Set(['article', 'section', 'div', 'p', 'span', 'blockquote', 'pre', 'code', 'br', 'hr',
    'strong', 'em', 'b', 'i', 'u', 's', 'small', 'sup', 'sub', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'ruby', 'rt', 'rp', 'figure', 'figcaption']);

  function elements(node, tag) { return Array.from(node.getElementsByTagNameNS('*', tag)); }
  function child(node, tag) { return Array.from(node.children).find(function (item) { return item.localName === tag; }); }
  function label(node, fallback) {
    var value = node && node.textContent.trim().replace(/\s+/g, ' ');
    return value ? value.slice(0, 220) : fallback;
  }

  function location(base, raw) {
    if (!raw || raw.length > 1500 || /[?\\:\u0000-\u001f]/.test(raw) || raw[0] === '/') return null;
    var hash = raw.indexOf('#');
    var reference = hash < 0 ? raw : raw.slice(0, hash);
    var path = base.split('/');
    if (reference) path.pop();
    try {
      if (reference) {
        for (var encoded of reference.split('/')) {
          var segment = decodeURIComponent(encoded);
          if (!segment || /[/\\:\u0000-\u001f]/.test(segment)) return null;
          if (segment === '.') continue;
          if (segment === '..') {
            if (!path.length) return null;
            path.pop();
          } else path.push(segment);
        }
      }
      if (!path.length || !path[0]) return null;
      return { path: path.join('/'), anchor: hash < 0 ? '' : decodeURIComponent(raw.slice(hash + 1)).slice(0, 512) };
    } catch (error) { return null; }
  }

  function parse(xml) {
    // Read legacy simple XHTML doctypes without fetching their external subsets.
    xml = xml.replace(/<\?[\s\S]*?\?>/g, '').replace(/<!DOCTYPE\s+[^<>\[]+>/gi, '');
    if (/<!\s*(?:doctype|entity)\b/i.test(xml)) throw new Error('此 EPUB 含有不支持的 XML 声明。');
    var doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (elements(doc, 'parsererror').length) throw new Error('此 EPUB 的目录或正文格式有误。');
    return doc;
  }

  function open(name) {
    var archive = Books.native('bookArchive'), entry = Books.native('bookEntry');
    if (!archive || !entry) throw new Error('请在 Android 应用中打开 EPUB。');
    if (!archive(name)) throw new Error('EPUB 已损坏、不完整或超出读取限制。');

    function documentAt(path) {
      var encoded = entry(name, path, '');
      if (encoded === null) throw new Error('此 EPUB 缺少可读取的章节或目录。');
      return parse(Books.decode(Books.bytes(encoded), 'auto').text);
    }

    var container = documentAt('META-INF/container.xml');
    var root = elements(container, 'rootfile')[0];
    var packagePath = root && location('root', root.getAttribute('full-path'));
    if (!packagePath) throw new Error('EPUB 缺少书籍索引。');
    var book = documentAt(packagePath.path);
    var pack = book.documentElement;
    var metadata = child(pack, 'metadata'), manifest = child(pack, 'manifest'), spine = child(pack, 'spine');
    if (!manifest || !spine) throw new Error('EPUB 缺少章节清单。');
    var items = new Map(), byPath = new Map();
    for (var item of elements(manifest, 'item')) {
      var target = location(packagePath.path, item.getAttribute('href'));
      var id = item.getAttribute('id');
      if (!target || !id || items.has(id)) continue;
      var info = { path: target.path, mime: item.getAttribute('media-type'), properties: item.getAttribute('properties') || '' };
      items.set(id, info);
      byPath.set(target.path, info);
    }
    var sections = [], sectionIndexes = new Map();
    for (var ref of elements(spine, 'itemref')) {
      var section = items.get(ref.getAttribute('idref'));
      if (!section || ['application/xhtml+xml', 'text/html'].indexOf(section.mime) < 0) continue;
      if (!sectionIndexes.has(section.path)) sectionIndexes.set(section.path, sections.length);
      sections.push({ title: '第 ' + (sections.length + 1) + ' 章', path: section.path });
    }
    if (!sections.length) throw new Error('EPUB 没有可阅读的 XHTML 章节。');
    var toc = [];

    function addToc(source, href, title) {
      var address = location(source, href);
      if (!address || !sectionIndexes.has(address.path) || !title) return;
      var index = sectionIndexes.get(address.path);
      toc.push({ title: title, index: index, anchor: address.anchor });
      if (!sections[index].named) {
        sections[index].title = title;
        sections[index].named = true;
      }
    }

    var nav = Array.from(items.values()).find(function (item) { return /\bnav\b/.test(item.properties); });
    if (nav) {
      try {
        var menus = elements(documentAt(nav.path), 'nav');
        var menu = menus.find(function (item) {
          return /\btoc\b/.test(item.getAttributeNS('http://www.idpf.org/2007/ops', 'type') || '');
        }) || menus[0];
        if (menu) elements(menu, 'a').slice(0, 1000).forEach(function (link) {
          addToc(nav.path, link.getAttribute('href'), label(link, ''));
        });
      } catch (error) { /* The spine is also available when the TOC is missing or malformed. */ }
    }
    var ncx = items.get(spine.getAttribute('toc'));
    if (!toc.length && ncx) {
      try {
        elements(documentAt(ncx.path), 'navPoint').slice(0, 1000).forEach(function (point) {
          var content = child(point, 'content');
          if (content) addToc(ncx.path, content.getAttribute('src'), label(child(point, 'navLabel'), ''));
        });
      } catch (error) {}
    }
    if (!toc.length) toc = sections.map(function (section, index) { return { title: section.title, index: index }; });

    function chapter(index, onUrl, onLink) {
      var section = sections[index];
      var doc = documentAt(section.path);
      var body = elements(doc, 'body')[0];
      if (!body) throw new Error('此章节缺少正文。');
      var out = document.createDocumentFragment(), images = 0, imageBytes = 0, visited = 0;
      for (var node of body.childNodes) render(node, out, 0);
      return out;

      function render(node, parent, depth) {
        if (++visited > 20000 || depth > 40) throw new Error('此章节的内容结构过于复杂。');
        if (node.nodeType === 3 || node.nodeType === 4) {
          parent.appendChild(document.createTextNode(node.nodeValue));
          return;
        }
        if (node.nodeType !== 1) return;
        if (node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml') return;
        var tag = node.localName.toLowerCase();
        if (BLOCKED.has(tag)) return;
        var id = node.getAttribute('id');
        if (id && id.length <= 512) {
          var marker = document.createElement('span');
          marker.dataset.bookAnchor = id;
          parent.appendChild(marker);
        }
        if (tag === 'img') {
          addImage(node, parent);
          return;
        }
        var output = parent;
        if (TAGS.has(tag)) {
          output = document.createElement(tag);
          parent.appendChild(output);
        } else if (tag === 'a') {
          var target = location(section.path, node.getAttribute('href'));
          if (target && sectionIndexes.has(target.path)) {
            output = document.createElement('button');
            output.type = 'button';
            output.className = 'reader-link';
            output.onclick = function () { onLink(sectionIndexes.get(target.path), target.anchor); };
            parent.appendChild(output);
          }
        }
        for (var sub of node.childNodes) render(sub, output, depth + 1);
      }

      function addImage(node, parent) {
        var address = location(section.path, node.getAttribute('src'));
        var resource = address && byPath.get(address.path);
        if (!resource || !IMAGE.has(resource.mime) || images >= 8 || imageBytes >= 6 * 1024 * 1024) return;
        images++;
        var data = entry(name, resource.path, resource.mime);
        if (typeof data !== 'string') return;
        var image = Books.bytes(data);
        imageBytes += image.length;
        if (imageBytes > 6 * 1024 * 1024) return;
        var url = URL.createObjectURL(new Blob([image], { type: resource.mime }));
        onUrl(url);
        var element = document.createElement('img');
        element.alt = (node.getAttribute('alt') || '').slice(0, 200);
        element.src = url;
        element.decoding = 'async';
        parent.appendChild(element);
      }
    }

    return {
      title: label(metadata && elements(metadata, 'title')[0], name),
      author: label(metadata && elements(metadata, 'creator')[0], ''),
      sections: sections, toc: toc, chapter: chapter
    };
  }

  return { open: open };
})();
