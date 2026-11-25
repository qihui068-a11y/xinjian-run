package tt.xinjian.cn;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class UpdateBridge {
    private final Activity activity;
    private final WebView web;
    private final PackageInfo installed;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private volatile boolean closed;
    private volatile String state;
    private boolean busy;
    private UpdateRelease release;
    private boolean ready;

    @SuppressWarnings("deprecation")
    public UpdateBridge(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        try {
            installed = activity.getPackageManager().getPackageInfo(activity.getPackageName(), signerFlags());
        } catch (PackageManager.NameNotFoundException error) {
            throw new IllegalStateException("Cannot read the installed version", error);
        }
        state = status("idle", 0, "").toString();
    }

    @JavascriptInterface public String info() {
        return state;
    }

    @JavascriptInterface public synchronized void check() {
        if (!begin("checking", 0)) return;
        worker.execute(() -> {
            try {
                UpdateRelease next = UpdateRelease.read(fetchLatest(), installed.versionName);
                boolean cached = next != null && validCached(UpdateApkProvider.apk(activity), next);
                synchronized (UpdateBridge.this) {
                    release = next;
                    ready = cached;
                    finish(next == null ? "current" : cached ? "ready" : "available", cached ? 100 : 0, "");
                }
            } catch (IOException error) {
                finish("checkError", 0, message(error, "检查更新失败，请稍后重试"));
            } catch (Exception error) {
                finish("checkError", 0, "版本信息有误，请稍后重试");
            }
        });
    }

    @JavascriptInterface public synchronized void download() {
        if (release == null || !begin("downloading", 0)) return;
        UpdateRelease next = release;
        ready = false;
        worker.execute(() -> {
            try {
                downloadVerified(next);
                synchronized (UpdateBridge.this) {
                    ready = true;
                    finish("ready", 100, "");
                }
            } catch (Exception error) {
                finish("downloadError", 0, message(error, "下载失败，请检查网络后重试"));
            }
        });
    }

    @JavascriptInterface public synchronized void install() {
        if (!ready || release == null || !begin("verifying", 100)) return;
        UpdateRelease next = release;
        worker.execute(() -> {
            if (!validCached(UpdateApkProvider.apk(activity), next)) {
                synchronized (UpdateBridge.this) {
                    ready = false;
                    finish("downloadError", 0, "安装包校验失败，请重新下载");
                }
                return;
            }
            web.post(this::openInstaller);
        });
    }

    private void openInstaller() {
        if (closed || activity.isFinishing()) {
            finish("ready", 100, "");
            return;
        }
        if (Build.VERSION.SDK_INT >= 26 && !activity.getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + activity.getPackageName()));
                activity.startActivity(settings);
                finish("ready", 100, "允许信笺安装应用后，返回这里再点一次安装");
            } catch (ActivityNotFoundException | SecurityException error) {
                finish("ready", 100, "系统限制了应用内安装");
            }
            return;
        }
        try {
            Intent install = new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(UpdateApkProvider.uri(activity), UpdateApkProvider.TYPE);
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(install);
            finish("ready", 100, "");
        } catch (ActivityNotFoundException | SecurityException error) {
            finish("ready", 100, "无法打开系统安装器");
        }
    }

    public synchronized void close() {
        closed = true;
        worker.shutdownNow();
    }

    private boolean begin(String name, int percent) {
        if (closed || busy) return false;
        busy = true;
        publish(name, percent, "");
        return true;
    }

    private synchronized void finish(String name, int percent, String note) {
        busy = false;
        publish(name, percent, note);
    }

    private JSONObject status(String name, int percent, String note) {
        try {
            return new JSONObject().put("state", name).put("current", installed.versionName)
                    .put("latest", release == null ? "" : release.version).put("percent", percent).put("message", note);
        } catch (JSONException error) {
            throw new IllegalStateException(error);
        }
    }

    private void publish(String name, int percent, String note) {
        if (closed) return;
        String value = status(name, percent, note).toString();
        state = value;
        web.post(() -> {
            if (!closed) web.evaluateJavascript("window.__xjUpdate&&window.__xjUpdate(" + JSONObject.quote(value) + ")", null);
        });
    }

    private static HttpURLConnection open(String url, String accept) throws IOException {
        URL address = new URL(url);
        for (int i = 0; i < 5; i++) {
            String host = address.getHost();
            if (!"https".equals(address.getProtocol()) || address.getUserInfo() != null ||
                    (address.getPort() != -1 && address.getPort() != 443) ||
                    !("api.github.com".equals(host) || "github.com".equals(host) ||
                      "release-assets.githubusercontent.com".equals(host) || "objects.githubusercontent.com".equals(host))) {
                throw new IOException("更新下载地址无效");
            }
            HttpURLConnection conn = (HttpURLConnection) address.openConnection();
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(12000);
            conn.setInstanceFollowRedirects(false);
            conn.setUseCaches(false);
            conn.setRequestProperty("User-Agent", "XinJian-Run-Android");
            conn.setRequestProperty("Accept", accept);
            conn.setRequestProperty("Accept-Encoding", "identity");
            try {
                int code = conn.getResponseCode();
                if (code == 200) return conn;
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    String location = conn.getHeaderField("Location");
                    if (location == null) throw new IOException("更新下载地址无效");
                    address = new URL(address, location);
                    conn.disconnect();
                    continue;
                }
                if (code == 403 || code == 429) throw new IOException("GitHub 暂时限制了访问，请稍后重试");
                throw new IOException("更新服务暂不可用");
            } catch (IOException error) {
                conn.disconnect();
                throw error;
            }
        }
        throw new IOException("更新下载地址跳转过多");
    }

    private static JSONObject fetchLatest() throws IOException, JSONException {
        HttpURLConnection conn = open(UpdateRelease.LATEST, "application/vnd.github+json");
        try (InputStream input = conn.getInputStream()) {
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int length;
            while ((length = input.read(buffer)) != -1) {
                if (output.size() + length > 512 * 1024) throw new IOException("版本信息过长");
                output.write(buffer, 0, length);
            }
            return new JSONObject(output.toString(StandardCharsets.UTF_8.name()));
        } finally {
            conn.disconnect();
        }
    }

    private void downloadVerified(UpdateRelease next) throws IOException {
        File target = UpdateApkProvider.apk(activity);
        File directory = target.getParentFile();
        if (!directory.isDirectory() && !directory.mkdirs()) throw new IOException("无法创建下载目录");
        File part = File.createTempFile("download-", ".apk", directory);
        try {
            MessageDigest digest = newDigest();
            HttpURLConnection conn = open(next.url, "application/octet-stream");
            long count = 0;
            int lastPercent = 0;
            try (InputStream input = conn.getInputStream(); FileOutputStream output = new FileOutputStream(part)) {
                byte[] buffer = new byte[16384];
                int length;
                while ((length = input.read(buffer)) != -1) {
                    if (closed) throw new IOException("下载已停止");
                    count += length;
                    if (count > next.bytes) throw new IOException("安装包大小与发布信息不符");
                    output.write(buffer, 0, length);
                    digest.update(buffer, 0, length);
                    int percent = (int) (count * 100 / next.bytes);
                    if (percent != lastPercent) {
                        lastPercent = percent;
                        publish("downloading", percent, "");
                    }
                }
            } finally {
                conn.disconnect();
            }
            if (count != next.bytes || !next.sha256.equals(hex(digest.digest()))) {
                throw new IOException("安装包校验失败，请重试");
            }
            verifyPackage(part, next);
            if (closed || !part.renameTo(target)) throw new IOException("无法保存已校验的安装包");
        } finally {
            if (part.exists()) part.delete();
        }
    }

    private boolean validCached(File file, UpdateRelease next) {
        if (!file.isFile() || file.length() != next.bytes) return false;
        try (FileInputStream input = new FileInputStream(file)) {
            MessageDigest digest = newDigest();
            byte[] buffer = new byte[16384];
            int length;
            while ((length = input.read(buffer)) != -1) digest.update(buffer, 0, length);
            if (!next.sha256.equals(hex(digest.digest()))) return false;
            verifyPackage(file, next);
            return true;
        } catch (IOException | RuntimeException error) {
            return false;
        }
    }

    @SuppressWarnings("deprecation")
    private void verifyPackage(File file, UpdateRelease next) throws IOException {
        PackageInfo candidate = activity.getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(), signerFlags());
        if (candidate == null || !installed.packageName.equals(candidate.packageName) ||
                !next.version.equals(candidate.versionName) || versionCode(candidate) <= versionCode(installed)) {
            throw new IOException("安装包的应用 ID 或版本不匹配");
        }
        Signature[] a = signatures(installed), b = signatures(candidate);
        if (a == null || b == null || a.length == 0 || b.length == 0 ||
                !new HashSet<>(Arrays.asList(a)).equals(new HashSet<>(Arrays.asList(b)))) {
            throw new IOException("安装包签名与已安装应用不一致");
        }
    }

    @SuppressWarnings("deprecation")
    private static int signerFlags() {
        return Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
    }

    @SuppressWarnings("deprecation")
    private static Signature[] signatures(PackageInfo info) {
        if (Build.VERSION.SDK_INT < 28) return info.signatures;
        return info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners();
    }

    @SuppressWarnings("deprecation")
    private static long versionCode(PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }

    private static MessageDigest newDigest() {
        try { return MessageDigest.getInstance("SHA-256"); }
        catch (NoSuchAlgorithmException error) { throw new IllegalStateException(error); }
    }

    private static String hex(byte[] bytes) {
        StringBuilder value = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            value.append(Character.forDigit((b >> 4) & 15, 16)).append(Character.forDigit(b & 15, 16));
        }
        return value.toString();
    }

    private static String message(Exception error, String fallback) {
        String text = error.getMessage();
        return error instanceof IOException && text != null && text.matches("[\\u4e00-\\u9fffA-Za-z ，]{1,70}")
                ? text : fallback;
    }
}
