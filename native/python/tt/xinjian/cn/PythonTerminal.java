package tt.xinjian.cn;

import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceResponse;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** One local stdin session for the editor's dedicated Python worker. */
public final class PythonTerminal {
    private static final String PATH = "/python-runtime/terminal/";
    private static final Pattern REQUEST = Pattern.compile(
            PATH + "([0-9a-f-]{36})/(0|[1-9][0-9]{0,8})");
    private static final byte[] EMPTY = new byte[0];
    private String token;
    private int nextLine;
    private boolean waiting;
    private boolean submitted;
    private byte[] line;

    @JavascriptInterface
    public synchronized String open() {
        reset();
        token = UUID.randomUUID().toString();
        nextLine = 1;
        return token;
    }

    @JavascriptInterface
    public synchronized boolean send(String session, int number, String text, boolean eof) {
        if (token == null || !token.equals(session) || number != nextLine || submitted ||
                text == null || text.length() > 65536) return false;
        byte[] data = eof ? null : text.getBytes(StandardCharsets.UTF_8);
        if (data != null && data.length > 65536) return false;
        line = data;
        submitted = true;
        notifyAll();
        return true;
    }

    @JavascriptInterface
    public synchronized void close(String session) {
        if (token != null && token.equals(session)) reset();
    }

    public synchronized void reset() {
        token = null;
        waiting = submitted = false;
        line = null;
        notifyAll();
    }

    public synchronized WebResourceResponse serve(Uri uri) {
        String path = uri.getEncodedPath();
        if (path == null || !path.startsWith(PATH)) return null;
        if (!"https".equals(uri.getScheme()) || !"app.xinjian.local".equals(uri.getAuthority()) ||
                uri.getEncodedQuery() != null || uri.getEncodedFragment() != null) {
            return response(404, "Not Found", EMPTY);
        }
        Matcher request = REQUEST.matcher(path);
        if (!request.matches() || !request.group(1).equals(token)) return response(404, "Not Found", EMPTY);
        String session = token;
        int number = Integer.parseInt(request.group(2));
        if (number == 0) return response(204, "No Content", EMPTY);
        if (number != nextLine || waiting) return response(409, "Conflict", EMPTY);

        waiting = true;
        try {
            // WebView calls its resource interceptor off the UI thread.
            while (session.equals(token) && !submitted) wait();
            if (!session.equals(token)) return response(410, "Gone", EMPTY);
            byte[] input = line;
            line = null;
            submitted = false;
            nextLine++;
            return input == null ? response(204, "No Content", EMPTY) : response(200, "OK", input);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            return response(410, "Gone", EMPTY);
        } finally {
            if (session.equals(token)) waiting = false;
        }
    }

    private static WebResourceResponse response(int status, String reason, byte[] data) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        headers.put("X-Content-Type-Options", "nosniff");
        return new WebResourceResponse("text/plain", "UTF-8", status, reason, headers,
                new ByteArrayInputStream(data));
    }
}
