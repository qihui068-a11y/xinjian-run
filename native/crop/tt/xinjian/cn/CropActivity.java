package tt.xinjian.cn;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;

import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/** 透明中转页：选图 -> 系统裁剪 -> 复制到应用 media/。 */
public final class CropActivity extends Activity {
    private static final int PICK = 1;
    private static final int CROP = 2;

    private Uri source;
    private Uri output;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
        pick.setType("image/*");
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        try {
            startActivityForResult(Intent.createChooser(pick, "选择背景图"), PICK);
        } catch (Exception error) {
            finishWith(false, "nopicker");
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        if (request == PICK) {
            if (result != RESULT_OK || data == null || data.getData() == null) {
                finishWith(false, "cancel");
                return;
            }
            source = data.getData();
            output = outputUri();
            if (output == null) {
                copyAndFinish(source);
                return;
            }
            Intent crop = new Intent("com.android.camera.action.CROP");
            crop.setDataAndType(source, "image/*");
            crop.putExtra("crop", "true");
            crop.putExtra("aspectX", 1);
            crop.putExtra("aspectY", 1);
            crop.putExtra("outputX", 1024);
            crop.putExtra("outputY", 1024);
            crop.putExtra("return-data", false);
            crop.putExtra("noFaceDetection", true);
            crop.putExtra("scale", true);
            crop.putExtra(MediaStore.EXTRA_OUTPUT, output);
            crop.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            crop.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            try {
                startActivityForResult(crop, CROP);
            } catch (Exception error) {
                copyAndFinish(source);
            }
            return;
        }
        if (request == CROP) {
            if (result == RESULT_OK) copyAndFinish(output != null ? output : source);
            else finishWith(false, "cancel");
        }
    }

    private Uri outputUri() {
        try {
            ContentValues values = new ContentValues();
            values.put("_display_name", "xj_crop_" + System.currentTimeMillis() + ".jpg");
            values.put("mime_type", "image/jpeg");
            return getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        } catch (Exception ignored) {
            return null;
        }
    }

    private void copyAndFinish(Uri uri) {
        if (uri == null) {
            finishWith(false, "empty");
            return;
        }
        String type = "image/jpeg";
        try {
            String mime = getContentResolver().getType(uri);
            if (mime != null && mime.startsWith("image/")) type = mime;
        } catch (Exception ignored) {}
        String ext = type.endsWith("png") ? ".png" : type.endsWith("webp") ? ".webp" : ".jpg";
        File base = getExternalFilesDir(null);
        if (base == null) base = getFilesDir();
        File dir = new File(base, "media");
        File target = new File(dir, "bg_" + System.currentTimeMillis() + ext);
        InputStream input = null;
        OutputStream stream = null;
        try {
            if (!dir.isDirectory() && !dir.mkdirs()) throw new Exception("mkdir");
            input = getContentResolver().openInputStream(uri);
            if (input == null) throw new Exception("open");
            stream = new FileOutputStream(target);
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) > 0) stream.write(buffer, 0, count);
            stream.flush();
        } catch (Exception error) {
            target.delete();
            finishWith(false, "copy");
            return;
        } finally {
            if (input != null) try { input.close(); } catch (Exception ignored) {}
            if (stream != null) try { stream.close(); } catch (Exception ignored) {}
            if (output != null && output.equals(uri)) {
                try { getContentResolver().delete(output, null, null); } catch (Exception ignored) {}
            }
        }
        finishWith(true, target.getName());
    }

    private void finishWith(boolean ok, String value) {
        try {
            JSONObject out = new JSONObject();
            out.put("ok", ok);
            if (ok) out.put("name", value);
            else out.put("why", value);
            CropBridge.deliver(out.toString());
        } catch (Exception ignored) {}
        finish();
    }
}
