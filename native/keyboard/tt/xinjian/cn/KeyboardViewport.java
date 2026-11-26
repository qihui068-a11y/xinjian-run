package tt.xinjian.cn;

import android.app.Activity;
import android.graphics.Rect;
import android.os.Build;
import android.view.View;
import android.view.ViewTreeObserver;
import android.view.WindowInsets;
import android.webkit.WebView;

/** Reports the height from the WebView's top to the top of a bottom-docked keyboard. */
public final class KeyboardViewport implements View.OnApplyWindowInsetsListener,
        ViewTreeObserver.OnGlobalLayoutListener, Runnable {
    private final Activity activity;
    private final WebView web;
    private final Rect visibleFrame = new Rect();
    private final int[] position = new int[2];
    private int lastVisibleHeight = -1;
    private boolean lastVisible;

    public KeyboardViewport(Activity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        web.getViewTreeObserver().addOnGlobalLayoutListener(this);
        if (Build.VERSION.SDK_INT >= 30) {
            web.setOnApplyWindowInsetsListener(this);
            web.requestApplyInsets();
        }
    }

    @Override public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
        web.removeCallbacks(this);
        web.post(this);
        return view.onApplyWindowInsets(insets);
    }

    @Override public void onGlobalLayout() {
        run();
    }

    @Override public void run() {
        int height = web.getHeight();
        if (height == 0) return;
        web.getLocationOnScreen(position);
        int webBottom = position[1] + height;
        int keyboardTop = webBottom;
        boolean visible = false;
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsets insets = web.getRootWindowInsets();
            int type = WindowInsets.Type.ime();
            if (insets != null && insets.isVisible(type)) {
                int bottom = insets.getInsets(type).bottom;
                visible = bottom > 0;
                keyboardTop = activity.getWindowManager().getCurrentWindowMetrics().getBounds().bottom - bottom;
            }
        } else {
            web.getWindowVisibleDisplayFrame(visibleFrame);
            int fullBottom = Math.max(webBottom, web.getResources().getDisplayMetrics().heightPixels);
            int minimum = Math.round(80 * web.getResources().getDisplayMetrics().density);
            visible = fullBottom - visibleFrame.bottom >= minimum;
            keyboardTop = visibleFrame.bottom;
        }
        // This boundary remains valid when the CSS layout resizes before the callback.
        int visibleHeight = visible ? Math.max(0, keyboardTop - position[1]) : 0;
        if (visibleHeight == lastVisibleHeight && visible == lastVisible) return;
        lastVisibleHeight = visibleHeight;
        lastVisible = visible;
        web.evaluateJavascript("window.__xjKeyboardViewport&&window.__xjKeyboardViewport(" +
                visibleHeight + "," + visible + ")", null);
    }

    public void close() {
        web.removeCallbacks(this);
        ViewTreeObserver tree = web.getViewTreeObserver();
        if (tree.isAlive()) tree.removeOnGlobalLayoutListener(this);
        if (Build.VERSION.SDK_INT >= 30) web.setOnApplyWindowInsetsListener(null);
    }
}
