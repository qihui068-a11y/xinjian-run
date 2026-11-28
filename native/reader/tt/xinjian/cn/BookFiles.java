package tt.xinjian.cn;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.RandomAccessFile;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.zip.CRC32;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** Byte-preserving bookshelf I/O. File arguments are resolved by XinJianBridge. */
public final class BookFiles {
    static final int CHUNK = 256 * 1024;
    static final int MAX_BOOK = 64 * 1024 * 1024;
    static final int MAX_MARKUP = 2 * 1024 * 1024;
    static final int MAX_IMAGE = 3 * 1024 * 1024;
    private static final long MAX_EXPANDED = 160L * 1024 * 1024;
    private static final int MAX_ENTRIES = 5000;
    private static final String TOKEN = "book-[0-9]+\\.part";

    private BookFiles() {}

    private static String type(File file) {
        if (file == null) return "";
        String name = file.getName().toLowerCase(Locale.ROOT);
        if (name.endsWith(".txt")) return "text/plain";
        if (name.endsWith(".epub")) return "application/epub+zip";
        return "";
    }

    public static long size(File file) {
        return !type(file).isEmpty() && file.isFile() ? file.length() : -1;
    }

    public static String chunk(File file, int offset, int count) {
        long length = size(file);
        if (length < 0 || length > MAX_BOOK || offset < 0 || count < 0 ||
                count > CHUNK || (long) offset + count > length) return null;
        try (RandomAccessFile input = new RandomAccessFile(file, "r")) {
            byte[] bytes = new byte[count];
            input.seek(offset);
            input.readFully(bytes);
            return Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (IOException error) {
            return null;
        }
    }

    private static File staging(File file) throws IOException {
        if (type(file).isEmpty()) throw new IOException();
        File parent = file.getParentFile().getCanonicalFile();
        File directory = new File(parent, ".reader-imports");
        if (!directory.getCanonicalFile().equals(directory)) throw new IOException();
        if (!directory.isDirectory() && !directory.mkdir()) throw new IOException();
        return directory;
    }

    public static synchronized String begin(File file, int length) {
        if (type(file).isEmpty() || file.exists() || length < 0 || length > MAX_BOOK) return null;
        try {
            File directory = staging(file);
            File[] pending = directory.listFiles();
            if (pending != null) {
                long cutoff = System.currentTimeMillis() - 24L * 60 * 60 * 1000;
                for (File item : pending) {
                    if (item.getName().matches(TOKEN) && item.lastModified() < cutoff) item.delete();
                }
            }
            return File.createTempFile("book-", ".part", directory).getName();
        } catch (IOException error) {
            return null;
        }
    }

    private static File pending(File file, String token) throws IOException {
        if (token == null || !token.matches(TOKEN)) throw new IOException();
        File temp = new File(staging(file), token);
        if (!temp.getCanonicalFile().equals(temp) || !temp.isFile()) throw new IOException();
        return temp;
    }

    public static synchronized boolean append(File file, String token, int offset, String encoded) {
        if (encoded == null || encoded.length() > ((CHUNK + 2) / 3) * 4 || offset < 0) return false;
        try {
            File temp = pending(file, token);
            byte[] bytes = Base64.decode(encoded, Base64.NO_WRAP);
            if (bytes.length > CHUNK || (long) offset + bytes.length > MAX_BOOK || temp.length() != offset) return false;
            try (FileOutputStream output = new FileOutputStream(temp, true)) {
                output.write(bytes);
            }
            return true;
        } catch (IOException | IllegalArgumentException error) {
            return false;
        }
    }

    public static synchronized boolean finish(File file, String token, int length) {
        try {
            File temp = pending(file, token);
            return temp.length() == length && length >= 0 && length <= MAX_BOOK && !file.exists() && temp.renameTo(file);
        } catch (IOException error) {
            return false;
        }
    }

    public static synchronized void cancel(File file, String token) {
        try {
            pending(file, token).delete();
        } catch (IOException ignored) {}
    }

    static boolean safeEntry(String name, boolean directory) {
        if (name == null || name.isEmpty() || name.length() > 512 || name.indexOf('\\') >= 0 ||
                name.indexOf(':') >= 0 || name.indexOf('\0') >= 0) return false;
        if (directory && name.endsWith("/")) name = name.substring(0, name.length() - 1);
        for (String part : name.split("/", -1)) {
            if (part.isEmpty() || part.equals(".") || part.equals("..")) return false;
        }
        return true;
    }

    private static ZipFile open(File file) throws IOException {
        if (!"application/epub+zip".equals(type(file)) || size(file) <= 0 || size(file) > MAX_BOOK) {
            throw new IOException();
        }
        return new ZipFile(file);
    }

    private static boolean reasonable(ZipEntry entry, int max) {
        long size = entry.getSize();
        long packed = entry.getCompressedSize();
        return size >= 0 && size <= max && packed >= 0 &&
                (size <= 64 * 1024 || (packed > 0 && size <= packed * 250));
    }

    static void validate(ZipFile zip) throws IOException {
        if (zip.size() > MAX_ENTRIES) throw new IOException();
        Set<String> names = new HashSet<>();
        long expanded = 0;
        Enumeration<? extends ZipEntry> entries = zip.entries();
        while (entries.hasMoreElements()) {
            ZipEntry entry = entries.nextElement();
            String name = entry.getName();
            if (!safeEntry(name, entry.isDirectory()) || !names.add(name) || entry.getSize() < 0 ||
                    entry.getCompressedSize() < 0) throw new IOException();
            if (entry.getSize() > MAX_EXPANDED - expanded) throw new IOException();
            expanded += entry.getSize();
        }
        byte[] mime = extract(zip, "mimetype", 64);
        if (!"application/epub+zip".equals(new String(mime, java.nio.charset.StandardCharsets.US_ASCII)) ||
                zip.getEntry("META-INF/container.xml") == null) throw new IOException();
    }

    static byte[] extract(ZipFile zip, String path, int limit) throws IOException {
        if (!safeEntry(path, false)) throw new IOException();
        ZipEntry entry = zip.getEntry(path);
        if (entry == null || entry.isDirectory() || !reasonable(entry, limit)) throw new IOException();
        CRC32 crc = new CRC32();
        int expected = (int) entry.getSize();
        try (InputStream input = zip.getInputStream(entry);
             ByteArrayOutputStream output = new ByteArrayOutputStream(expected)) {
            byte[] buffer = new byte[8192];
            int size = 0, count;
            while ((count = input.read(buffer)) != -1) {
                size += count;
                if (size > expected) throw new IOException();
                output.write(buffer, 0, count);
                crc.update(buffer, 0, count);
            }
            if (size != expected || crc.getValue() != entry.getCrc()) throw new IOException();
            return output.toByteArray();
        }
    }

    public static boolean archive(File file) {
        try (ZipFile zip = open(file)) {
            validate(zip);
            return true;
        } catch (IOException | IllegalArgumentException error) {
            return false;
        }
    }

    public static String entry(File file, String path, String imageType) {
        try (ZipFile zip = open(file)) {
            if (zip.size() > MAX_ENTRIES) return null;
            boolean image = imageType != null && !imageType.isEmpty();
            byte[] bytes = extract(zip, path, image ? MAX_IMAGE : MAX_MARKUP);
            if (image) {
                BitmapFactory.Options options = new BitmapFactory.Options();
                options.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
                if (!imageType.equals(options.outMimeType) || options.outWidth < 1 || options.outHeight < 1 ||
                        (long) options.outWidth * options.outHeight > 4_000_000) return null;
            }
            return Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (IOException | IllegalArgumentException error) {
            return null;
        }
    }

    private static void copy(File file, OutputStream output) throws IOException {
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[CHUNK];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        }
    }

    public static boolean export(Context context, File file) {
        if (size(file) < 0) return false;
        try {
            if (Build.VERSION.SDK_INT >= 29) return exportScoped(context.getContentResolver(), file);
            File folder = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "信笺代码版");
            if (!folder.isDirectory() && !folder.mkdirs()) return false;
            File temp = File.createTempFile("book-", ".part", folder);
            try {
                try (OutputStream output = new FileOutputStream(temp)) {
                    copy(file, output);
                }
                return temp.renameTo(new File(folder, file.getName()));
            } finally {
                temp.delete();
            }
        } catch (IOException | RuntimeException error) {
            return false;
        }
    }

    private static boolean exportScoped(ContentResolver resolver, File file) throws IOException {
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, file.getName());
        values.put(MediaStore.MediaColumns.MIME_TYPE, type(file));
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/信笺代码版");
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) return false;
        boolean complete = false;
        try {
            try (OutputStream output = resolver.openOutputStream(uri)) {
                if (output == null) return false;
                copy(file, output);
            }
            values.clear();
            values.put(MediaStore.MediaColumns.IS_PENDING, 0);
            complete = resolver.update(uri, values, null, null) > 0;
            return complete;
        } finally {
            if (!complete) resolver.delete(uri, null, null);
        }
    }
}
