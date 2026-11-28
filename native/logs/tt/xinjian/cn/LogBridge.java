package tt.xinjian.cn;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/** 本地日志：崩溃兜底、错误文件、记录模式与 /0/xinjian/wrong 存储。 */
public final class LogBridge {
    private static final String KEY_MODE = "mode";
    private static final String MODE_ERROR = "error";
    private static final String MODE_FULL = "full";
    private static final String MODE_OFF = "off";
    private static final int MAX_FILES = 40;
    private static final int MAX_READ = 256 * 1024;
    private static final Pattern NAME = Pattern.compile("[A-Za-z0-9._-]{1,80}");

    private static boolean handlerInstalled;

    private final Context ctx;
    private final Activity activity;
    private final File privateDir;
    private final SharedPreferences prefs;

    public LogBridge(Context context) {
        ctx = context.getApplicationContext();
        activity = context instanceof Activity ? (Activity) context : null;
        File base = ctx.getExternalFilesDir(null);
        if (base == null) base = ctx.getFilesDir();
        privateDir = new File(base, "wrong");
        prefs = ctx.getSharedPreferences("xj-logs", Context.MODE_PRIVATE);
        if (!handlerInstalled) {
            handlerInstalled = true;
            final Thread.UncaughtExceptionHandler previous = Thread.getDefaultUncaughtExceptionHandler();
            Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
                @Override public void uncaughtException(Thread thread, Throwable error) {
                    try { writeCrash(thread, error); } catch (Throwable ignored) {}
                    if (previous != null) {
                        previous.uncaughtException(thread, error);
                    } else {
                        android.os.Process.killProcess(android.os.Process.myPid());
                        System.exit(10);
                    }
                }
            });
        }
    }

    @JavascriptInterface public String state() {
        JSONObject out = new JSONObject();
        try {
            out.put("public", canPublic());
            out.put("path", dir().getAbsolutePath());
            out.put("mode", prefs.getString(KEY_MODE, MODE_ERROR));
            out.put("sdk", Build.VERSION.SDK_INT);
        } catch (Exception ignored) {}
        return out.toString();
    }

    @JavascriptInterface public boolean requestStorage() {
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                        Uri.parse("package:" + ctx.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
                return true;
            } catch (Exception ignored) {
                return false;
            }
        }
        if (Build.VERSION.SDK_INT >= 23 && Build.VERSION.SDK_INT <= 28 && activity != null) {
            activity.requestPermissions(new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE}, 1006);
            return true;
        }
        return false;
    }

    @JavascriptInterface public String list() {
        JSONArray out = new JSONArray();
        File[] files = dir().listFiles();
        if (files != null) {
            Arrays.sort(files, new Comparator<File>() {
                @Override public int compare(File a, File b) {
                    return Long.compare(b.lastModified(), a.lastModified());
                }
            });
            for (File file : files) {
                if (!file.isFile() || !file.getName().endsWith(".log")) continue;
                try {
                    out.put(new JSONObject()
                            .put("name", file.getName())
                            .put("size", file.length())
                            .put("mtime", file.lastModified()));
                } catch (Exception ignored) {}
            }
        }
        return out.toString();
    }

    @JavascriptInterface public String read(String name) {
        if (!valid(name)) return "";
        return readText(new File(dir(), name), MAX_READ);
    }

    @JavascriptInterface public boolean write(String name, String text) {
        if (!valid(name)) return false;
        try {
            FileOutputStream out = new FileOutputStream(new File(dir(), name));
            try {
                out.write((text == null ? "" : text).getBytes(StandardCharsets.UTF_8));
                out.flush();
            } finally {
                out.close();
            }
            trim();
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    @JavascriptInterface public boolean remove(String name) {
        if (!valid(name)) return false;
        try {
            return new File(dir(), name).delete();
        } catch (Exception ignored) {
            return false;
        }
    }

    @JavascriptInterface public boolean clear() {
        File[] files = dir().listFiles();
        boolean ok = true;
        if (files != null) {
            for (File file : files) {
                if (!file.isFile()) continue;
                String name = file.getName();
                if (name.endsWith(".log") || "breadcrumbs.txt".equals(name)) {
                    if (!file.delete()) ok = false;
                }
            }
        }
        return ok;
    }

    @JavascriptInterface public void setMode(String mode) {
        prefs.edit().putString(KEY_MODE, cleanMode(mode)).apply();
    }

    @JavascriptInterface public String mode() {
        return prefs.getString(KEY_MODE, MODE_ERROR);
    }

    private static String cleanMode(String mode) {
        if (MODE_FULL.equals(mode)) return MODE_FULL;
        if (MODE_OFF.equals(mode)) return MODE_OFF;
        return MODE_ERROR;
    }

    private static boolean valid(String name) {
        return name != null && !".".equals(name) && !"..".equals(name) && NAME.matcher(name).matches();
    }

    private File publicDir() {
        return new File(Environment.getExternalStorageDirectory(), "xinjian/wrong");
    }

    private boolean canPublic() {
        if (Build.VERSION.SDK_INT >= 30 && !Environment.isExternalStorageManager()) return false;
        if (Build.VERSION.SDK_INT >= 23 && Build.VERSION.SDK_INT < 30 &&
                ctx.checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE)
                        != PackageManager.PERMISSION_GRANTED) return false;
        File dir = publicDir();
        return dir.isDirectory() || dir.mkdirs();
    }

    private File dir() {
        if (canPublic()) {
            File dir = publicDir();
            if (dir.isDirectory() || dir.mkdirs()) {
                adopt(dir);
                return dir;
            }
        }
        if (!privateDir.isDirectory()) privateDir.mkdirs();
        return privateDir;
    }

    /* 授权公共目录后，把之前暂存在私有目录的日志搬过去，用户不会“丢日志”。 */
    private void adopt(File target) {
        File[] files = privateDir.listFiles();
        if (files == null) return;
        for (File file : files) {
            if (!file.isFile()) continue;
            String name = file.getName();
            if (!name.endsWith(".log") && !"breadcrumbs.txt".equals(name)) continue;
            File copy = new File(target, name);
            if (copy.exists()) continue;
            FileInputStream in = null;
            FileOutputStream out = null;
            try {
                in = new FileInputStream(file);
                out = new FileOutputStream(copy);
                byte[] buffer = new byte[8192];
                int count;
                while ((count = in.read(buffer)) > 0) out.write(buffer, 0, count);
                out.flush();
            } catch (Exception ignored) {
            } finally {
                if (in != null) try { in.close(); } catch (Exception ignored) {}
                if (out != null) try { out.close(); } catch (Exception ignored) {}
            }
        }
    }

    private void trim() {
        File[] files = dir().listFiles();
        if (files == null) return;
        List<File> logs = new ArrayList<>();
        for (File file : files) {
            if (file.isFile() && file.getName().endsWith(".log")) logs.add(file);
        }
        if (logs.size() <= MAX_FILES) return;
        logs.sort(new Comparator<File>() {
            @Override public int compare(File a, File b) {
                return Long.compare(b.lastModified(), a.lastModified());
            }
        });
        for (int i = MAX_FILES; i < logs.size(); i++) logs.get(i).delete();
    }

    private void writeCrash(Thread thread, Throwable error) {
        String mode = prefs.getString(KEY_MODE, MODE_ERROR);
        if (MODE_OFF.equals(mode)) return;
        StringBuilder text = new StringBuilder();
        text.append("时间: ").append(stamp("yyyy-MM-dd HH:mm:ss")).append('\n');
        text.append("类型: 原生崩溃\n");
        text.append("记录模式: ").append(mode).append('\n');
        text.append("版本: ").append(version()).append('\n');
        text.append("设备: ").append(Build.MANUFACTURER).append(' ').append(Build.MODEL).append('\n');
        text.append("系统: Android ").append(Build.VERSION.RELEASE)
                .append(" (API ").append(Build.VERSION.SDK_INT).append(")\n");
        text.append("线程: ").append(thread == null ? "?" : thread.getName()).append("\n\n");
        text.append("异常:\n").append(stack(error)).append('\n');
        Throwable cause = error == null ? null : error.getCause();
        int depth = 0;
        while (cause != null && cause != error && depth++ < 8) {
            text.append("由以下原因引起:\n").append(stack(cause)).append('\n');
            cause = cause.getCause();
        }
        if (MODE_FULL.equals(mode)) {
            String crumbs = readText(new File(dir(), "breadcrumbs.txt"), 64 * 1024);
            if (crumbs.length() > 0) text.append("\n最近操作:\n").append(crumbs);
        }
        try {
            File file = new File(dir(), "crash-" + stamp("yyyyMMdd-HHmmss") + ".log");
            FileOutputStream out = new FileOutputStream(file);
            try {
                out.write(text.toString().getBytes(StandardCharsets.UTF_8));
                out.flush();
            } finally {
                out.close();
            }
            trim();
        } catch (Throwable ignored) {}
    }

    private String version() {
        try {
            PackageInfo info = ctx.getPackageManager().getPackageInfo(ctx.getPackageName(), 0);
            return info.versionName == null ? "?" : info.versionName;
        } catch (Exception ignored) {
            return "?";
        }
    }

    private static String stack(Throwable error) {
        if (error == null) return "(未知异常)";
        StringWriter writer = new StringWriter();
        error.printStackTrace(new PrintWriter(writer));
        return writer.toString();
    }

    private static String stamp(String pattern) {
        return new SimpleDateFormat(pattern, Locale.US).format(new Date());
    }

    private static String readText(File file, int limit) {
        if (file == null || !file.isFile()) return "";
        FileInputStream in = null;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            in = new FileInputStream(file);
            byte[] buffer = new byte[8192];
            int total = 0;
            int count;
            while (total < limit && (count = in.read(buffer)) > 0) {
                int take = Math.min(count, limit - total);
                out.write(buffer, 0, take);
                total += take;
            }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            return "";
        } finally {
            if (in != null) try { in.close(); } catch (Exception ignored) {}
        }
    }
}
