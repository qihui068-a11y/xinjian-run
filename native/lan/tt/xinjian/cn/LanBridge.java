package tt.xinjian.cn;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.wifi.WifiManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.IOException;
import java.util.UUID;

/** WebView 与鸽屋局域网传输之间的原生接口。 */
public final class LanBridge {
    private final Context context;
    private final WebView web;
    private final String id;
    private LanTransport transport;
    private WifiManager.MulticastLock wifiLock;
    private boolean foreground;
    private boolean disposed;
    private String enabledNick;
    private int sequence;

    public LanBridge(Context context, WebView web) {
        this.context = context.getApplicationContext();
        this.web = web;
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
            transport = new LanTransport(id, enabledNick, this::emit);
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
