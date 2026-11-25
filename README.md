# 信笺·运行版 0.7

0.7 沿用应用 ID `tt.xinjian.cn.codeedit.run`，从此版本开始使用新签名。0.5 和 0.6 运行版用户需先在书架导出文件，卸载旧版后安装 0.7，再导入。书架导出只包含文件，卸载会清除旧版的本地设置和聊天记录。0.4 代码版可并存安装。

## 编辑器

打开已有文件或新建文件，顶栏按钮会随文件类型变化。执行时读取当前编辑内容，可在下方查看结果、输出和报错。

编辑态可用顶栏的「格式化」在本地整理缩进和换行。底部符号栏随文件类型切换，可横向滑动。引号和括号键会包住选中的文字，或把光标放在新插入的一对符号中间。点右侧的「＋」可添加或移除当前语言的自定义符号。自定义符号保存在设备上，同语言的文件共用。

| 文件 | 功能 |
| --- | --- |
| JS、MJS、CJS | 单文件 QuickJS 离线运行。支持 console 及 Promise 微任务，执行限时约 3 秒，可停止。MJS 支持单文件模块；CJS 支持 module.exports。未接入模块依赖、浏览器 DOM、定时器及 Node.js API。 |
| Python、Java、C、C++、C# | 单文件在线运行。可先填多行标准输入，再点「发送并运行」，此时才向 wandbox.org 发送代码和输入。结果包含编译诊断、标准输出或运行错误。取消等待会中止客户端请求，远端作业可能继续运行。 |
| BF | 单文件在线 C 兼容模式，支持 C 风格 main、printf、嵌套的 /(...) 注释及 #hand &lt;stdio.h&gt; 等标准库头。工程仅提供词法着色，没有 BF 官方执行规范。over!、run_r 等专用语法不在兼容范围内。 |
| BFH | 使用上述兼容模式，将头文件纳入独立的 C 翻译单元做编译和链接检查。 |
| HTML、CSS、Markdown、TXT | 本地预览。HTML 渲染静态页面及内联样式；CSS 应用到含 main、.container、.card、h1、p、.btn 的示例页面。外部资源与页面脚本不加载。 |
| JSON、JSONC、XML | 本地语法校验。XML 检查文档格式，不做 XSD 验证。 |

在线运行依赖 Wandbox 的可用性。使用 CPython 3.13、OpenJDK 22、GCC 13（C++17）及 Mono 6.12。适合带常规入口的命令行单文件程序。在线请求设置 save=false，不申请分享链接。

## 鸽屋局域网聊天

两台 Android 设备连到同一局域网，在「鸽屋」开启局域网聊天，选择发现的设备发文字。使用另一位开发者工程的鸽屋 v1 协议，UDP 45789 用于发现，TCP 45790 用于文字和送达回执。消息保存在本机。应用退到后台时暂停网络通信，返回前台后恢复。这一协议使用局域网明文传输。

## 构建与验证

modified 中已包含前端和打包后的离线引擎。使用 Apktool 2.12.1 执行 `apktool b modified -o unsigned.apk`，再用 Android SDK 的 zipalign 对齐并用 apksigner 签名。私钥独立管理。

若修改 QuickJS 适配代码，在 runner 目录运行 `npm ci` 和 `node build.cjs`。运行与预览入口位于 modified/assets/www/runner.js、run-formats.js 和 views/editor.js。许可证见 modified/assets/www/QuickJS-LICENSE.txt。

修改局域网 Java 层后，用 JDK、Android 34 的 `android.jar`、R8 8.8.34 和 Apktool 2.12.1 执行 `python native/lan/build.py <android.jar> <r8.jar> <apktool.jar>`，再按上面的步骤重新打包。

在工程根目录运行 `npm ci --prefix tests` 和 `node tests/regression.cjs`。安装 Python Playwright 和 Chromium 后执行 `python tests/run-preview.py` 检查面板、示例和错误路径（模拟在线服务）。设置 XJ_LIVE=1 后，测试会向 Wandbox 提交测试文件中专门编写的短示例。
