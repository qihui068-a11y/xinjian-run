# 信笺 SVG 设计资源

adaptive/ 保留本次界面使用的原始 SVG。应用通过 modified/assets/www/app.js 的 svg(name) 内联图形，颜色由 CSS 的 currentColor 继承。APK 只包含运行时图标注册表。

## Android 启动器图标

launcher-foreground.png 是本轮使用用户提供参考图，经内置 ImageGen 去除外框后得到的透明前景源图。部署图按 108 dp 画布、中心约 65 dp 的图形范围导出到五档 mipmap。普通和圆形位图在 48 dp 视窗中使用同一前景，适配 Android 8.0 以前的设备。

自适应图标使用现有的 ic_launcher_foreground 和 ic_launcher_background 资源，裁切由 Android 启动器完成。应用清单和启动主题沿用现有引用。
