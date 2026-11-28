# 信笺 · 运行版

> 在手机上写代码、随时运行，顺手聊两句。**0.9.2** · Android 5.0+ · 约 45 MB

[功能](#功能) · [快速开始](#快速开始) · [运行支持](#运行支持) · [鸽屋](#鸽屋局域网聊天) · [FUO 与 AI](#fuo-与-ai) · [权限与隐私](#权限与隐私) · [构建](#构建源码) · [常见问题](#常见问题)

信笺是一个**单文件代码编辑器 + 运行器**，同时带一套可信局域网聊天和可接入大模型的本地 AI 助手。它把编辑器、运行环境、聊天和 AI 都装进一个离线可用的 Android 应用里：不需要联网也能写代码、看效果、做笔记；需要编译运行时再按需连网。

- 一个书架管住所有作稿：codelab 用到的每个文件都在一个地方
- 打开即着色，按一下就跑，结果、输出、报错都在下方结果区
- 本地能跑的尽量本地跑（Python、C/C++ 离线运行），跑不了再接在线编译服务
- 鸽屋让你和同一 WiFi 下的另一台手机互发文字和图片，不经过任何服务器
- FUO 是一个本地聊天伙伴，填上自己的 API 就能接上大模型

---

## 功能

| 你想要的 | 信笺怎么做 |
|---|---|
| 随手写点东西 | 新建文件，14 种格式、三种编码可选 |
| 写代码时有颜色和提示 | 实时语法着色、HTML 补全、Python / JSON / XML 语法检查、离线补全 |
| 跑一下看看结果 | 点运行，结果区显示输出、编译诊断和报错，可复制、可放大 |
| 和旁边的人发消息 | 鸽屋：同一局域网发现设备，发文字和图片，有送达回执 |
| 找个 AI 聊聊代码 | FUO 接入 OpenAI 兼容接口，可自选供应商与模型 |
| 改到一半切到别的文件 | 多标签，随时切换 |
| 想留下操作痕迹 | 日志：完整 / 仅错误 / 关闭三种记录方式，崩溃时下次启动提示 |

---

## 快速开始

1. 到仓库的 **Releases** 页面下载 `xinjian-run-0.9.2.apk`
2. 在手机上允许安装来自浏览器的应用，安装并打开
3. 底栏进入「书架」→ 新建文件，选格式，就可以开始写

需要先安装 Android System WebView（多数手机已内置并保持更新）。

### 更新

应用启动时会检查 Releases，也可以在小家 → 设置 → 应用更新里手动检查。下载后会校验文件摘要、应用 ID、版本和签名，再由 Android 确认安装。

---

## 运行支持

### 离线运行

| 语言 | 说明 |
|---|---|
| JavaScript（JS / MJS / CJS） | 单文件 QuickJS 运行，支持 `console` 与 Promise，约 3 秒限时，可随时停止 |
| Python | Pyodide 运行，随包带 numpy、matplotlib、Pillow，支持输入交互与图片输出 |
| C / C++ | 实验性 WASI 运行时，`scanf` / `std::cin` 逐行输入 |

### 在线运行

Python、Java、C、C++、C# 可以交给 [Wandbox](https://wandbox.org/) 编译运行：填好标准输入后点「发送并运行」，代码和输入才会离开手机。结果里会带编译诊断和运行错误。

Java、C#、C++ 还支持「在线交互」：填一个自行部署、带 TLS 证书的 Piston WebSocket 地址，就能逐行交互。

### 预览与检查

- HTML、CSS、Markdown、TXT 本地预览（不外加载资源、不执行页面脚本）
- JSON、JSONC、XML 本地语法检查
- BF / BFH 走 C 兼容模式，可作为学习玩具的入口

---

## 编辑器

- 实时着色，覆盖 Python、HTML、CSS、Java、JSON/JSONC、JavaScript、XML
- 符号栏随文件类型切换：引号和括号自动包住选区，或者把光标放进括号中间
- 输入前缀会弹出补全列表，外接键盘也能用方向键选
- 键盘弹出时符号栏贴在键盘上沿，不会挡住正在写的代码
- 双指缩放代码与行号；拖动运行面板顶部横条调高度
- 「格式化」在本地整理缩进和换行
- 撤销 / 重做

---

## 书架阅读

书架点击 TXT 或 EPUB 进入阅读器。UTF-8 TXT 可通过阅读器菜单打开原有文本编辑器。导入 Android 书架的书籍会保留原始字节，可从阅读器、书架多选或备份页导出。书籍大小上限为 64 MiB。

- TXT 支持 UTF-8、UTF-8 BOM、UTF-16 LE/BE。遇到无法识别的编码，可在阅读设置里选编码，包括 GBK/GB18030。长篇会分段显示，目录识别常见中英文标题。没有标题的书也可以连续分段阅读。
- EPUB 支持按章阅读、元数据、EPUB 3 目录及 EPUB 2 NCX。缺少目录时可用章节顺序进入正文。支持包内 JPEG、PNG、GIF 和 WebP，限制单项大小、像素数和每章的图片用量。正文保留常用段落、列表、标题和安全的书内链接。
- 阅读器忽略 EPUB 自带脚本、样式、外部资源及 SVG，暂不支持加密内容和固定布局。损坏或超出限制的书籍会显示原因。EPUB 压缩包读取由 Android 原生层提供。
- 可用滚动或分页，支持按钮、两侧点按和横向滑动。字号、行距、主题和阅读模式是全局阅读偏好，编码和书签按书保存。阅读进度自动恢复，书架可清理最近阅读列表。进度、书签和阅读设置保存在本机，书架导出的还是原文件。

阅读回归入口为 `python tests/run-reader.py`（浏览器模拟原生桥接）及 `tests/BookFilesTest.java`（JVM 检查 ZIP 和导入规则）。构建原生组件时使用 `native/lan/build.py --component reader`。

## 鸽屋（局域网聊天）

鸽屋是**同一个局域网内**两台手机之间的聊天，消息不经过任何服务器。

- 开启后自动发现同一网络里的设备；也可以从列表里加好友
- 支持文字与图片；图片发送前会压缩到 1 MB 以内
- 消息显示「发送中 / 已送达」，失败可以重发
- 可以给每个会话单独设置背景图，图片来自相册并经过系统裁剪
- 可以清空聊天记录（同时清空 AI 上下文），或只删除会话保留好友

### 使用边界

鸽屋是明文传输、没有身份校验的局域网工具，**只建议在可信网络里使用**（家里的 WiFi、自己开的热点）。咖啡厅、学校、共享办公等公共 WiFi 上，同网段的人可以冒充他人、也能抓包看到内容。做公共网络必须先补上身份与完整性（公钥交换 + 每帧 HMAC），这是后续版本的方向。

---

## FUO 与 AI

FUO 是应用里的本地会话。默认它只会打招呼；在会话右上角 →「AI 模型配置」里填上你的接口信息，它就会用大模型回复。

- **协议**：OpenAI 兼容的 `/v1/chat/completions`
- **供应商预设**：OpenAI、Gemini、Anthropic、DeepSeek、通义千问、文心一言、星火、ChatGLM、Kimi、豆包、MiniMax、Mistral、OpenRouter 等，以及 LM Studio / Ollama / llama.cpp 这类本地推理
- **密钥只保存在你的手机上**，请求由应用直接发往你填写的端点
- 可以为模型开启「支持识图」，让图片直接交给模型处理
- 支持多套配置切换，配置页可以测试连接

---

## 权限与隐私

信笺只在你点了操作时才向外部发数据：

| 场景 | 会不会联网 | 发到哪里 |
|---|---|---|
| 编辑、预览、离线运行 | 不会 | — |
| 在线运行 / 在线交互 | 会 | Wandbox 或你填写的 Piston 服务 |
| FUO 对话 | 会 | 你填写的 AI 端点 |
| 鸽屋 | 局域网内部 | 同网络内的设备 |
| 检查更新 | 会 | GitHub Releases |

申请的系统权限：

| 权限 | 用途 |
|---|---|
| 相机 | 拍照发给好友、会话背景图 |
| 照片与视频 / 存储 | 从相册导入 |
| 位置 | 定位（精度分大致 / 精确） |
| 安装未知应用 | 应用内更新 |
| 网络 | 在线运行、AI、更新、鸽屋 |

权限都可以在应用里逐项查看和申请，也可以随时到系统设置里撤销。

---

## 数据与备份

文件、聊天记录、AI 配置都保存在应用私有目录和本地存储里，**卸载会一并删除**。想保留的话，在小家 → 备份里导出全部文件，或把聊天记录导出成文本。

---

## 日志与反馈

如果应用出现问题，可以在设置 → 日志里查看错误记录，把日志发给开发者。

日志有三种记录方式：完整记录（会记录页面切换与点击，可能影响低端机速度）、仅记录错误（默认）、完全不记录。原生崩溃后，下次启动会弹出崩溃日志预览。

反馈问题时，附上日志和复现步骤会更快定位。

---

## 构建（源码）

仓库是一个 Apktool 工程：`modified/` 是打包主体，`native/` 是原生 Java 源码，`runner/` 是离线运行引擎，`tests/` 是回归测试。

需要的工具：JDK 17、Android SDK build-tools 34、Apktool 2.12.1、R8 8.8.34、Node.js。

```powershell
# 回编译
java -jar apktool.jar b modified -o out-unsigned.apk

# 对齐 + 签名
zipalign -p -f 4 out-unsigned.apk out-aligned.apk
apksigner sign --ks <你的密钥> --out 信笺.apk out-aligned.apk
```

修改 `native/` 下的 Java 后需要重新生成 smali：

```powershell
python native\lan\build.py <android.jar> <r8.jar> <apktool.jar> --component <lan|keyboard|python|update|logs|ai|crop|reader>
```

测试：

```powershell
npm ci --prefix tests
node tests\regression.cjs          # jsdom 回归
python tests\run-design.py         # 界面与主题（需要 Playwright + Chromium）
```

源码 ZIP 自带离线运行资源，解压即可按上面的步骤构建。回归用例在 `tests/`。

---

## 常见问题

**运行按钮没有反应？**
旧版 Android System WebView 无法加载运行引擎，请在应用商店更新系统 WebView。

**联网运行失败？**
在线运行依赖 Wandbox 的可用性；网络受限时可以改用本地运行（Python、C/C++）。

**鸽屋搜不到对方？**
确认两台设备连的是同一个 WiFi（部分路由器的「AP 隔离」会挡住设备间通信），并都开启了局域网聊天。

**换了手机，原来的文件怎么办？**
先在旧设备上导出备份，再在新设备上导入。

**我可以自己编译吗？**
可以，仓库里包含了完整的工程与构建脚本。

---

## 致谢

感谢 [QuickJS](https://bellard.org/quickjs/)、[Pyodide](https://pyodide.org/)、[Wandbox](https://wandbox.org/)、[YOWASP](https://yowasp.org/) 与 [Lottie](https://airbnb.io/lottie/) 等开源项目，以及所有提出问题和建议的朋友。

赞助与联系方式见应用内「小家 → 赞助」。

---

## 许可证

信笺以 **GNU General Public License v3.0 or later** 发布，全文见 [LICENSE](LICENSE)。

随包的第三方组件各自保留原许可证（QuickJS / quickjs-emscripten、Lottie、Pyodide（MPL-2.0）、LLVM/Clang（Apache-2.0 WITH LLVM-exception）、YoWASP Clang、XCC、Browser WASI Shim 以及各 wheel）。逐项核对见 [NOTICE.md](NOTICE.md) 与 [LICENSE-AUDIT.md](LICENSE-AUDIT.md)。

图标、应用名称与头像等美术素材的再分发条件仍在核对，见 LICENSE-AUDIT.md 的待确认清单。
