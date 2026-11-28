# 更新日志

## 0.9.1 · 2026-11-28

书架里能读书了，仓库也首次带上了开源许可证。

### 阅读器

- **书架快捷栏第三位新增「阅读」**：弹出「选择阅读文件」，只列书架里的 TXT 和 EPUB；读过的排前面并标「继续阅读」，点选直接回到上次读到的位置，没读过的显示「开始阅读」。
- **TXT**：自动识别编码（UTF-8 / UTF-8 BOM / UTF-16 LE·BE / GBK / Big5 等），按字数分段，标题行自动进目录。
- **EPUB**：解析书脊与目录、章节标题、封面与插图，按章节分页。
- **阅读界面**：分段 / 分页翻页，目录跳转，字号（14–32 px）、行距（紧凑 / 默认 / 宽松）、阅读主题三档，书签（添加 / 跳转 / 删除），底部显示「第几段 · 第几页 · 百分比」。
- **进度与设置**保存在本地；原生 `BookFiles` 负责大文件读写与导出，几 MB 的书不用整本进内存。

### 开发与构建

- 新增 `dev.ps1`：一条命令完成打包 → 签名 → 安装 → 热推资源。构建在 `%TEMP%` 的纯 ASCII 路径下进行，规避 aapt2 在含中文的父目录下 `failed to open directory` 的失败。
- `MainActivity` 增加开发开关：应用私有目录里存在 `dev.flag` 时，页面从该目录加载并打开 WebView 远程调试；改 JS / CSS 只需推文件重启，不用重装 APK。
- 默认产出并存包（`tt.xinjian.cn.dev`），可与正式版同时安装。
- 测试：新增 `tests/shelf-reader.cjs`（阅读入口、选书弹窗、空书架提示）与 `tests/popover.cjs`；`node tests/regression.cjs` 现为 80 项通过。

### 许可证

- 仓库首次以 **GNU General Public License v3.0 or later** 发布，全文见 [LICENSE](LICENSE)。
- 随包第三方组件（QuickJS、Lottie、Pyodide、LLVM/Clang、YoWASP、XCC、WASI Shim 及各 wheel）的许可证声明见 [NOTICE.md](NOTICE.md)；授权核查记录见 [LICENSE-AUDIT.md](LICENSE-AUDIT.md)，其中仍列有待确认事项。

### 版本

- `versionName` 0.9.1 · `versionCode` 39 · 应用 ID 沿用 `tt.xinjian.cn.codeedit.run`。

---

## 0.9.0 · 2026-11-27

- 新增 FUO 与 AI 助手（`ai.js`、`views/ai.js`、`native/ai`）、日志中心（`logs.js`、`native/logs`）、图片裁剪（`native/crop`）、雷达弹窗（`radar-sheet.js`）、手势动效（`gesture-motion.js`）。
- 赞助页素材与启动器图标更新。
- 详见 tag `v0.9.0`。
