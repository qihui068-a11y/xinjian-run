package tt.xinjian.cn;

import java.io.IOException;
import org.json.JSONArray;
import org.json.JSONObject;

final class UpdateReleaseTest {
    private static JSONObject release(String tag, String digits) throws Exception {
        String name = "xinjian-run-" + digits + ".apk";
        String link = "https://github.com/" + UpdateRelease.REPOSITORY + "/releases/download/" + tag + "/" + name;
        JSONObject file = new JSONObject().put("name", name).put("state", "uploaded")
                .put("browser_download_url", link).put("size", 1024)
                .put("digest", "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        return new JSONObject().put("tag_name", tag).put("assets", new JSONArray().put(file));
    }

    private static void check(String tag, String digits, String installed, String expected) throws Exception {
        UpdateRelease update = UpdateRelease.read(release(tag, digits), installed);
        String version = update == null ? null : update.version;
        if (expected == null ? version != null : !expected.equals(version)) {
            throw new AssertionError("Unexpected target version: " + version + ", compared " + installed + " to " + tag);
        }
    }

    public static void main(String[] args) throws Exception {
        check("v0.7.19", "0.7.19", "0.7.18-run", "0.7.19");
        check("v0.8.0", "0.8.0", "0.7.19", "0.8.0");
        check("v0.8.1", "0.8.1", "0.8.0", "0.8.1");
        check("v0.7.18-run", "0.7.18", "0.7.17", "0.7.18-run");
        check("v0.7.19", "0.7.19", "0.7.19-run", null);
        check("v0.7.18-run", "0.7.18", "0.7.19", null);
        try {
            UpdateRelease.read(release("v0.7.19-beta", "0.7.19"), "0.7.18");
            throw new AssertionError("Preview suffix unexpectedly accepted");
        } catch (IOException expected) {
            System.out.println("PASS numbered releases with and without the legacy suffix");
        }
    }
}
