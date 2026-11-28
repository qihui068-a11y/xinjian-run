<#
  dev.ps1 — 信笺本地开发闭环（USB 连手机，改完立刻看效果）

  两条路径，按改动类型选：

    push    只改了 modified\assets\www\ 里的 js/css/html
            → 推文件 + 重启 app，1~2 秒生效，不用重打包、不用签名

    build   改了 smali / res / AndroidManifest
            → apktool 重打包 + zipalign + v1v2v3 签名，约 30~60 秒

  用法（在仓库根目录）：
    .\dev.ps1 tools       看工具链和已连设备
    .\dev.ps1 push
    .\dev.ps1 build
    .\dev.ps1 install
    .\dev.ps1 all

  执行策略拦住的话：
    powershell -ExecutionPolicy Bypass -File dev.ps1 tools

  前提：
    - 手机开「USB 调试」，数据线连电脑，adb 能认出设备
    - push 生效要求手机上装的是本仓库打过 dev 补丁的 apk
      （dev.flag 存在时才从 /sdcard/Android/data/<包名>/files/www 加载页面）

  本脚本不碰 git。
#>
[CmdletBinding()]
param(
    [ValidateSet('help', 'push', 'build', 'install', 'all', 'tools')]
    [string]$Task = 'help',

    # 有多台设备时指定序列号，见 adb devices
    [string]$Serial = '',

    # 用正式包名 tt.xinjian.cn.codeedit.run 构建。
    # 只有拿到 xinjian.jks 才能覆盖手机上已装的正式版；默认构建并存包 tt.xinjian.cn.dev。
    [switch]$AsRelease
)

$ErrorActionPreference = 'Stop'
$Root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$Activity = 'tt.xinjian.cn.MainActivity'

# 默认打进并存包 tt.xinjian.cn.dev：和手机上已装的正式版互不干扰，
# 不用动 xinjian.jks，也不会碰到正式版里的数据。
if ($AsRelease) {
    $Pkg = 'tt.xinjian.cn.codeedit.run'
} else {
    $Pkg = 'tt.xinjian.cn.dshreader'
}
$RemoteRoot = "/sdcard/Android/data/$Pkg/files"
$DevKsPass = 'dev123456'

# ---------------------------------------------------------------- 工具探测

function Join-Safe {
    param([string]$Base, [string]$Child)
    if ([string]::IsNullOrWhiteSpace($Base)) { return $null }
    try { return (Join-Path $Base $Child) } catch { return $null }
}

function Find-Exe {
    param([string[]]$Candidates)
    foreach ($c in $Candidates) {
        if ([string]::IsNullOrWhiteSpace($c)) { continue }
        if (Test-Path $c) { return (Resolve-Path $c).Path }
        try {
            $cmd = Get-Command $c -ErrorAction SilentlyContinue
            if ($cmd -and $cmd.Source -and (Test-Path $cmd.Source)) { return $cmd.Source }
        } catch { }
    }
    return $null
}

function Find-JavaHome {
    param([string]$JavaExe)
    if ($env:JAVA_HOME) {
        $probe = Join-Safe $env:JAVA_HOME 'bin\keytool.exe'
        if ($probe -and (Test-Path $probe)) { return $env:JAVA_HOME }
    }
    if ($JavaExe) {
        $candidate = Split-Path (Split-Path $JavaExe -Parent) -Parent
        if (Test-Path (Join-Path $candidate 'bin\keytool.exe')) { return $candidate }
    }
    $jdkRoot = 'C:\Program Files\Java'
    if (Test-Path $jdkRoot) {
        $dirs = Get-ChildItem $jdkRoot -Directory -ErrorAction SilentlyContinue |
            Where-Object { Test-Path (Join-Path $_.FullName 'bin\keytool.exe') } |
            Sort-Object Name -Descending
        if ($dirs) { return $dirs[0].FullName }
    }
    return $null
}

$java = Find-Exe @(
    (Join-Safe $env:JAVA_HOME 'bin\java.exe'),
    'java',
    'C:\Program Files\Java\jdk-22\bin\java.exe'
)
$javaHome = Find-JavaHome -JavaExe $java
$keytool = if ($javaHome) { Join-Path $javaHome 'bin\keytool.exe' } else { $null }

$adb = Find-Exe @(
    'adb',
    (Join-Safe $env:ANDROID_HOME 'platform-tools\adb.exe'),
    (Join-Safe $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe'),
    'D:\Android\sdk\platform-tools\adb.exe',
    (Join-Path $Root '.local\tools\platform-tools\adb.exe')
)

$toolsDir = Join-Path $Root '.local\tools'

$apktoolJar = $null
$jarHit = Get-ChildItem $toolsDir -Filter 'apktool_*.jar' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
if ($jarHit) { $apktoolJar = $jarHit.FullName }
elseif (Test-Path 'D:\Android\tools\apktool.jar') { $apktoolJar = 'D:\Android\tools\apktool.jar' }

$signerJar = $null
$signHit = Get-ChildItem $toolsDir -Filter 'uber-apk-signer-*.jar' -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending | Select-Object -First 1
if ($signHit) { $signerJar = $signHit.FullName }

$devKs = Join-Path $toolsDir 'dev.jks'
$buildDir = Join-Path $Root '.local\build'
$signedApk = Join-Path $buildDir 'xinjian-dev.apk'

$adbArgs = @()
if ($Serial) { $adbArgs = @('-s', $Serial) }

$helpText = @'
dev.ps1 — 信笺本地开发闭环

  .\dev.ps1 tools      看工具链和已连设备
  .\dev.ps1 push       只改了 assets\www → 推手机、重启，1~2 秒
  .\dev.ps1 build      apktool 重打包 + 对齐 + v1v2v3 签名
  .\dev.ps1 install    装到手机
  .\dev.ps1 all        build + install + push

  加 -Serial <序列号> 指定设备。
  加 -AsRelease 用正式包名（需要 xinjian.jks 才装得上）。

默认打并存包 tt.xinjian.cn.dev：
  和手机上已装的正式版互不干扰，不用 xinjian.jks，也不碰正式版数据。

为什么 push 就够了：
  app 启动时看 /sdcard/Android/data/<包名>/files/dev.flag，
  有就优先读同目录 www\ 下的文件，没有才回落到 apk 内置的 assets\www。
  所以 js/css/html 的改动永远不用重打包。
'@

# ---------------------------------------------------------------- 子命令

function Show-Tools {
    Write-Host '工具链' -ForegroundColor Cyan

    $ksPath = $null
    if (Test-Path $devKs) { $ksPath = $devKs }

    $rows = @(
        @{ Name = 'java'; Path = $java; Need = $true },
        @{ Name = 'keytool'; Path = $keytool; Need = $true },
        @{ Name = 'apktool'; Path = $apktoolJar; Need = $true },
        @{ Name = 'signer'; Path = $signerJar; Need = $true },
        @{ Name = 'keystore'; Path = $ksPath; Need = $false },
        @{ Name = 'adb'; Path = $adb; Need = $false }
    )
    foreach ($r in $rows) {
        if ($r.Path) { $mark = 'OK  '; $color = 'Green' }
        elseif ($r.Need) { $mark = 'MISS'; $color = 'Red' }
        else { $mark = '--  '; $color = 'DarkGray' }
        $shown = '(未找到)'
        if ($r.Path) { $shown = $r.Path }
        Write-Host ("  [{0}] {1,-9} {2}" -f $mark, $r.Name, $shown) -ForegroundColor $color
    }

    Write-Host ''
    if ($adb) {
        Write-Host '已连接设备' -ForegroundColor Cyan
        & $adb devices -l
    } else {
        Write-Host '  adb 没找到 — push / install 用不了。' -ForegroundColor Yellow
        Write-Host '  装 platform-tools（解压即用），放到 .local\tools\platform-tools\ 或加进 PATH。' -ForegroundColor DarkGray
    }
}

function Assert-BuildTools {
    if (-not $java) { throw '找不到 java。装 JDK（22 可用）或设置 JAVA_HOME。' }
    if (-not $apktoolJar) { throw '找不到 apktool。放到 .local\tools\apktool_2.12.1.jar。' }
    if (-not $signerJar) { throw '找不到 uber-apk-signer。放到 .local\tools\uber-apk-signer-1.3.0.jar。' }
}

function Ensure-DevKeystore {
    if (Test-Path $devKs) { return }
    if (-not $keytool) { throw '找不到 keytool，没法生成开发签名。' }
    Write-Host '生成开发签名 .local\tools\dev.jks ...' -ForegroundColor Yellow
    $ErrorActionPreference = 'Continue'
    & $keytool -genkeypair -keystore $devKs -alias dev -keyalg RSA -keysize 2048 -validity 10950 -storepass $DevKsPass -keypass $DevKsPass -dname 'CN=XinJian Dev,O=Dev,C=CN' 2>&1 | Out-Null
    $ErrorActionPreference = 'Stop'
    if (-not (Test-Path $devKs)) { throw '生成 keystore 失败。' }
}

function Invoke-Build {
    Assert-BuildTools
    Ensure-DevKeystore

    # aapt2 处理不了含中文的路径（会报 failed to open directory），
    # 所以整份工程复制到纯 ASCII 的临时目录再编译。
    # 注意：adb 又要求 TEMP 可写（沙箱下用户 TEMP 常被拒），有人会把 TEMP
    # 改到工作区里 —— 那条路径带「信笺」，aapt2 必炸。所以这里自己挑根目录：
    # $env:TEMP 含非 ASCII 就退到 %PUBLIC%\xjbuild-tmp。
    $tmpRoot = $env:TEMP
    if (-not $tmpRoot -or $tmpRoot -match '[^\x00-\x7F]') {
        $tmpRoot = Join-Path ($(if ($env:PUBLIC) { $env:PUBLIC } else { 'C:\Users\Public' })) 'xjbuild-tmp'
    }
    New-Item -ItemType Directory -Force -Path $tmpRoot | Out-Null
    $work = Join-Path $tmpRoot 'xjbuild'
    Write-Host "1/3 复制工程到 $work ..." -ForegroundColor Cyan
    Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path (Join-Path $work 'framework') | Out-Null
    robocopy (Join-Path $Root 'modified') (Join-Path $work 'modified') /E /XD build /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "复制工程失败（robocopy 退出码 $LASTEXITCODE）。" }

    # 包名和桌面名字只在临时副本里改，工作区的 AndroidManifest.xml 保持干净（git 无噪音）
    if (-not $AsRelease) {
        $mf = Join-Path $work 'modified\AndroidManifest.xml'
        $xml = [System.IO.File]::ReadAllText($mf)
        $xml = $xml.Replace('package="tt.xinjian.cn.codeedit.run"', 'package="tt.xinjian.cn.dshreader"')
        $xml = $xml.Replace('tt.xinjian.cn.codeedit.run.updates', 'tt.xinjian.cn.dshreader.updates')
        # 桌面上要和正式版区分开，否则两个一样的图标分不清谁是谁
        $xml = $xml.Replace('android:label="信笺"', 'android:label="信笺·阅读测试"')
        [System.IO.File]::WriteAllText($mf, $xml, (New-Object System.Text.UTF8Encoding($false)))
    }

    $unsigned = Join-Path $work 'out-unsigned.apk'
    Write-Host '2/3 apktool 重打包 ...' -ForegroundColor Cyan
    $ErrorActionPreference = 'Continue'
    & $java -jar $apktoolJar b (Join-Path $work 'modified') -o $unsigned --frame-path (Join-Path $work 'framework')
    $buildExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($buildExit -ne 0 -or -not (Test-Path $unsigned)) { throw 'apktool 打包失败，看上面日志。' }

    Write-Host '3/3 zipalign + 签名 ...' -ForegroundColor Cyan
    $stamp = Join-Path $work 'signed'
    Remove-Item $stamp -Recurse -Force -ErrorAction SilentlyContinue
    $ErrorActionPreference = 'Continue'
    & $java -jar $signerJar -a $unsigned --ks $devKs --ksAlias dev --ksPass $DevKsPass --ksKeyPass $DevKsPass -o $stamp
    $signExit = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($signExit -ne 0) { throw '签名失败，看上面日志。' }

    $produced = Get-ChildItem $stamp -Filter '*-aligned-signed.apk' -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $produced) { throw '没找到签名后的 apk。' }

    New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
    Copy-Item $produced.FullName $signedApk -Force
    $size = [math]::Round((Get-Item $signedApk).Length / 1MB, 2)
    Write-Host ''
    Write-Host "完成：$signedApk  ($size MB)" -ForegroundColor Green
    Write-Host "包名：$Pkg   活动：$Activity" -ForegroundColor DarkGray
    Write-Host ''
    if ($AsRelease) {
        Write-Host '这是正式包名，用开发签名签的 —— 手机上已装正式版时签名对不上，装不了。' -ForegroundColor Yellow
        Write-Host '要用 xinjian.jks 签：放仓库根后改用 D:\Android\sign.cmd，或把口令给我改脚本。' -ForegroundColor DarkGray
    } else {
        Write-Host '并存包，和正式版互不影响，直接 install 覆盖自己的旧 dev 包即可。' -ForegroundColor DarkGray
    }
}

function Assert-Adb {
    if (-not $adb) { throw '找不到 adb。跑 .\dev.ps1 tools 看缺什么。' }
    $ErrorActionPreference = 'Continue'
    $state = (& $adb @adbArgs get-state 2>&1) -join ' '
    $ErrorActionPreference = 'Stop'
    if ($state -notmatch 'device') {
        throw "adb 没看到设备在线：$state`n  → 开 USB 调试、换根数据线、手机上点「允许调试」。"
    }
}

function Invoke-Install {
    Assert-Adb
    if (-not (Test-Path $signedApk)) { throw '还没构建过。先跑 .\dev.ps1 build。' }
    Write-Host "安装 $signedApk ..." -ForegroundColor Cyan
    $ErrorActionPreference = 'Continue'
    & $adb @adbArgs install -r $signedApk
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($code -ne 0) {
        Write-Host ''
        Write-Host '装不上多半是签名冲突：先卸载再装。' -ForegroundColor Yellow
        Write-Host "  $adb uninstall $Pkg" -ForegroundColor DarkGray
        throw 'install 失败。'
    }
    Write-Host '安装完成。' -ForegroundColor Green
}

function Invoke-Push {
    Assert-Adb
    $www = Join-Path $Root 'modified\assets\www'
    if (-not (Test-Path $www)) { throw "找不到 $www" }

    $ErrorActionPreference = 'Continue'
    & $adb @adbArgs shell "mkdir -p $RemoteRoot/www" | Out-Null

    # Android 11+ 的外置存储走 FUSE，adb push 在批量推送时自己建子目录会报
    # "remote secure_mkdirs failed: Operation not permitted"，所以先用 shell 把目录树建出来。
    $subDirs = Get-ChildItem $www -Recurse -Directory -ErrorAction SilentlyContinue
    foreach ($d in $subDirs) {
        $rel = $d.FullName.Substring($www.Length).TrimStart('\') -replace '\\', '/'
        & $adb @adbArgs shell "mkdir -p `"$RemoteRoot/www/$rel`"" | Out-Null
    }

    Write-Host '推送 www ...' -ForegroundColor Cyan
    # adb 把进度写到 stderr，直接留在控制台会被 PowerShell 当成错误记录，这里收进变量只挑摘要行。
    $pushOut = & $adb @adbArgs push "$www\." "$RemoteRoot/www/" 2>&1
    $pushCode = $LASTEXITCODE
    $pushLines = @($pushOut | ForEach-Object { "$_" } | Where-Object { $_ -match 'files? pushed|skipped' })
    if ($pushLines.Count -gt 0) { Write-Host ("  " + $pushLines[-1].Trim()) -ForegroundColor DarkGray }
    if ($pushCode -ne 0) {
        $ErrorActionPreference = 'Stop'
        $pushOut | ForEach-Object { "$_" } | Select-Object -Last 5 | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        throw 'adb push 失败。'
    }

    # dev.flag 存在时 app 才从外部目录加载页面
    & $adb @adbArgs shell "touch $RemoteRoot/dev.flag" | Out-Null
    Write-Host '重启 app ...' -ForegroundColor Cyan
    & $adb @adbArgs shell "am force-stop $Pkg" | Out-Null
    & $adb @adbArgs shell "am start -n $Pkg/$Activity" | Out-Null
    $ErrorActionPreference = 'Stop'

    Write-Host ''
    Write-Host '已生效。改完 js/css 再跑一次 push 就行。' -ForegroundColor Green
    Write-Host '看 console：' -ForegroundColor DarkGray
    Write-Host "  $adb $($adbArgs -join ' ') logcat -s chromium:V" -ForegroundColor DarkGray
    Write-Host '看画面（装了 scrcpy）：scrcpy' -ForegroundColor DarkGray
}

# ---------------------------------------------------------------- 入口

switch ($Task) {
    'help' { Write-Host $helpText }
    'tools' { Show-Tools }
    'build' { Invoke-Build }
    'install' { Invoke-Install }
    'push' { Invoke-Push }
    'all' { Invoke-Build; Invoke-Install; Invoke-Push }
}
