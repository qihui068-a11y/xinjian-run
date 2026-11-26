# 书架和移动端编辑器开发计划

基线为 `0.7.13-run`（`5559bdf`）。修改使用 `feature/shelf`，合并由维护者决定。开发前运行 `node tests/regression.cjs`，63 项通过。

## P0 运行引擎

1. 运行界面接收 `ready`、`stdout`、`stderr`、`input`、`artifact` 和 `exit` 事件。输出作为文本或文件处理，图片预览仅接受有大小和尺寸限制的 PNG。停止或退出页面时终止 Worker，下一次运行创建独立环境。
2. QuickJS 继续在专用 Worker 内运行，使用 `await readline('请输入')` 逐行输入，结束输入返回 `null`。在线编译保留执行前的多行标准输入和发送确认。Wandbox 的结果在请求结束后返回，未来的在线交互需要支持会话 stdin 的服务端协议。
3. 可选的本地 Python 构建使用固定版本的 Pyodide。脚本在独立 Worker 内运行，Worker 的 CSP 只允许读取随安装包提供的运行资源。Python 的 JS 全局对象为空，运行面板只消费规定的事件。真实交互使用跨源隔离下的 `SharedArrayBuffer`，其他环境按实测结果提供批量输入或 Wandbox。参考 [Pyodide 标准流接口](https://pyodide.org/en/0.29.3/usage/streams.html) 和 [Worker 部署说明](https://pyodide.org/en/0.29.3/usage/webworker.html)。
4. 首轮验证 `input()`、异常和 EOF、连续交互、无限循环、停止、堆限制、Matplotlib、Pillow。后续补 Turtle 的前进、转向和抬落笔，用 Canvas 渲染受限的绘图指令，再按常用教学例子扩展。完善 WebView 的导出流程和版本兼容情况。

## P1 编辑器

当前已有行号、语法高亮、格式化、成对符号插入、自定义符号栏和键盘跟随。先统一选区和文本变更逻辑，补快捷键括号匹配、缩进、撤销和重做。增加查找替换和跳行后，再让多文件标签独立保留光标、滚动和未保存状态。移动端用 IME 测试每种变更，特别是中英文输入切换时的光标位置。

## P2 书架

书架当前支持平铺列表、时间与名称排序、多选、导入和导出。先增加搜索和最近打开记录，再引入项目元数据和文件夹路径，迁移时保留已有文件。项目内文件可独立保存和恢复历史版本。稳定项目结构后实现 ZIP 导入导出，处理重名、越界路径及压缩包大小。GitHub 工程管理可复用这套项目接口。

## 本地构建和测试

运行 `python runner/prepare-python.py` 下载并校验固定的运行时和 Matplotlib、Pillow 依赖。文件生成于 `modified/assets/www/python-runtime/`，需要本地 Python 的 APK 在执行 Apktool 前跑此步骤，运行时读取包内资源。256 MiB 上限应用于 Python WASM 线性内存，安装包会包含 Pyodide 许可证和各依赖的原有许可证。

运行 `node tests/regression.cjs` 检查通用功能。安装 Python Playwright 和 Chromium 后运行 `python tests/run-preview.py` 及 `python tests/run-python.py`。Windows 可将 `XJ_CHROMIUM` 设为本机 Chromium 系浏览器可执行文件的绝对路径。测试版 APK 优先在独立 Android 模拟器上确认本地 Python 是否可用和是否支持交互。
