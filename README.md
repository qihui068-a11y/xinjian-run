# 信笺 0.8.2

当前版本为 0.8.2，沿用应用 ID `tt.xinjian.cn.codeedit.run` 和 0.7 的签名，可覆盖安装近期的同签名版本。0.5 和 0.6 运行版用户需先在书架导出文件，卸载旧版后安装新版，再导入。书架导出只包含文件，卸载会清除旧版的本地设置和聊天记录。0.4 代码版可并存安装。

## 界面

- 首页以圆角卡片展示书架、小镇、后院和小宿店。共享悬浮底栏提供主页、书架、鸽屋和小家四个入口，支持点按或拖动后松手切换。
- 鸽屋、书架与编辑器的锚点菜单随主题变色，支持展开和收起动效。鸽屋可使用页内搜索框，书架可从页内快捷入口或更多菜单新建文件。
- 书架的全部文件和最近打开采用同样的横向列表，支持文件搜索、新建和导入。新建时通过弹出列表选择文件格式，并可选择文件编码。
- Android 10 及以上默认跟随系统深浅色。点首页右上角的按钮可立即切换深浅色，应用会记住选择。系统字体大小应用于普通界面，编辑区独立缩放。
- 执行 `python tests/run-design.py` 可验证深浅色、主要页面和切换动效。设置 `XJ_SNAPSHOTS` 可保存测试截图。设置 `XJ_BASELINE_DIR` 可在同一浏览器和字体环境逐像素对比。

## 应用更新

从 0.7.2 起，启动时会检查 GitHub Releases。打开「小家 → 设置 → 应用更新」可手动检查、下载和安装。下载后会校验 SHA-256、应用 ID、版本和签名。安装由 Android 确认，部分设备首次安装时需要在系统设置中允许信笺安装应用。

0.7.19、0.8.0 和 0.8.1 可在应用内更新至 0.8.2。0.7.18 及更早的同签名版本需从 GitHub 下载 APK 手动覆盖安装。

发布正式更新时，递增 Android 的 `versionCode`，将 `versionName` 设为数字版本号，并沿用原发布签名。在 GitHub Releases 发布 `v版本号`，上传 `xinjian-run-版本号.apk` 后设为最新版。

## 编辑器

输入前缀可在符号栏上方点选离线补全。提示来自内置词表和当前文件，外接键盘也可用方向键选择并按回车或 Tab 确认。Python 支持块换行缩进，行首空格和退格按四列缩进位移动。Python、JSON、JSONC 和 XML 支持编辑时的语法错误提示，点击可跳到出错位置。

打开已有文件或新建文件后，可在标签之间切换。执行时读取当前编辑内容，可在独立结果区查看输出和报错，并复制、清空或放大。

编辑态可用顶栏的「格式化」在本地整理缩进和换行。底部符号栏随文件类型切换，可横向滑动。输入法弹出时，符号栏贴在键盘上沿。打开运行面板会收起符号栏，关闭后恢复。双指捏合可缩放代码和行号，拖动运行面板顶部的短横线可调整面板高度。引号和括号键会包住选中的文字，或把光标放在新插入的一对符号中间。点右侧的更多按钮可添加或移除当前语言的自定义符号。自定义符号保存在设备上，同语言的文件共用。

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

## 鸽屋的使用边界

鸽屋**只能在可信局域网里用**（家里的 WiFi、或只有你自己连的手机热点）。当前版本：

- 不做身份校验：同一个网络里的设备可以自称成任何人，也可以冒充你的好友。
- 传输是明文：同网段抓包即可还原聊天内容与图片。

所以咖啡厅、学校、共享办公这类公共 WiFi **不要开鸽屋**。这一条不是「以后再说」，
是当前协议的硬边界；要做公共网络，必须先补上身份与完整性（公钥交换 + 每帧 HMAC）。

## 构建与验证

modified 中已包含前端和打包后的离线引擎。使用 Apktool 2.12.1 执行 `apktool b modified -o unsigned.apk`，再用 Android SDK 的 zipalign 对齐并用 apksigner 签名。私钥独立管理。

要复现运行版 APK，先依次执行 `python runner/prepare-python.py`、`python runner/prepare-c.py` 和 `python runner/prepare-cpp.py`，再打包。

若修改 QuickJS 适配代码，在 runner 目录运行 `npm ci` 和 `node build.cjs`。运行与预览入口位于 modified/assets/www/runner.js、run-formats.js 和 views/editor.js。许可证见 modified/assets/www/QuickJS-LICENSE.txt。

修改局域网 Java 层后，用 JDK、Android 34 的 `android.jar`、R8 8.8.34 和 Apktool 2.12.1 执行 `python native/lan/build.py <android.jar> <r8.jar> <apktool.jar>`，再按上面的步骤重新打包。

键盘适配的原生源码位于 `native/keyboard`。改动后使用同一构建命令并追加 `--component keyboard` 生成 smali。

应用更新的原生源码位于 `native/update`。改动后使用同一构建命令并追加 `--component update` 生成 smali。

本地 Python 和 C 共用的 Android 输入通道位于 `native/python`。改动后使用 `--component python` 生成 smali。

试用本地 C 时，先运行 `python runner/prepare-c.py` 再打包。可在 `.c` 文件的运行面板选择「本地运行 C」，用 `scanf` 或 `fgets` 逐行输入。没有换行的提示文字可用 `fflush(stdout)` 立即显示。编译和运行在 Worker 中进行，程序只获得标准输入、输出和错误输出。实验版支持常见单文件 C 程序。浏览器验证可运行 `python tests/run-c.py`。

在工程根目录运行 `npm ci --prefix tests` 和 `node tests/regression.cjs`。安装 Python Playwright 和 Chromium 后执行 `python tests/run-preview.py` 检查面板、示例和错误路径（模拟在线服务）。设置 XJ_LIVE=1 后，测试会向 Wandbox 提交测试文件中专门编写的短示例。


### C++ 离线运行与 Java、C# 在线交互

需要本地 C++ 的测试构建先运行 `python runner/prepare-c.py`，再运行
`python runner/prepare-cpp.py`。运行面板里的「本地运行 C++」支持单文件 C++17，
可用 `std::cin` 逐行输入。实验版的无线程 WASI 运行时只提供控制台输入输出，
禁用 C++ 异常。

Java、C# 以及 C++ 可从运行面板打开「在线交互」，填写自行部署、提供有效 TLS
证书的 [Piston](https://github.com/engineer-man/piston#interactive-execution-endpoint-not-available-through-the-public-api)
WebSocket 地址，例如 `wss://runner.example.org/api/v2/connect`。在服务端安装所需语言运行时，
允许交互执行和 60 秒运行时限。点击「连接并运行」后，源码与输入发送给该服务。
Piston 公共 API 不提供交互接口。当前在线终端使用 Piston 的 stdin 写入命令，
逐行发送直到程序退出，或使用「取消等待」断开。断开后服务端作业可能继续到其执行限时。

浏览器测试可运行 `python tests/run-c.py` 和 `python tests/run-online-interactive.py`。
后者另外需要 Python `websockets`、JDK 和 C# 编译器，用本地测试服务运行两个固定样例。
