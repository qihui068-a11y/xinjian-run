package tt.xinjian.cn;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/** AI 请求的原生代理：WebView 直接请求模型接口会被 CORS 拦住。 */
public final class AiBridge {
    private static final int MAX_BODY = 2 * 1024 * 1024;
    private static final int TIMEOUT = 60000;
    private static final Pattern ID = Pattern.compile("[A-Za-z0-9_-]{1,64}");

    private final WebView web;
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread thread = new Thread(r, "xj-ai");
        thread.setDaemon(true);
        return thread;
    });

    public AiBridge(WebView web) {
        this.web = web;
    }

    @JavascriptInterface public void request(final String id, final String url,
                                             final String headers, final String body) {
        if (id == null || !ID.matcher(id).matches()) return;
        worker.execute(() -> {
            JSONObject out = new JSONObject();
            HttpURLConnection connection = null;
            try {
                URL target = new URL(url);
                String protocol = target.getProtocol();
                if (!"https".equalsIgnoreCase(protocol) && !"http".equalsIgnoreCase(protocol)) {
                    throw new IllegalArgumentException("只支持 http/https");
                }
                connection = (HttpURLConnection) target.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(TIMEOUT);
                connection.setReadTimeout(TIMEOUT);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                connection.setRequestProperty("Accept", "application/json");
                if (headers != null && headers.length() > 0) {
                    JSONObject extra = new JSONObject(headers);
                    Iterator<String> keys = extra.keys();
                    while (keys.hasNext()) {
                        String key = keys.next();
                        String value = extra.optString(key, "");
                        if (value.length() > 0 && !"Content-Type".equalsIgnoreCase(key)) {
                            connection.setRequestProperty(key, value);
                        }
                    }
                }
                byte[] payload = (body == null ? "" : body).getBytes(StandardCharsets.UTF_8);
                OutputStream stream = connection.getOutputStream();
                try {
                    stream.write(payload);
                    stream.flush();
                } finally {
                    stream.close();
                }
                int status = connection.getResponseCode();
                InputStream input = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                String text = read(input);
                out.put("id", id);
                out.put("ok", status >= 200 && status < 300);
                out.put("status", status);
                out.put("body", text);
            } catch (Exception error) {
                try {
                    out.put("id", id);
                    out.put("ok", false);
                    out.put("status", 0);
                    out.put("body", "");
                    out.put("error", String.valueOf(error.getMessage()));
                } catch (Exception ignored) {}
            } finally {
                if (connection != null) connection.disconnect();
            }
            send(out.toString());
        });
    }

    private void send(String json) {
        web.post(() -> {
            try {
                web.evaluateJavascript("window.__xjAi&&window.__xjAi(" +
                        JSONObject.quote(json) + ")", null);
            } catch (Exception ignored) {}
        });
    }

    private static String read(InputStream input) {
        if (input == null) return "";
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            byte[] buffer = new byte[8192];
            int count;
            int total = 0;
            while (total < MAX_BODY && (count = input.read(buffer)) > 0) {
                int take = Math.min(count, MAX_BODY - total);
                out.write(buffer, 0, take);
                total += take;
            }
        } catch (Exception ignored) {
        } finally {
            try { input.close(); } catch (Exception ignored) {}
        }
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }
}
