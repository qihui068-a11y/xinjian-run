/* 信笺 · Markdown 渲染（离线，无依赖）
   只为「小说阅读」服务：标题 / 段落 / 强调 / 列表 / 引用 / 分隔线 /
   代码块 / 表格 / 链接 / 图片 / 行内代码。

   安全前提：**先把 & < > " 全部转义，再做语法替换**，
   所以导入进来的任何文件都不可能往页面里塞 HTML 或脚本。
   行内替换只会插入我们自己的标签，用户内容永远走 esc() 之后的值。 */
(function (global) {
  'use strict';

  /* 引号实体的字面量交给拼接生成：直接写字面量在多层工具链里会被解码成 '"'，
     那样等于没转义，alt/href 里的 " 就能把属性撑开注入 onerror。 */
  var QUOT = '&' + 'quot;';

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, QUOT);
  }

  /* 标题锚点：去掉空白和标点，只留中日韩文字与字母数字。
     小说目录里常见 [第一章　风雨欲来（上）](#第一章风雨欲来上)，
     两侧规范化之后就能对上。 */
  function slug(s) {
    return String(s)
      .replace(/[*_`~]/g, '')
      .replace(/[^\w\u4e00-\u9fa5]/g, '');
  }

  /* ---------- 行内 ---------- */
  function inline(s) {
    /* 必须先转义再解析：行内替换只会插入我们自己的标签，
       用户内容永远是 esc() 之后的值，绝不能反过来说。 */
    s = esc(s);
    var codes = [];
    /* 行内代码先摘出来，避免里面的 * _ 被当成强调 */
    s = s.replace(/`([^`\n]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });

    /* 图片必须排在链接前面，否则 ![a](b) 会被当成链接 */
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, src) {
      return '<img alt="' + alt + '" src="' + src + '">';
    });
    s = s.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, txt, href) {
      return '<a href="' + href + '">' + txt + '</a>';
    });

    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/(^|[^_\w])_([^_\n]+)_/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');

    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      return '<code>' + codes[+i] + '</code>';
    });
    return s;
  }

  /* ---------- 列表 ---------- */
  function indentOf(line) {
    var m = /^[ \t]*/.exec(line)[0];
    var n = 0;
    for (var i = 0; i < m.length; i++) n += (m[i] === '\t' ? 4 : 1);
    return n;
  }

  function buildList(items) {
    function build(start, indent) {
      var ordered = items[start].ordered;
      var html = ordered ? '<ol>' : '<ul>';
      var k = start;
      while (k < items.length && items[k].indent >= indent) {
        if (items[k].indent > indent) {
          /* 缩进更深：插进上一个 <li> 里面 */
          var res = build(k, items[k].indent);
          if (/<\/li>$/.test(html)) html = html.replace(/<\/li>$/, res.html + '</li>');
          else html += res.html;
          k = res.next;
          continue;
        }
        html += '<li>' + inline(items[k].text) + '</li>';
        k++;
      }
      html += ordered ? '</ol>' : '</ul>';
      return { html: html, next: k };
    }
    return build(0, items[0].indent).html;
  }

  /* ---------- 表格 ---------- */
  function splitRow(line) {
    var s = line.trim();
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    return s.split('|').map(function (c) { return c.trim(); });
  }

  function isTableSep(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line || '');
  }

  /* ---------- 块级 ---------- */
  var BLOCK_START = /^\s*(#{1,6}\s|>|([-*+]|\d+[.)])\s+|```|~~~|([-*_])\s*\3\s*\3)/;

  function render(src) {
    src = String(src == null ? '' : src).replace(/\r\n?/g, '\n');
    var lines = src.split('\n');
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var ln = lines[i];

      /* 围栏代码块 */
      var fm = /^\s*(```|~~~)(.*)$/.exec(ln);
      if (fm) {
        var fence = fm[1];
        var lang = fm[2].trim();
        var buf = [];
        i++;
        while (i < lines.length && lines[i].indexOf(fence) !== 0 &&
               !/^\s*(```|~~~)/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++; /* 吃掉结束围栏 */
        out.push('<pre class="md-code"' + (lang ? ' data-lang="' + esc(lang) + '"' : '') +
                 '><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }

      /* 空行 */
      if (/^\s*$/.test(ln)) { i++; continue; }

      /* 分隔线 */
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(ln)) { out.push('<hr>'); i++; continue; }

      /* 标题 */
      var hm = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(ln);
      if (hm) {
        var lvl = hm[1].length;
        var tid = slug(hm[2]);
        out.push('<h' + lvl + (tid ? ' id="' + tid + '"' : '') + '>' + inline(hm[2]) + '</h' + lvl + '>');
        i++;
        continue;
      }

      /* 引用 */
      if (/^\s*>/.test(ln)) {
        var bq = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) {
          bq.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + render(bq.join('\n')) + '</blockquote>');
        continue;
      }

      /* 表格（表头 + 分隔行） */
      if (ln.indexOf('|') >= 0 && isTableSep(lines[i + 1])) {
        var head = splitRow(ln);
        i += 2;
        var rows = [];
        while (i < lines.length && lines[i].indexOf('|') >= 0 && !/^\s*$/.test(lines[i])) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        var th = '<table class="md-table"><thead><tr>';
        for (var a = 0; a < head.length; a++) th += '<th>' + inline(head[a]) + '</th>';
        th += '</tr></thead><tbody>';
        for (var r = 0; r < rows.length; r++) {
          th += '<tr>';
          for (var c = 0; c < rows[r].length; c++) th += '<td>' + inline(rows[r][c]) + '</td>';
          th += '</tr>';
        }
        out.push(th + '</tbody></table>');
        continue;
      }

      /* 列表 */
      if (/^\s*([-*+]|\d+[.)])\s+/.test(ln)) {
        var items = [];
        while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
          items.push({
            indent: indentOf(lines[i]),
            ordered: /^\s*\d/.test(lines[i]),
            text: lines[i].replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '')
          });
          i++;
        }
        out.push(buildList(items));
        continue;
      }

      /* 段落：吃到下一个块级起点或空行为止 */
      var para = [ln];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK_START.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      out.push('<p>' + para.map(inline).join('<br>') + '</p>');
    }

    return out.join('\n');
  }

  global.MD = { render: render, slug: slug, esc: esc };
})(window);
