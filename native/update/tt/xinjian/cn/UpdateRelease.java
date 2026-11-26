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
    private static final Pattern VERSION = Pattern.compile("v?([0-9]{1,5}\\.[0-9]{1,5}(?:\\.[0-9]{1,5})?)(?:-run)?");
    private static final long MAX_APK_BYTES = 64L * 1024 * 1024;

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

    static UpdateRelease read(JSONObject release, String installed) throws IOException, JSONException {
        String tag = release.getString("tag_name");
        if (!tag.startsWith("v") || release.optBoolean("draft") || release.optBoolean("prerelease")) {
            throw new IOException("未找到正式版本");
        }
        String next = numericVersion(tag);
        if (compare(next, numericVersion(installed)) <= 0) return null;

        String name = "xinjian-run-" + next + ".apk";
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
        throw new IOException("最新版暂未提供安装包");
    }
}
