# 信笺·代码版 0.4-code

## 本版新增

在上版 Python、Java 与原有格式基础上，补齐 HTML、CSS、JavaScript、JSON、XML 的新建入口与输入实时彩色语法高亮。用户列出的七种格式现均可新建、编辑、保存和着色：

| 格式 | 默认后缀 |
| --- | --- |
| Python | .py |
| HTML | .html |
| CSS | .css |
| Java | .java |
| JSON | .json |
| JavaScript | .js |
| XML | .xml |

- 新建页共 14 种格式，保留 TXT、Markdown、C、C++、C#、BF、BFH。
- 格式名称和扩展名分两行显示，避免 JavaScript 名称与后缀挤在一起。
- HTML 支持标签、属性、实体、注释，以及内嵌 JavaScript、CSS 和 JSON 着色；XML 支持命名空间、声明、CDATA 与文档类型声明。
- CSS 支持选择器、属性、变量、颜色、数值单位和函数；JavaScript 支持关键字、字符串、模板插值、正则和注释；JSON 的键与字符串值区分着色。
- 输入、粘贴和中文输入结束后实时刷新；重命名后立即切换语言。深浅色主题均保留，源码与光标不被着色代码改写。
- 同时识别大小写后缀，以及 .htm/.xhtml、.mjs/.cjs/.javascript、.jsonc、.svg/.xsl/.xslt/.xsd/.rss、.pyw 等别名。
- Android 10 及以上导出时依据系统后缀表设置对应 MIME，不再把所有文件都标为 text/plain。具体系统 MediaProvider 的最终命名仍以设备验证为准。
- 这是词法着色和代码编辑器，不包含编译、运行、网页预览或完整语法诊断。JavaScript 正则/除法判别是词法启发式；Python f-string 整体着色，不单独解析插值。

## 安装说明

- 应用 ID：tt.xinjian.cn.codeedit；versionCode=4，versionName=0.4-code。
- 沿用 0.3 代码版的签名，可直接覆盖安装上一版代码版，无需卸载。
- 与最初的原版信笺是两个应用；从原版迁移笔记仍需先导出，再在代码版书架导入。
- 本次没有自动安装或操作手机上的笔记，原 APK 与上次交付文件均保持原样。
- 公共导出目录仍为手机“下载/信笺代码版”。
- 原有 Android 权限集合保持不变；最低 Android 5.0 / API 21，target API 34。

## 验证说明

自动回归包括：完整页面启动与 14 种格式入口、七种格式创建与实时输入着色、新旧词法器、HTML 内嵌语言、XML CDATA/DOCTYPE、后缀别名、源码转义与保真、未完成语法、随机输入、光标/滚动/IME 事件、模拟原生桥保存重开、重命名和保存失败恢复，以及每种约十万字符的扫描。

结果详见 [results.json](<tests/results.json>) 与 [build-report.json](<build-report.json>)。APK 需通过回编译、对齐及 v1/v2/v3 签名校验，并核对与 0.3 版相同的签名证书和应用 ID。

尚未进行 Android 真机安装验证。jsdom 不验证像素布局、真实系统输入法、Android 文件选择器、MediaProvider 或实际升级时的设备行为。

上版保留的编码边界不变：原生文件读写仍为 UTF-8，新建页 UTF-16/GBK 选择项不是本次实现的转码功能。

## 可编辑工程

这是反编译 APK 后的前端资源与 Smali 工程，不是原作者的原始 Java 工程；签名私钥和密码未包含在工程包中。

- 格式入口：[create.js](<modified/assets/www/views/create.js>)。
- 编辑器：[editor.js](<modified/assets/www/views/editor.js>)。
- 所有高亮词法器：[highlight.js](<modified/assets/www/highlight.js>)。
- 配色与布局：[style.css](<modified/assets/www/style.css>)。
- 回归测试：[regression.cjs](<tests/regression.cjs>)、[web-cases.cjs](<tests/web-cases.cjs>)。
- 与上版的差异：[changes-from-0.3.patch](<changes-from-0.3.patch>)。
- 与最初 APK 的差异：[changes-from-original.patch](<changes-from-original.patch>)。

在工程根目录执行：

```sh
npm ci --ignore-scripts --prefix tests
node tests/regression.cjs
apktool b modified -a "$(command -v aapt)" -o code-unsigned.apk
zipalign -p 4 code-unsigned.apk code-aligned.apk
```

自行回编译后请使用自己的证书签名。不同证书的同应用 ID 包不是本次交付签名的更新包。
