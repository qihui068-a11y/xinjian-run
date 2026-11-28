package tt.xinjian.cn;

import android.content.Context;
import android.content.Intent;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

/** 会话背景图：交给系统裁剪页，裁完把文件放进 media/。 */
public final class CropBridge {
    private static WebView web;

    public CropBridge(WebView view) {
        web = view;
    }

    @JavascriptInterface public void pick() {
        WebView view = web;
        if (view == null) return;
        Context context = view.getContext();
        try {
            Intent intent = new Intent(context, CropActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception ignored) {}
    }

    static void deliver(String json) {
        WebView view = web;
        if (view == null) return;
        view.post(() -> {
            try {
                view.evaluateJavascript("window.__xjCrop&&window.__xjCrop(" +
                        JSONObject.quote(json) + ")", null);
            } catch (Exception ignored) {}
        });
    }
}
