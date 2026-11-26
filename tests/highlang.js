/* 语法高亮 · 多语言验收测试（0.4.5）
   来源：/sdcard/信笺_0.4.zip 里那份 highlight.js（753 行），替换掉我们原来的 210 行版本。
   用 syntax-spec.md 第十节的验收用例逐条打。**这里测的是真实输出**，
   不按规范「应该是什么」写——不一致的三处单独标出来，见文件末尾。
   纯词法函数，不需要 DOM，所以直接 new Function 灌一个假 window。 */
const fs = require('fs');
const src = fs.readFileSync('/sdcard/信笺/app/highlight.js', 'utf8');
const box = {};
new Function('window', src)(box);
const HL = box.HL;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}
const H = (code, ext) => HL.highlight(code, ext);
const has = (out, cls, text) => out.indexOf('<span class="' + cls + '">' + text + '</span>') >= 0;

/* ---------- 0. 接口与兜底 ---------- */
ok('导出了 HL.highlight', HL && typeof HL.highlight === 'function');
ok('返回字符串', typeof H('x', 'py') === 'string');
ok('空串返回空串', H('', 'py') === '');
ok('null 不抛', H(null, 'py') === '');
ok('undefined 不抛', H(undefined, 'js') === '');
ok('ext 带点也能认（.py）', has(H('# hi', '.py'), 'tk-c', '# hi'));
ok('ext 大小写不敏感（PY）', has(H('# hi', 'PY'), 'tk-c', '# hi'));
ok('未知扩展名 → 转义纯文本', H('<b> & co', 'xyz') === '&lt;b&gt; &amp; co');
ok('未知扩展名不产生任何 span', H('abc def', 'xyz').indexOf('<span') < 0);

/* ---------- 1. XSS：任何语言都不能把原文当 HTML 写进去 ---------- */
['py', 'js', 'html', 'css', 'json', 'bf'].forEach(function (ext) {
  const out = H('<img src=x onerror=alert(1)>', ext);
  ok('[' + ext + '] 尖括号被转义', out.indexOf('<img') < 0 && out.indexOf('&lt;') >= 0);
});

/* ---------- 2. .bf 老语法不能回归 ---------- */
ok('bf 注释 /( … )', has(H('/( hi )/', 'bf'), 'tk-c', '/( hi )'));
ok('bf 类型词用 tk-t（类型色，不是关键字色）', has(H('int x', 'bf'), 'tk-t', 'int'));
ok('bf 关键字', has(H('do', 'bf'), 'tk-k', 'do'));
ok('bf over 标记（tk-m）', has(H('over', 'bf'), 'tk-m', 'over'));
ok('bf 函数名', has(H('run_r', 'bf'), 'tk-f', 'run_r'));
ok('bf 结果变量 $x', has(H('$x', 'bf'), 'tk-v', '$x'));
ok('bf 预处理行 #hand', has(H('#hand', 'bf'), 'tk-h', '#hand'));
ok('bfh 与 bf 同规则', has(H('/( hi )/', 'bfh'), 'tk-c', '/( hi )'));

/* ---------- 3. C 家族 ---------- */
ok('c 关键字', has(H('return 0;', 'c'), 'tk-k', 'return'));
ok('c 字符串', has(H('"a\\"b"', 'c'), 'tk-s', '"a\\"b"'));
ok('c 数字', has(H('42', 'c'), 'tk-n', '42'));
ok('c 注释', has(H('// hi', 'c'), 'tk-c', '// hi'));
ok('cpp 也能用', has(H('class A{};', 'cpp'), 'tk-k', 'class'));
ok('c 函数名后跟括号', has(H('main()', 'c'), 'tk-f', 'main'));

/* ---------- 4. Python ---------- */
ok('py 注释', has(H('# hi', 'py'), 'tk-c', '# hi'));
ok('py 关键字', has(H('def', 'py'), 'tk-k', 'def'));
ok('py 函数名', has(H('def f():', 'py'), 'tk-f', 'f'));
ok('py 数字：0x / 下划线 / 指数', has(H('0xFF + 1_000 + 3.5e-2', 'py'), 'tk-n', '3.5e-2'));
ok('py 字符串前缀 r""', has(H('r"a\\db"', 'py'), 'tk-s', 'r"a\\db"'));
ok('py 字符串前缀 f"" 整串一个色块', has(H('f"a{b}"', 'py'), 'tk-s', 'f"a{b}"'));
ok('py 未闭合字符串不抛且着成字符串', has(H('x = "abc', 'py'), 'tk-s', '"abc'));
ok('py 装饰器行首 @x 走预处理器色（tk-h）', has(H('@app.route', 'py'), 'tk-h', '@app.route'));
ok('py 矩阵乘 @ 是运算符', has(H('a @ b', 'py'), 'tk-o', '@'));
ok('py 内置函数名 print', has(H('print(1)', 'py'), 'tk-f', 'print'));

/* ---------- 5. JavaScript ---------- */
ok('js 关键字 var', has(H('var a', 'js'), 'tk-k', 'var'));
ok('js 正则：字符类里的 / 不结束', has(H('/[a/b]/g', 'js'), 'tk-s', '/[a/b]/g'));
ok('js 除号不当正则', has(H('a / b', 'js'), 'tk-o', '/'));
ok('js 行注释吞掉后面的正则', has(H('// /re/', 'js'), 'tk-c', '// /re/'));
ok('js 模板串不吞全文（收尾反引号正确关闭）',
  H('`a${b}c`', 'js').indexOf('<span class="tk-s">c`</span>') >= 0);
ok('js 三元 ?. 是运算符', has(H('a?.b', 'js'), 'tk-o', '?.'));
ok('mjs/cjs 也认', has(H('var a', 'mjs'), 'tk-k', 'var'));

/* ---------- 6. JSON ---------- */
ok('json 键着色', has(H('{"a":1}', 'json'), 'tk-v', '"a"'));
ok('json true 是常量色', has(H('{"a":true}', 'json'), 'tk-m', 'true'));
ok('json null 是常量色', has(H('{"a":null}', 'json'), 'tk-m', 'null'));
ok('json 数字', has(H('{"a":1}', 'json'), 'tk-n', '1'));

/* ---------- 7. CSS ---------- */
ok('css 注释', has(H('/* hi */', 'css'), 'tk-c', '/* hi */'));
ok('css 属性名', has(H('a{color:red}', 'css'), 'tk-v', 'color'));
ok('css 字符串里的大括号不改变层级', has(H('a{content:"a{}b"}', 'css'), 'tk-s', '"a{}b"'));
ok('css 值不当关键字', H('a{color:red}', 'css').indexOf('tk-k">red') < 0);

/* ---------- 8. HTML / XML ---------- */
ok('html 标签名', has(H('<div>', 'html'), 'tk-k', 'div'));
ok('html 属性名', has(H('<a href="x">', 'html'), 'tk-v', 'href'));
ok('html 属性值', has(H('<a href="x">', 'html'), 'tk-s', '"x"'));
ok('html 注释', has(H('<!-- hi -->', 'html'), 'tk-c', '&lt;!-- hi --&gt;'));
ok('html 内嵌 js：var 被识别', has(H('<script>var a=1;</script>', 'html'), 'tk-k', 'var'));
ok('html 内嵌 css：属性名被识别', has(H('<style>a{color:red}</style>', 'html'), 'tk-v', 'color'));
ok('html 遇 </script 即结束（浏览器行为）',
  H('<script>var s="</script>"</script>', 'html').indexOf('tk-s">"</span>') >= 0);
ok('xml 自闭合标签不吞后文', H('<a/><b/>', 'xml').indexOf('tk-k">b') >= 0);
ok('svg 走 markup', has(H('<path d="M0"/>', 'svg'), 'tk-k', 'path'));

/* ---------- 9. 与 spec 不一致的三处（先如实记录，不假装合规） ---------- */
/* §四.1 说行首三引号按伪注释灰显；实现按字符串。两种都能自圆其说，
   但「文档串是字符串」更接近 Python 语义，倾向保留实现、改规范。 */
ok('【偏差1】"""doc""" 着成字符串而非注释', has(H('"""doc"""', 'py'), 'tk-s', '"""doc"""'));
/* §四.6 要求 f-string 插值区再扫一遍；实现整串一个色块。 */
ok('【偏差2】f-string 不做插值（整串字符串色）',
  H('f"{a}"', 'py').indexOf('<span class="tk-s">f"{a}"</span>') >= 0);
/* §四.4 要求 match/case/type 需上下文门控；实现一律当关键字。 */
ok('【偏差3】match 无条件当关键字',
  has(H('match = 1', 'py'), 'tk-k', 'match'));

console.log('\n结果: ' + pass + ' 通过 / ' + fail + ' 失败');
process.exit(fail ? 1 : 0);