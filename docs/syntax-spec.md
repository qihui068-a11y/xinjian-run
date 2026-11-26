# 信笺 · 语法定义规范 `syntax-spec.md`

**版本**：schemaVersion `1.0`
**状态**：待评审
**适用范围**：`app/highlight.js` 重写、内置 7 种语言、用户导入语法文件（JSON）

---

## 零、一句话原则

> **高亮器是一个按优先级排序的词法扫描器，不是解析器。**
> 它只认「字符序列长什么样」，不认「这句话语法上是什么」。
> 凡是需要上下文才能判定的事，要么写成明确的启发式规则，要么如实承认做不到。
> **规则必须可执行，声明不下来的东西不要写进 schema。**

---

## 一、判定顺序（这是本规范的核心，比字段清单重要）

扫描器从左到右逐字符推进，在每个位置按以下**顺序**尝试匹配，命中即消费，不再尝试后面的规则。

```
① 块注释        blockComment  （含「伪注释」，见 §四.1）
② 行注释        lineComment
③ 字符串        string        （前缀感知，见 §四.2）
④ 数字          number
⑤ 标识符        → 关键字 / 常量 / 软关键字 / 普通标识符
⑥ 运算符        operators     （最长匹配，见 §四.3）
⑦ 其他         原样输出（必须 HTML 转义）
```

### 为什么是这个顺序

| 顺序 | 理由 |
|---|---|
| 注释在字符串**前面** | `# 这里是 "引号"` 不能因为引号就开始字符串 |
| 块注释在伪注释判定里做了特例 | `"""` 与 `'''` 同时是块注释和字符串分隔符，靠前缀区分（§四.1） |
| 字符串在关键字前面 | `"if"` 里的 `if` 不是关键字 |
| 数字在标识符前面 | `0x1F` 不能先被当标识符 |
| 运算符用最长匹配 | `<<=` 必须整体识别，不能被拆成 `<` `<` `=` |

### markup / css 模式的差异

| mode | 扫描起点 | 与 keyword 模式的差别 |
|---|---|---|
| `keyword` | 从 0 开始 | 就是上表 |
| `markup` | 从 0 开始 | 遇到 `<` 进入「标签态」，标签态内才认属性名/属性值；`<!--` 优先进注释；`<![CDATA[` 整体进 CDATA |
| `css` | 从 0 开始 | 维护一个「是否在 `{}` 内」的栈：块外认选择器、at-rule；块内认属性名（到 `:` 为止）、属性值 |

**markup 的标签态是最容易写错的地方，规则写死如下：**

```
看到 '<'
  ├─ 后面是 "!--"     → 块注释，直到 "-->"，整体灰显
  ├─ 后面是 "![CDATA[" → CDATA（仅当 cdata:true），直到 "]]>"，整体按字符串色
  ├─ 后面是 "/"       → 结束标签名，直到 '>'，标签名按标签色
  ├─ 后面是 "?"       → 处理指令，直到 "?>"，整体按注释色
  └─ 其他             → 开始标签：标签名 / 空白 / 属性名 / '=' / 属性值(带引号或不带) / 自闭合 '/>' / '>'
                        '>' 之后回到文本态，直到下一个 '<'
```

文本态里，`&nbsp;` 这类实体按原样输出（不着色）。

---

## 二、字段规范

### 2.1 通用（所有 mode 必填）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `schemaVersion` | string | ✅ | 固定 `"1.0"`。未来 1.x 只允许**新增可选字段**，不改已有语义 |
| `name` | string | ✅ | 显示名，如 `"Python"`。同 ext 冲突时用于提示 |
| `ext` | string[] | ✅ | 文件后缀，**不含点**、全小写、长度 1–10、不可重复 |
| `mode` | string | ✅ | `keyword` / `markup` / `css` 三选一 |
| `blockComment` | array | 可选 | `[[起, 止], ...]`，默认 `[]` |
| `lineComment` | string | 可选 | 单一起始符，无则 `null` |
| `string` | object | 可选 | 见 2.2，无则 `null` |
| `number` | bool | 可选 | 默认 `true`。只区分「是数字/不是数字」，不做进制细分着色 |

### 2.2 `string` 对象

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `quotes` | string[] | `[]` | 单行字符串的起始=结束符 |
| `multiline` | string[] | `[]` | 多行字符串分隔符（可成对，也可自闭合，如 `"""`） |
| `prefixes` | string[] | `[]` | 前缀列表，如 `["r","b","f","rb"]` |
| `prefixCaseInsensitive` | bool | `true` | 前缀是否大小写不敏感 |
| `escape` | string | `"\\"` | 转义符；`null` 表示无转义 |
| `rawNoEscape` | bool | `false` | `true` 时该前缀下转义符**不生效**（`r"\""` 遇 `"` 即结束） |

`prefixes` 与 `rawNoEscape` 的配合：需要「哪些前缀是 raw」时，**以前缀里是否含 `r` 判断**（大小写不敏感）。这是约定，不额外加字段。

### 2.3 `keyword` 模式专属

| 字段 | 类型 | 说明 |
|---|---|---|
| `keywords` | string[] | 语言关键字 |
| `constants` | string[] | 常量字面量（`None`/`True`/`False`/`null`），与 keywords 分开着色 |
| `softKeywords` | string[] | **仅上下文内**视为关键字，判定规则见 §四.4 |
| `operators` | string[] | 运算符，按**长度降序**参与匹配 |
| `decorator` | string | 如 `"@"`，判定规则见 §四.5 |
| `caseSensitive` | bool | 默认 `true`；`false` 时 HTML 标签、SQL 关键字等用 |
| `indentSensitive` | bool | 默认 `false`。**不影响高亮**，供编辑器回车自动缩进用 |
| `indentUnitHint` | int | 默认 `4`。仅建议值，不是语法规则 |
| `interpolation` | bool | 默认 `false`。`true` 时启用插值扫描，规则见 §四.6。内置：Python / JavaScript 为 `true` |
| `regexLiteral` | bool | 默认 `false`。`true` 时把 `/…/flags` 识别为正则，规则见 §四.7。内置：JavaScript 为 `true` |

### 2.4 `markup` 模式专属

| 字段 | 类型 | 说明 |
|---|---|---|
| `void` | string[] | 自闭合标签，供编辑器缩进用；`caseSensitive:false` 时按小写匹配 |
| `cdata` | bool | 是否支持 `<![CDATA[...]]>` |
| `embed` | object | 可选。`{"script":"js","style":"css"}` ——`<script>`/`<style>` 内容移交给对应语言扫描，规则见 §四.8 |

`markup` 模式**不允许**出现 `keywords`（校验时若两者同时存在，以 `mode` 为准并给出警告，不报错）。

### 2.5 `css` 模式专属

除 `blockComment: [["/*","*/"]]`、`string` 外无额外必填。属性名与属性值靠**位置**区分，不枚举。

### 2.6 已删除、不要再加的字段

| 字段 | 删除理由 |
|---|---|
| `mime` | 本地应用无 MIME 分发路径，靠 `ext` 识别即可 |
| `version` | 与 `schemaVersion` 语义重叠，改用 `schemaVersion` |
| `operatorPriority` | 装的是「上下文规则」不是「优先级」，继续加会变成规则垃圾场；特例写死在内置扫描器里 |
| `brackets` | 括号配对是**编辑器行为**不是语言定义；`()[]{}` 各语言通用，按 mode 内置 |
| `lineContinuation` | 对高亮无影响（续行的下一行照常扫描） |
| `pythonVersions` | 不是可比较的版本号；高亮所需的全部版本差异已由 `softKeywords` 表达 |
| `number` 的六项细分 | 六项都着同一个色，留字段只会让实现者以为要分色 |

---

## 三、着色类别（token class）

样式上用 `.tok-<class>`，共 8 类，**不允许新增**（新增要改 CSS 和主题测试）：

| class | 用途 | 举例 |
|---|---|---|
| `tok-c` | 注释（含伪注释 docstring） | `# …`、`<!-- … -->`、`/* … */` |
| `tok-s` | 字符串 | `"abc"`、`r"a\b"` |
| `tok-n` | 数字 | `42`、`0x1F`、`1_000` |
| `tok-k` | 关键字 | `def`、`class` |
| `tok-const` | 常量字面量 | `None`、`True`、`null` |
| `tok-fn` | 函数/方法名 | `def foo(` 里的 `foo` |
| `tok-tag` | 标签名 / 属性名（markup、css） | `<div>`、`color:` |
| `tok-op` | 运算符 | `+=`、`->` |

---

## 四、六条实现规则（必须写进代码，无法从字段推导）

### 4.1 伪注释：三引号谁赢

`blockComment` 与 `string.multiline` 可能定义同一对分隔符（Python 的 `"""`）。

> **前缀优先于伪注释。**
> 遇到三引号：前面**紧跟** `string.prefixes` 里的某个前缀 → 按**字符串**处理；否则 → 按**块注释**（灰显）处理。

```
"""docstring"""     → tok-c（注释色）
r"""C:\path"""      → tok-s（字符串色，且 raw 不转义）
f"""hi {x}"""       → tok-s
```

这条规则的价值：docstring 灰显好看，但 `r"""…"""` 是数据不是注释，不能一起灰掉。

### 4.2 raw 字符串的结束判定

> `rawNoEscape` 生效时，**遇到结束引号即结束，不检查前一个字符是不是 `\`。**

否则 `r"C:\"` 这类（虽然 Python 里非法）会让扫描器一路吃到文件末尾，把后面整篇都染成字符串——这是最典型的「一个字符毁掉整个文件」的 bug。

### 4.3 运算符最长匹配

> 把 `operators` 按**字符长度降序**排序后依次尝试。

保证 `<<=`、`**=`、`===`、`->` 不被拆成两个 token。`...` 必须在 `.` 之前尝试（`. ` 本身通常不在 operators 里，但为防冲突仍按长度排）。

### 4.4 软关键字（`softKeywords`）

纯词法层没有语法上下文，因此：

> 软关键字**仅当**满足以下全部条件时按关键字着色，否则按普通标识符：
> 1. 位于行内第一个非空白位置（允许前面有缩进）；
> 2. 从它到本行末尾（**剔除行注释后**）的内容，匹配 `^\s*<词>\b.*:\s*$`。

即 `match x:` / `case [1, 2]:` / `type X = int` 中的 `type` 单独处理：
- `match` / `case`：要求行尾是 `:`
- `type`：要求行内出现 `=`

**`_` 不在软关键字里。** 它在 match 里是通配模式，但在 `for _ in range(10)`、`_("转义")` 里都是普通标识符，着色成关键字会满屏异味。

### 4.5 装饰器

> `decorator` 字符（Python 为 `@`）**仅当**位于行内第一个非空白位置、且后一个字符是标识符起始字符时，按 `tok-fn` 着色；否则按 `tok-op`（矩阵乘 `a @ b`）。

### 4.6 插值（`interpolation: true`）

**触发条件**：该语言的 `interpolation` 为 `true`。

| 语言 | 插值载体 | 插值区 |
|---|---|---|
| Python | 前缀含 `f`（大小写不敏感）的字符串 | `{ … }` |
| JavaScript | 反引号模板串 | `${ … }` |

**规则**：

1. 只有「满足载体条件」的字符串才进插值扫描，其余字符串一律整串 `tok-s`。
2. 插值区内部**用该语言的主扫描器再扫一遍**（关键字/常量/数字/字符串/运算符全部生效），所以 `f"{x if ok else y}"` 里的 `if`/`else` 是关键字色。
3. **结束判定用花括号计数**，不是遇到第一个 `}`：

   ```
   f"{ {'a':1}['a'] }"     ← 内部的 { } 配对，不能提前结束
   ${ {a:1}.a }            ← 同理
   ```

4. Python 的 `{{` / `}}` 是**转义的字面花括号**，不进入插值区。
5. **递归深度上限 2**：插值区里再遇到同类字符串，按普通字符串处理，不再往下插值。
   - `f"{d['k']}"` → `d['k']` 正常着色，`'k'` 是字符串色 ✅
   - `f"{f'{x}'}"` → 内层 `f'…'` 只按字符串着色，不再插值（已知边界）
6. 任何异常 → 整串降级为 `tok-s`，**不抛错、不中断整篇扫描**。

### 4.7 JS 正则字面量（`regexLiteral: true`）

**难题**：`/` 既是除号也是正则起始。判定唯一依据是**前一个有意义 token**（跳过空白与注释）：

| 前一个有意义 token | `/` 的含义 |
|---|---|
| 标识符、数字、字符串结束、`)`、`]`、`}`、`++`、`--` | **除号** |
| 其他（运算符、`(`、`[`、`{`、`,`、`;`、`return`/`typeof` 等关键字之后、或行首） | **正则起始** |

**正则内部规则**：

1. `\` 转义下一个字符（`\/` 不结束）。
2. `[ … ]` 字符类内的 `/` **不结束**（`/[a/b]/` 是一个正则）。
3. 未转义的 `/` 结束正则体。
4. 结束后接可选 flags（`[a-z]*`），整体按 `tok-s`（与字符串同色，视觉上够了）。

**已知误判**：极少数依赖「上一行结尾」的场景（如 `return\n/re/`）会判成正则而实际是除号。这是所有不做语法分析的编辑器共同的问题（含 VS Code 的 TextMate 语法），**接受**。

### 4.8 嵌套嵌入（markup 的 `embed`）

HTML 里 `<script>` 和 `<style>` 的内容是 JS/CSS，占一个真实文件的一半代码量——不嵌就等于 HTML 只支持了一半。

| 触发 | 交出给 | 结束判定 |
|---|---|---|
| `<script …>` | JS 扫描器 | 内容里出现 `</script`（**不区分大小写**） |
| `<style …>` | CSS 扫描器 | 内容里出现 `</style`（不区分大小写） |

**为什么结束判定这么「粗暴」**：这就是浏览器规范的实际行为——HTML 解析器在 `<script>` 里遇到 `</script` 就结束，不管它在不在 JS 字符串里。**照浏览器行为做，不是偷懒。**

其余约束：

1. 只嵌一层。HTML 里的 JS 不会再去嵌 CSS。
2. `embed` 指向的语言不存在（用户删掉了自定义 JS）→ 内容按普通文本输出，不报错。
3. `<script>` 标签本身的属性仍按 markup 规则着色，只有内容区移交给子扫描器。

---

## 五、内置 7 种语言定义

以下为**定稿内容**，实现时原样写入 `syntax-builtin.js`。

### 5.1 Python

```json
{
  "schemaVersion": "1.0",
  "name": "Python",
  "mode": "keyword",
  "ext": ["py", "pyw", "pyi"],
  "caseSensitive": true,

  "keywords": ["def","class","return","if","elif","else","import","from","as",
    "for","while","break","continue","pass","try","except","finally","raise",
    "with","lambda","yield","global","nonlocal","assert","del","and","or","not",
    "in","is","async","await"],
  "constants": ["None","True","False","Ellipsis"],
  "softKeywords": ["match","case","type"],

  "lineComment": "#",
  "blockComment": [["\"\"\"","\"\"\""],["'''","'''"]],

  "string": {
    "quotes": ["\"","'"],
    "multiline": ["\"\"\"","'''"],
    "prefixes": ["r","b","u","f","rb","br","fr","rf"],
    "prefixCaseInsensitive": true,
    "escape": "\\",
    "rawNoEscape": true
  },

  "number": true,
  "operators": ["**=","//=",">>=","<<=","==","!=","<=",">=","+=","-=","*=","/=",
                "%=","&=","|=","^=","**","//","<<",">>",":=","->","...",
                "+","-","*","/","%","@","=","<",">","&","|","^","~",":",","],
  "decorator": "@",
  "indentSensitive": true,
  "indentUnitHint": 4,
  "interpolation": true
}
```

### 5.2 Java

```json
{
  "schemaVersion": "1.0",
  "name": "Java",
  "mode": "keyword",
  "ext": ["java"],
  "caseSensitive": true,

  "keywords": ["abstract","assert","boolean","break","byte","case","catch","char",
    "class","const","continue","default","do","double","else","enum","extends",
    "final","finally","float","for","goto","if","implements","import","instanceof",
    "int","interface","long","native","new","package","private","protected",
    "public","return","short","static","strictfp","super","switch","synchronized",
    "this","throw","throws","transient","try","void","volatile","while","var",
    "record","sealed","permits","yield","non-sealed"],
  "constants": ["true","false","null"],

  "lineComment": "//",
  "blockComment": [["/*","*/"]],
  "string": {
    "quotes": ["\"","'"],
    "multiline": ["\"\"\""],
    "prefixes": [],
    "prefixCaseInsensitive": false,
    "escape": "\\",
    "rawNoEscape": false
  },
  "number": true,
  "operators": [">>>=","<<=",">>=",">>>","==","!=","<=",">=","&&","||","++","--",
                "+=","-=","*=","/=","%=","&=","|=","^=","<<",">>","->","::",
                "+","-","*","/","%","=","<",">","&","|","^","~","!","?",":",".",","],
  "indentSensitive": false,
  "indentUnitHint": 4,
  "interpolation": false
}
```

> 注：Java 的 `"""` 是 text block（Java 15+），当多行字符串处理。

### 5.3 JavaScript

```json
{
  "schemaVersion": "1.0",
  "name": "JavaScript",
  "mode": "keyword",
  "ext": ["js","mjs","cjs","jsx"],
  "caseSensitive": true,

  "keywords": ["await","async","break","case","catch","class","const","continue",
    "debugger","default","delete","do","else","export","extends","finally","for",
    "from","function","get","if","import","in","instanceof","let","new","of",
    "return","set","static","super","switch","this","throw","try","typeof","var",
    "void","while","with","yield"],
  "constants": ["true","false","null","undefined","NaN","Infinity"],

  "lineComment": "//",
  "blockComment": [["/*","*/"]],
  "string": {
    "quotes": ["\"","'","`"],
    "multiline": [],
    "prefixes": [],
    "prefixCaseInsensitive": false,
    "escape": "\\",
    "rawNoEscape": false
  },
  "number": true,
  "operators": ["===","!==","**=","<<=",">>=",">>>","==","!=","<=",">=","&&","||",
                "??","++","--","+=","-=","*=","/=","%=","&=","|=","^=","**",
                "<<",">>","=>","?.","...",
                "+","-","*","/","%","=","<",">","&","|","^","~","!","?",":",","],
  "indentSensitive": false,
  "indentUnitHint": 2,
  "interpolation": true,
  "regexLiteral": true
}
```

> 注：反引号模板串里的 `${…}` 按 §四.6 做插值扫描；`/…/flags` 按 §四.7 识别为正则。

### 5.4 JSON

```json
{
  "schemaVersion": "1.0",
  "name": "JSON",
  "mode": "keyword",
  "ext": ["json","jsonc"],
  "caseSensitive": true,
  "keywords": [],
  "constants": ["true","false","null"],
  "lineComment": null,
  "blockComment": [],
  "string": {
    "quotes": ["\""],
    "multiline": [],
    "prefixes": [],
    "prefixCaseInsensitive": false,
    "escape": "\\",
    "rawNoEscape": false
  },
  "number": true,
  "operators": [":",",","[","]","{","}"],
  "indentSensitive": false,
  "indentUnitHint": 2,
  "interpolation": false
}
```

### 5.5 HTML

```json
{
  "schemaVersion": "1.0",
  "name": "HTML",
  "mode": "markup",
  "ext": ["html","htm","xhtml"],
  "caseSensitive": false,
  "blockComment": [["<!--","-->"]],
  "string": {
    "quotes": ["\"","'"],
    "multiline": [],
    "prefixes": [],
    "prefixCaseInsensitive": false,
    "escape": null,
    "rawNoEscape": false
  },
  "void": ["area","base","br","col","embed","hr","img","input","link","meta",
           "param","source","track","wbr"],
  "cdata": false,
  "embed": { "script": "js", "style": "css" },
  "indentSensitive": false,
  "indentUnitHint": 2
}
```

### 5.6 XML

```json
{
  "schemaVersion": "1.0",
  "name": "XML",
  "mode": "markup",
  "ext": ["xml","svg","plist","xsd","xsl"],
  "caseSensitive": true,
  "blockComment": [["<!--","-->"]],
  "string": {
    "quotes": ["\"","'"],
    "multiline": [],
    "prefixes": [],
    "prefixCaseInsensitive": false,
    "escape": null,
    "rawNoEscape": false
  },
  "void": [],
  "cdata": true,
  "indentSensitive": false,
  "indentUnitHint": 2
}
```

> XML 没有内置标签名，也不能枚举。标签名统一用 `tok-tag`，不做「已知/未知」区分。

### 5.7 CSS

```json
{
  "schemaVersion": "1.0",
  "name": "CSS",
  "mode": "css",
  "ext": ["css"],
  "caseSensitive": false,
  "lineComment": null,
  "blockComment": [["/*","*/"]],
  "string": {
    "quotes": ["\"","'"],
    "multiline": [],
    "prefixes": [],
    "prefixCaseInsensitive": false,
    "escape": "\\",
    "rawNoEscape": false
  },
  "number": true,
  "indentSensitive": false,
  "indentUnitHint": 2
}
```

---

## 六、支持范围与边界

**原则**：凡是在这 7 种语言里**正常写代码就会遇到**的东西，全部支持。只有「需要真正语法分析才能判断」的才不做，并且要说明为什么。

### 6.1 全部支持的能力

| 能力 | 支持到什么程度 | 实现代价 |
|---|---|---|
| 软关键字 | `match`/`case` 需行首 + 行尾冒号；`type` 需行首 + 行内有 `=` | 一行正则 |
| **f-string 插值** | `f"{x}"`、`f"{x if a else b}"`、`f"{ {'k':1}['k'] }"`（花括号计配对）、`{{`转义 | 递归扫描，深度上限 2 |
| **JS 模板插值** | `` `${x}` ``、`` `${ {a:1}.a } `` | 同上 |
| **JS 正则字面量** | `/ab+c/gi`、`/[a/b]/`、`\/` 转义；靠前一个 token 区分除号 | 前 token 判定 |
| **HTML 嵌 JS/CSS** | `<script>`→JS、`<style>`→CSS，结束判定照浏览器行为 | 一层移交 |
| 数字 | 十进制/十六进制/八进制/二进制/浮点/指数/下划线分隔，统一一种颜色 | 一条正则 |
| CSS 位置着色 | 块外选择器、块内属性名/值，`content:"{}"` 里的花括号不影响层级 | 大括号栈 |
| 大文件 | 见 6.2 | 分块 + 防抖 |

### 6.2 性能策略（不是「不支持」，是「怎么保证不卡」）

| 文件大小 | 行为 |
|---|---|
| ≤ 256 KB | 实时高亮。输入防抖 **120 ms**；只重扫「视口 ± 200 行」，其余沿用上次结果（按行分块缓存） |
| 256 KB – 2 MB | 默认关闭实时高亮，纯文本编辑；顶部一条提示「文件较大，已暂停实时高亮」+ 按钮「仍要开启」 |
| > 2 MB | 拒绝开启高亮，明确提示体积和原因 |

**必须满足**：着色一律异步分块执行（每片 ≤ 50 行，`setTimeout` 切片），**任何情况下都不能阻塞输入**。打字时宁可先染色错位再修正，也不能出现按键延迟。

### 6.3 真正不做的，只有一类

> **需要完整语法分析才能正确判断的：JSX/TSX 组件语法、TypeScript 的类型擦除、SQL 方言差异。**

理由：这些不是「词法多写几条规则」能解决的，硬做出来的误着色比不着色更糟（比如把 `<>` 判成标签还是比较，需要知道上下文）。而且**它们不在你列的 7 种语言里**。

如果以后要加 TS/JSX，正确做法是引入一个真正的解析器，而不是继续往词法规则里堆特例。

### 6.4 明确的已知误判（接受）

| 场景 | 现象 | 为什么接受 |
|---|---|---|
| `return\n/re/` | 判成正则而实际是除号 | 所有不做语法分析的编辑器（含 VS Code 的 TextMate 语法）都这样 |
| `f"{f'{x}'}"` | 内层不再插值 | 深度上限 2，避免无限递归 |
| 极长的单行压缩代码 | 分块边界可能切在 token 中间，短暂错色 | 下一次重扫会修正 |

---

## 七、导入校验规则（用户导入 JSON 时逐条检查）

按顺序执行，**任一项失败则整份拒收**，并回报具体原因（第几项、哪个字段）：

1. 文件存在、可读、≤ 64 KB
2. 是合法 JSON（解析失败要报出**行号/列号**）
3. `schemaVersion` 存在且主版本为 `1`
4. `name` 存在、非空、≤ 32 字符
5. `ext` 是非空字符串数组，每项匹配 `^[a-z0-9]{1,10}$`，无重复
6. `mode` ∈ `{keyword, markup, css}`
7. 按 mode 检查必填：
   - `keyword` → `keywords` 必须是数组（可为空数组）+ `operators` 可选
   - `markup` → `void` 可选、`cdata` 布尔
   - `css` → 无额外必填
8. `blockComment` 是 `[[string,string],...]`；`lineComment` 是 string 或 null
9. `string.multiline` 与 `blockComment` 的分隔符重叠时，**不拒收**，按 §四.1 的「前缀优先于伪注释」处理，同时向用户回一条提示：「`"""` 同时定义为注释和字符串，无前缀时按注释（灰显）处理」。这是 Python 的正式行为，不是错误
10. `number` 必须是布尔
11. **试扫描**：拿一段内置样例（每个 mode 一份，约 20 行）跑一遍扫描器，如果抛异常或返回空，拒收
12. 通过 → 写入 `xinjian/syntax/<name>.json`，并记录 ext 映射

### ext 冲突策略

| 情况 | 处理 |
|---|---|
| 与**内置**语言冲突（如导入一个 `html`） | **导入的优先**（用户就是要覆盖），UI 明确提示「已覆盖内置 HTML，可一键恢复」 |
| 与**其他导入的**语言冲突 | 后导入的覆盖前者，提示「已覆盖 xxx」 |
| 恢复内置 | 设置页提供「恢复内置语法」按钮，删除对应导入文件即可 |

### 落盘格式

```
<存储位置>/syntax/
  ├─ python.json     ← 内置，程序生成，只读
  ├─ ...
  └─ user-xxx.json   ← 导入的，可删
```

内置定义也落盘一份，好处是用户可以直接照抄改。

---

## 八、与现有代码的衔接

| 现有 | 改造 |
|---|---|
| `highlight.js` 的 `tokenizeBF` / `tokenizeCFamily` | **保留**（书稿 `.bf` 是自有格式），新扫描器并行存在，`highlight(text, ext)` 里按 ext 分派 |
| `highlight.js` 的 `highlight(text, ext)` | 改为查「语言表」，找不到则纯转义输出（现状行为不变） |
| `.bf` 的样式类 | 现有类名兼容；新扫描器用 §三 的 8 类，CSS 新增对应规则 |
| `views/editor.js` 的 `HL.highlight(v, ext)` | 调用点不变，只换实现 |
| `md.js` 代码块 | 同上，自动受益 |

**`.bf` 不纳入这套 schema**（它是书稿自有标记，不是通用语言），继续走 `tokenizeBF`。

---

## 九、已确认的决策

| # | 决策 | 结论 |
|---|---|---|
| 1 | 伪注释：`"""docstring"""` 灰显，`r"""…"""` 按字符串 | **通过** |
| 2 | ext 冲突：导入的覆盖内置，可撤回、可一键恢复 | **通过** |
| 3 | 支持范围 | **全部支持正常写法**：f-string 插值、JS 模板插值、JS 正则字面量、HTML 嵌 JS/CSS 全部要做。真正不做的只有「需要完整语法分析」的 JSX/TS，且不在 7 种语言内（§六） |

---

## 十、验收用例矩阵

**这些用例就是 `tests/syntax.js` 的内容。** 每一条都是「输入 → 期望的着色结果」，实现完必须全绿、反证必须变红。

### Python

| # | 输入 | 期望 |
|---|---|---|
| P1 | `f"{name}"` | `name` 是标识符色，**不是**字符串色 |
| P2 | `f"{x if ok else y}"` | `if`/`else` 是关键字色 |
| P3 | `f"{ {'a':1}['a'] }"` | 花括号配对正确，`1` 是数字色，不提前结束 |
| P4 | `f"{{x}}"` | 整串字符串色，`x` **不**插值（转义花括号） |
| P5 | `r"""a\b"""` | 字符串色，且 `\b` 不触发转义吞字 |
| P6 | `"""doc"""` | 注释色（伪注释） |
| P7 | `@decorator` | `@`+名字 按 `tok-fn` |
| P8 | `a @ b` | `@` 按 `tok-op` |
| P9 | `match x:` | `match` 关键字色 |
| P10 | `match = 1` | `match` **普通标识符色** |
| P11 | `# 这里有 "引号"` | 整行注释色，不开始字符串 |
| P12 | `0x1F 1_000 1e-3` | 全为数字色 |

### JavaScript

| # | 输入 | 期望 |
|---|---|---|
| J1 | `/ab+c/gi` | 正则色（同字符串） |
| J2 | `a / b` | `/` 是运算符色 |
| J3 | `/[a/b]/` | 字符类里的 `/` 不结束 |
| J4 | `a.replace(/x/g, 'y')` | 正则 + 字符串各自正确 |
| J5 | `` `hi ${name}` `` | `name` 标识符色 |
| J6 | `` `${ {a:1}.a }` `` | 花括号配对，`1` 数字色 |
| J7 | `// 注释里的 /regex/` | 整行注释色，不识别正则 |

### HTML

| # | 输入 | 期望 |
|---|---|---|
| H1 | `<div class="x">` | 标签名 tag 色、属性名 tag 色、`"x"` 字符串色 |
| H2 | `<!-- c -->` | 注释色 |
| H3 | `<script>var a=1</script>` | `var` 关键字色、`1` 数字色（**已嵌 JS**） |
| H4 | `<style>.a{color:red}</style>` | `.a` 选择器、`color` 属性名、`red` 值（**已嵌 CSS**） |
| H5 | `<br>` | 识别为 void 标签 |
| H6 | 文本里的 `&amp;` | 原样，不着色 |
| H7 | `<script>var s="</script>"</script>` | 在 `</script` 处结束（照浏览器行为，**这是正确的**） |

### XML / CSS / JSON

| # | 输入 | 期望 |
|---|---|---|
| X1 | `<![CDATA[ <a> ]]>` | 整段字符串色，里面不被当标签 |
| C1 | `.a{color:red}` | 块外 `.a`、块内 `color`/`red` 分色 |
| C2 | `content:"a{}b"` | 字符串里的 `{}` **不改变**大括号层级（否则后面全乱） |
| C3 | `/* c */` | 注释色 |
| JS1 | `{"a":1,"b":true}` | 键字符串色、`true` 常量色、`1` 数字色 |

### 跨界

| # | 场景 | 期望 |
|---|---|---|
| M1 | 未知扩展名 `.xyz` | 纯转义输出，与现状行为一致，不报错 |
| M2 | 空文件 / 只有空白 | 不抛异常，输出空 |
| M3 | 未闭合的 `"` 一直到文件末尾 | 到末尾都是字符串色，**不抛异常** |
| M4 | 未闭合的 `"""` | 同上 |
| M5 | 未闭合的 `<!--` | 同上 |
| M6 | `.bf` 书稿 | 仍走 `tokenizeBF`，**不受影响** |