# 信笺授权与第三方组件核查

核查基线为 `v0.9.0`（`8d2bf7d`），包括 Git 树、锁文件、运行时准备脚本和正式源码 ZIP。Git 历史显示多个贡献者，提交记录可以核对贡献来源。

自 `v0.9.1` 起仓库采用 **GNU General Public License v3.0 or later**，正文见 [`LICENSE`](LICENSE)，第三方组件声明见 [`NOTICE.md`](NOTICE.md)。采用许可证时已知的缺口记录在下方「采用 GPL-3.0 后仍待确认」，逐项查清后再更新本文件。

正式源码包内的许可证路径以下均相对于 `modified/assets/www/`。

| 组件 | 用途与版本依据 | 随附许可证 |
| --- | --- | --- |
| QuickJS、quickjs-emscripten | JS Worker。适配包 `0.32.0` 见 `runner/package-lock.json`，已捆绑引擎的独立版本待核查 | MIT，`QuickJS-LICENSE.txt` |
| Lottie / Bodymovin | 本地动效。随包 `lottie.min.js` 自报 `5.12.2` | MIT，`Lottie-LICENSE.txt` |
| Pyodide | Python WASM 运行时。`runner/prepare-python.py` 固定为 `0.29.3` | MPL-2.0，`python-runtime/LICENSE-Pyodide.txt` |
| LLVM / Clang | C++ 本地编译。`runner/prepare-cpp.py` 固定许可证标签 `llvmorg-21.1.4` | Apache-2.0 WITH LLVM-exception，`python-runtime/clang/LLVM-LICENSE.txt` |
| YoWASP Clang | Clang 的浏览器/WASI 打包，npm 版 `21.1.4-3` | Apache-2.0，`python-runtime/clang/YOWASP-LICENSE.txt` |
| XCC | 本地 C 编译。程序包按 SHA-256 固定，许可证取自 `659a1773f20499864a8c3fdc7cd25cb506092bc1`。程序包与源码提交的对应关系待核查 | MIT，`python-runtime/xcc/LICENSE` |
| Browser WASI Shim | WASI 适配，`runner/prepare-c.py` 固定为 `0.4.2` | 分发附 MIT 与 Apache-2.0 文本，`python-runtime/xcc/shim/LICENSE-MIT` 和 `LICENSE-APACHE` |
| Python 标准库与 wheel | 随包包括 NumPy `2.2.5`、Matplotlib `3.8.4`、Pillow `11.3.0` 和其他 wheel，版本见 `pyodide-lock.json` 和 wheel 文件名 | 各 wheel 的 `.dist-info` 声明和随附许可证各自适用。WASM、标准库和编译器 sysroot 的传递许可清单待核查 |
| esbuild、jsdom、Playwright | 构建或测试。esbuild `0.25.12`、jsdom `26.1.0` 见锁文件。Playwright 按本地测试环境安装 | 以各依赖安装包自带声明为准。正式 APK 不含这些开发工具 |

## 采用 GPL-3.0 后仍待确认

- 准备首版运行版与旧 APK 的来源、再分发许可和相关权利人授权。向各原始贡献者核对希望纳入 GPL-3.0 的代码和范围。
- 核实应用头像、启动器图标、其他图片、SVG 及衍生素材的来源、修改权和再分发条件。应用名称、标志和头像的使用权需要单独确认。
- 本开发分支的启动器图标由用户提供的参考图衍生，前景源图记录在 `design/icons/launcher-foreground.png`。分发授权仍待确认。
- 对随包二进制核对对应源码、构建脚本和分发凭证。保留原始许可及版权信息。复查 LLVM exceptions、MPL-2.0 的 Secondary Licenses 条件及各传递依赖，再判断 GPL-3.0 兼容性与分发义务。
- 0.9.1 已随仓库提供 GNU GPL-3.0 原文（`LICENSE`）与项目、第三方声明（`NOTICE.md`）。上列各项查清后在本文件与 `NOTICE.md` 同步更新结论。

[GNU GPL v3 正文](https://www.gnu.org/licenses/gpl-3.0.html) · [GNU 许可证说明](https://www.gnu.org/licenses/license-list.html)
