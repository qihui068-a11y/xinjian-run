package tt.xinjian.cn;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;

public final class UpdateApkProvider extends ContentProvider {
    private static final String NAME = "update.apk";
    static final String TYPE = "application/vnd.android.package-archive";

    static File apk(Context context) {
        return new File(new File(context.getCacheDir(), "updates"), NAME);
    }

    static Uri uri(Context context) {
        return Uri.parse("content://" + context.getPackageName() + ".updates/" + NAME);
    }

    private File file(Uri uri) {
        if (!uri(getContext()).equals(uri)) throw new IllegalArgumentException("Unknown update file");
        return apk(getContext());
    }

    @Override public boolean onCreate() { return true; }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!"r".equals(mode)) throw new FileNotFoundException("Read only");
        return ParcelFileDescriptor.open(file(uri), ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public String getType(Uri uri) {
        file(uri);
        return TYPE;
    }

    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String order) {
        File apk = file(uri);
        String[] columns = projection == null ? new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE} : projection;
        MatrixCursor cursor = new MatrixCursor(columns, 1);
        if (!apk.isFile()) return cursor;
        MatrixCursor.RowBuilder row = cursor.newRow();
        for (String column : columns) {
            if (OpenableColumns.DISPLAY_NAME.equals(column)) row.add(NAME);
            else if (OpenableColumns.SIZE.equals(column)) row.add(apk.length());
            else row.add(null);
        }
        return cursor;
    }

    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
}
