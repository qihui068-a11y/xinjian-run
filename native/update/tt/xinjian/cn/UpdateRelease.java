package tt.xinjian.cn;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class UpdateRelease {
    static final String REPOSITORY = "qihui068-a11y/xinjian-run";
    static final String LATEST = "https://api.github.com/repos/" + REPOSITORY + "/releases/latest";
    private static final String DIGITS = "[0-9]{1,5}\\.[0-9]{1,5}(?:\\.[0-9]{1,5})?";
    private static final String LEGACY_SUFFIX = "(?:-run)?";
    private static final Pattern VERSION = Pattern.compile("v?(" + DIGITS + ")" + LEGACY_SUFFIX);
    private static final Pattern CACHE_NAME = Pattern.compile("update-" + DIGITS + LEGACY_SUFFIX + "-[a-f0-9]{64}\\.apk");
    private static final long MAX_APK_BYTES = 64L * 1024 * 1024;
    private static final String OFFICIAL = "tt.xinjian.cn.codeedit.run";
    private static final Pattern CHANNEL = Pattern.compile("[a-z][a-z0-9]{0,15}");

    /**
     * 正式包读 xinjian-run-&lt;版本&gt;.apk；并存包（tt.xinjian.cn.dev 等）读带后缀的同名资产，
     * 因为不同包名/签名的安装包不能互相覆盖。
     */
    static String channel(String packageName) {
        if (OFFICIAL.equals(packageName)) return "";
        int dot = packageName.lastIndexOf('.');
        String tail = dot < 0 ? "" : packageName.substring(dot + 1);
        return CHANNEL.matcher(tail).matches() ? "-" + tail : "";
    }

    final String version;
    final String url;
    final String sha256;
    final long bytes;

    private UpdateRelease(String version, String url, String sha256, long bytes) {
        this.version = version;
        this.url = url;
        this.sha256 = sha256;
        this.bytes = bytes;
    }

    String cacheName() {
        return "update-" + version + "-" + sha256 + ".apk";
    }

    static boolean isCacheName(String name) {
        return name != null && CACHE_NAME.matcher(name).matches();
    }

    private static String numericVersion(String value) throws IOException {
        Matcher m = VERSION.matcher(value);
        if (!m.matches()) throw new IOException("版本编号格式有误");
        return m.group(1);
    }

    private static int compare(String a, String b) {
        String[] left = a.split("\\."), right = b.split("\\.");
        for (int i = 0; i < 3; i++) {
            int l = i < left.length ? Integer.parseInt(left[i]) : 0;
            int r = i < right.length ? Integer.parseInt(right[i]) : 0;
            if (l != r) return Integer.compare(l, r);
        }
        return 0;
    }

    static UpdateRelease read(JSONObject release, String installed, String channel) throws IOException, JSONException {
        String tag = release.getString("tag_name");
        if (!tag.startsWith("v") || release.optBoolean("draft") || release.optBoolean("prerelease")) {
            throw new IOException("未找到正式版本");
        }
        String next = numericVersion(tag);
        if (compare(next, numericVersion(installed)) <= 0) return null;

        String name = "xinjian-run-" + next + channel + ".apk";
        String url = "https://github.com/" + REPOSITORY + "/releases/download/" + tag + "/" + name;
        JSONArray assets = release.getJSONArray("assets");
        for (int i = 0; i < assets.length(); i++) {
            JSONObject asset = assets.getJSONObject(i);
            if (!name.equals(asset.optString("name"))) continue;
            long bytes = asset.optLong("size", 0);
            String digest = asset.optString("digest");
            if (!url.equals(asset.optString("browser_download_url")) || !"uploaded".equals(asset.optString("state")) ||
                    !digest.matches("sha256:[a-f0-9]{64}") || bytes < 1 || bytes > MAX_APK_BYTES) {
                throw new IOException("安装包信息有误");
            }
            return new UpdateRelease(tag.substring(1), url, digest.substring(7), bytes);
        }
        throw new IOException(channel.isEmpty() ? "最新版暂未提供安装包" : "这个测试包还没有对应的安装包");
    }
}
