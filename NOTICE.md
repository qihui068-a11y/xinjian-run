# 第三方组件与许可证声明

信笺（本仓库）整体以 **GNU General Public License v3.0 or later** 发布，全文见 [LICENSE](LICENSE)。
下列第三方组件随应用或构建脚本分发，各自保留其原始许可证；本节与 [LICENSE-AUDIT.md](LICENSE-AUDIT.md) 共同构成再分发所需的声明。

许可证正文所在位置，路径相对于 `modified/assets/www/`。

| 组件 | 用途 | 许可证 | 正文位置 |
| --- | --- | --- | --- |
| QuickJS、quickjs-emscripten | JS Worker 引擎（适配包 `0.32.0`，见 `runner/package-lock.json`） | MIT | `QuickJS-LICENSE.txt` |
| Lottie / Bodymovin `5.12.2` | 本地动效 | MIT | `Lottie-LICENSE.txt` |
| Pyodide `0.29.3` | Python WASM 运行时（`runner/prepare-python.py` 固定版本） | MPL-2.0 | `python-runtime/LICENSE-Pyodide.txt` |
| LLVM / Clang `llvmorg-21.1.4` | C++ 本地编译 | Apache-2.0 WITH LLVM-exception | `python-runtime/clang/LLVM-LICENSE.txt` |
| YoWASP Clang `21.1.4-3` | Clang 的浏览器 / WASI 打包 | Apache-2.0 | `python-runtime/clang/YOWASP-LICENSE.txt` |
| XCC | 本地 C 编译 | MIT | `python-runtime/xcc/LICENSE` |
| Browser WASI Shim `0.4.2` | WASI 适配 | MIT + Apache-2.0 | `python-runtime/xcc/shim/LICENSE-MIT`、`LICENSE-APACHE` |
| Python 标准库与 wheel（NumPy `2.2.5`、Matplotlib `3.8.4`、Pillow `11.3.0` 等） | 本地 Python 运行环境 | 各 wheel 的 `.dist-info` 声明 | 随 wheel 分发，见 `pyodide-lock.json` 与 wheel 文件名 |
| esbuild `0.25.12`、jsdom `26.1.0`、Playwright | 构建与测试（不进 APK） | 各自安装包声明 | `runner/package-lock.json` |

## 对应源码

GPL-3.0 要求的对应源码即本仓库：下载该版本对应的 tag（如 `v0.9.1`）即可获得构建 APK 所需的全部脚本与素材，`README.md` 的「构建源码」一节说明了构建步骤。随包的 Python / C / C++ 运行时由 `runner/prepare-*.py` 按固定版本抓取并校验，脚本本身在仓库内。

## 仍在核对的事项

- 首版运行版与历史 APK 的来源、再分发许可与相关权利人授权。
- 应用头像、启动器图标、其他图片与 SVG 的来源、修改权与再分发条件；应用名称、标志与头像的使用权需单独确认。当前启动器图标由用户提供的参考图衍生，前景源图为 `design/icons/launcher-foreground.png`。
- 随包二进制的对应源码、构建脚本与分发凭证；LLVM exceptions、MPL-2.0 的 Secondary Licenses 条件以及各传递依赖的 GPL-3.0 兼容性判定。

上述事项确认后会在本文件与 LICENSE-AUDIT.md 中更新。
