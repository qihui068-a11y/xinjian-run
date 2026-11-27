# 协作约定 · 这个仓库同时被多个 AI agent 打开

> 已确认参与过的：**Codex（桌面版）**、**DSH（小苏）**。人类只有 LiXiaoSuai 一个。
> 你们不共享上下文，共享的是这个文件夹。所以**唯一的同步手段是文件 + git**。

## 开工前（每个 agent 都做，30 秒）

1. `git status --short` —— 先看清有哪些没提交的改动，判断哪几条不是你的
2. 读 [`协作日志.md`](协作日志.md) 的「**当前进度**」一节，再看最后两三条记录
3. 只在你自己的改动范围内动手

## 收工前（必须做，别省）

1. 在 [`协作日志.md`](协作日志.md) 末尾**追加**一条记录（模板在文件开头）
2. 重写该文件开头的「当前进度」（旧内容挪进记录里，不要直接删）
3. 确认 `git status` 里留下的改动都能对应到日志里的某一条

## 硬禁止

- `git checkout .` / `git reset --hard` / `git stash -a` / `git clean -fd`：会直接吃掉对方没提交的工作
- 改别人的未提交文件（先看 `git diff` 是谁的活，日志里会写）
- 提交（commit）除自己明确要求外不要做；这个仓库由人决定何时提交
- 动 `release/`（只读，历史发布包）和 `legacy-0.4/`（参考实现）

## 目录与职责

| 目录 | 内容 | 谁在动 |
|---|---|---|
| `modified/` | 运行版 0.7.x 的 apktool 工程（smali + assets/www + res） | 主战场，两边都改 |
| `native/` | 原生 Java 源（lan / keyboard / update），编译成 smali 回填 | 主战场 |
| `runner/` | QuickJS 离线引擎，改完要 `node build.cjs` | 少动 |
| `tests/` | jsdom 回归 + Playwright/Android e2e | 加功能就要加用例 |
| `docs/` | 要求、语法规范、审核报告 —— **只读** | 别往里写 |
| `.local/` | 本机私有工具链和产物（已被 git 忽略） | DSH 建的，见下 |

## 本机环境（2026-11-26 实测，别信 PATH）

| 东西 | 实际位置 / 状态 |
|---|---|
| git | `C:\Program Files\Git\cmd\git.exe`（不在 PATH） |
| java | `C:\Program Files\Common Files\Oracle\Java\javapath\java.exe` = **22.0.2**；JDK 全量在 `C:\Program Files\Java\jdk-22` |
| python | `C:\python\python.exe` |
| node | **不存在** → `tests/*.cjs` 跑不了，改完只能靠手机上验证 |
| PowerShell | 只有 **5.1**（没有 pwsh 7）；脚本执行策略是 Restricted，得 `-ExecutionPolicy Bypass -File` |
| adb | `.local\tools\platform-tools\adb.exe`（不在 PATH） |
| 设备 | MuMu 模拟器 `24031PN0DC` / x86_64 / Android 12 (SDK 32)，`adb` 里是 `127.0.0.1:16384` |
| 签名 | 发布用 `xinjian.jks` **不在这台机器上**；开发用 `.local\tools\dev.jks`（口令 `dev123456`） |

## 构建与调试

**不要**在仓库路径下直接 `apktool b modified`——父目录含中文（`信笺`），aapt2 会把路径转成乱码然后 `failed to open directory`。统一走脚本：

```powershell
cd C:\Users\LiXiaoSuai\Documents\信笺\xinjian-run
powershell -NoProfile -ExecutionPolicy Bypass -File .\dev.ps1 all    # 打包+签名+安装+推送，约 50s
powershell -NoProfile -ExecutionPolicy Bypass -File .\dev.ps1 push   # 只改 js/css/html：3s
powershell -NoProfile -ExecutionPolicy Bypass -File .\dev.ps1 tools  # 检查工具链/在线设备
```

细节见 [`dev.ps1`](dev.ps1) 头部注释。要点：

- 构建在 `%TEMP%\xjbuild` 做副本，**不污染工作区**
- 默认产出**并存包** `tt.xinjian.cn.dev`（改 manifest 包名+provider authority 两处），所以能和正式包 `tt.xinjian.cn.codeedit.run` 同时装在手机上
- `-AsRelease` 才用正式包名，但签名对不上，装不上；要覆盖正式版必须先拿到 `xinjian.jks`

调试手机上的页面：

```powershell
$adb = ".local\tools\platform-tools\adb.exe"
$p = (& $adb shell pidof tt.xinjian.cn.dev).Trim()
& $adb forward tcp:19222 "localabstract:webview_devtools_remote_$p"
# 然后浏览器开 http://127.0.0.1:19222/json，或用 .local\build\cdp.py 直接驱动页面
python .local\build\cdp.py 19222 <某个.js> 1
```

注意 curl / `Invoke-WebRequest` 在这台机器上有 schannel 问题（`SEC_E_NO_CREDENTIALS`），下载和请求一律用 python urllib。

## 改 smali 的注意

`MainActivity` 里已有的私有工具方法，直接 `invoke-direct` 调，不要重写：

- `pythonRunnerHeaders(String path, Map headers)` —— 给 `/python-worker.js` 补 CSP、给 `/index.html` 补 COOP/COEP。**任何新的资源出口都必须调它**，否则前端 `python-run.js:28` 会直接抛「当前环境无法隔离本地 Python」。
- `mimeOf(String)`、`mediaDir()`、`serve(Uri)`、`serveDev(String)`、`devEnabled()Z`

改完必须实机验证，不能只看构建成功。
