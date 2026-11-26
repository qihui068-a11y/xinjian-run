# 信笺 · 工程目录

两条产品线放在同一个仓库里，**别混着改**：

| 目录 | 是什么 | 能不能动 |
|---|---|---|
| `modified/` | 运行版 0.7.x 的 apktool 工程（smali + assets + res） | 主战场 |
| `native/` | 运行版的原生 Java 源码（lan / keyboard / update），改完编译成 smali 回填 `modified/smali` | 主战场 |
| `runner/` | QuickJS 离线运行引擎，改 `worker.js` 后 `node build.cjs` 重新打包 | 很少动 |
| `tests/` | jsdom 回归（`node tests/regression.cjs`），`node_modules` 不进库 | 加功能就要加用例 |
| `release/` | 发布产物，按版本递增：`0.7.2-原版/` 起，每个版本一个目录（apk + 源码 zip + 说明） | 只读 |
| `legacy-0.4/` | 0.4 代码版整包（在手机上用 `x-build.sh` 打包的那条线），**参考实现** | 只读 |
| `docs/` | 要求、语法规范、测试记录、素材来源 | 只读 |
| `xinjian.jks` | 发布签名——**不要进仓库、不要外传**；口令离线保管 | 备份两份 |

## 常用命令

```powershell
# 回编译（必须用 aapt2，不要加 -a aapt）
java -jar D:\Android\tools\apktool.jar b D:\xinjian-main\modified -o D:\Android\build\out-unsigned.apk

# 对齐 + v1/v2/v3 签名 + 校验
D:\Android\sign.cmd D:\Android\build\out-unsigned.apk D:\xinjian-main\xinjian.jks xinjian D:\Android\build\out-signed.apk

# 改了 native/lan 之后：编译成 smali
python native\lan\build.py D:\Android\sdk\platforms\android-34\android.jar D:\Android\tools\r8.jar D:\Android\tools\apktool.jar --component lan --java-bin D:\Android\tools\jdk17\bin

# 回归
node tests\regression.cjs
```

> R8 必须是 8.8.34，否则重建出来的 smali 会和仓库里的逐字节不一致，diff 里全是噪音。
