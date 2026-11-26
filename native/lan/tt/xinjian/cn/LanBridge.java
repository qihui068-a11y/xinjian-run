package tt.xinjian.cn;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.wifi.WifiManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.UUID;

/** WebView 与鸽屋局域网传输之间的原生接口。 */
public final class LanBridge {
    private final Context context;
    private final WebView web;
    private final String id;
    private final File media;
    private LanTransport transport;
    private WifiManager.MulticastLock wifiLock;
    private boolean foreground;
    private boolean disposed;
    private String enabledNick;
    private int sequence;

    public LanBridge(Context context, WebView web) {
        this.context = context.getApplicationContext();
        this.web = web;
        File ext = this.context.getExternalFilesDir(null);
        /* 极少数设备会返回 null；这时只关掉图片能力，不能让它把启动搞崩 */
        media = ext == null ? null : new File(ext, "media");
        SharedPreferences settings = this.context.getSharedPreferences("xj-lan", Context.MODE_PRIVATE);
        String identifier = settings.getString("id", "");
        if (!LanTransport.validId(identifier)) {
            identifier = "xj-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            settings.edit().putString("id", identifier).apply();
        }
        id = identifier;
    }

    @JavascriptInterface public String deviceId() {
        return id;
    }

    @JavascriptInterface public synchronized boolean start(String nick) {
        if (!foreground || disposed) return false;
        String name = nick == null ? "" : nick.trim();
        enabledNick = name.isEmpty() ? id : name.substring(0, Math.min(name.length(), 48));
        if (transport != null) return true;
        return open();
    }

    @JavascriptInterface public synchronized void stop() {
        enabledNick = null;
        closeTransport();
        state(false, false);
    }

    @JavascriptInterface public synchronized boolean send(String peerId, String mid, String text) {
        return transport != null && transport.send(peerId, mid, text);
    }

    /* 把 media/ 里的原图读成 base64 交给 JS 压缩。图片不认识就返回空串。 */
    @JavascriptInterface public String readMedia(String name) {
        if (name == null || name.isEmpty() || name.indexOf('/') >= 0 || name.indexOf("..") >= 0) return "";
        if (media == null) return "";
        try {
            File file = new File(media, name);
            if (!file.isFile() || file.length() < 1 || file.length() > LanTransport.MAX_IMAGE) return "";
            byte[] bytes = new byte[(int) file.length()];
            try (FileInputStream input = new FileInputStream(file)) {
                int at = 0;
                while (at < bytes.length) {
                    int read = input.read(bytes, at, bytes.length - at);
                    if (read < 0) break;
                    at += read;
                }
            }
            return android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
        } catch (IOException | RuntimeException error) {
            return "";
        }
    }

    /* 删掉 media/ 里的一张图：删除会话、以及收到被屏蔽者的图时用 */
    @JavascriptInterface public synchronized boolean deleteMedia(String name) {
        if (name == null || name.isEmpty() || name.indexOf('/') >= 0 || name.indexOf("..") >= 0) return false;
        if (media == null) return false;
        try {
            File file = new File(media, name);
            return file.isFile() && file.delete();
        } catch (RuntimeException error) {
            return false;
        }
    }

    @JavascriptInterface public synchronized boolean sendImage(String peerId, String mid, String name,
                                                              int width, int height, String base64) {
        return transport != null && transport.sendImage(peerId, mid, name, width, height, base64);
    }

    public synchronized void onResume() {
        foreground = true;
        if (enabledNick != null && transport == null && !disposed) {
            new Thread(this::resumeTransport, "xj-lan-resume").start();
        }
    }

    private synchronized void resumeTransport() {
        if (foreground && enabledNick != null && transport == null && !disposed) open();
    }

    public synchronized void onStop() {
        foreground = false;
        closeTransport();
        state(false, false);
    }

    public synchronized void onDestroy() {
        disposed = true;
        enabledNick = null;
        closeTransport();
    }

    private boolean open() {
        try {
            WifiManager wifi = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
            if (wifi != null) {
                wifiLock = wifi.createMulticastLock("xj-lan");
                wifiLock.setReferenceCounted(false);
                wifiLock.acquire();
            }
        } catch (RuntimeException ignored) {}

        try {
            transport = new LanTransport(id, enabledNick, this::emit, media);
            state(true, false);
            transport.start();
            return true;
        } catch (IOException | RuntimeException error) {
            enabledNick = null;
            closeTransport();
            state(false, true);
            return false;
        }
    }

    private void closeTransport() {
        LanTransport old = transport;
        transport = null;
        if (old != null) old.close();
        if (wifiLock != null) {
            try { if (wifiLock.isHeld()) wifiLock.release(); }
            catch (RuntimeException ignored) {}
            wifiLock = null;
        }
    }

    private void state(boolean running, boolean failed) {
        final int version = ++sequence;
        final String json = "{\"t\":\"state\",\"on\":" + running + ",\"failed\":" + failed + "}";
        web.post(() -> {
            synchronized (LanBridge.this) {
                if (!disposed && version == sequence) dispatch(json);
            }
        });
    }

    private void emit(LanTransport source, JSONObject event) {
        final String json = event.toString();
        web.post(() -> {
            synchronized (LanBridge.this) {
                if (!disposed && transport == source) dispatch(json);
            }
        });
    }

    private void dispatch(String json) {
        String argument = JSONObject.quote(json).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029");
        web.evaluateJavascript("window.__xjLan&&window.__xjLan(" + argument + ")", null);
    }
}