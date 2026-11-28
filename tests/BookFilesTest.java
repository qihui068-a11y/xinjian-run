package tt.xinjian.cn;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

public final class BookFilesTest {
    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static void add(ZipOutputStream zip, String path, byte[] bytes) throws IOException {
        zip.putNextEntry(new ZipEntry(path));
        zip.write(bytes);
        zip.closeEntry();
    }

    private static void add(ZipOutputStream zip, String path, String text) throws IOException {
        add(zip, path, text.getBytes(StandardCharsets.UTF_8));
    }

    private static void write(File file, String entry, byte[] content) throws IOException {
        try (ZipOutputStream zip = new ZipOutputStream(Files.newOutputStream(file.toPath()))) {
            add(zip, "mimetype", "application/epub+zip");
            add(zip, "META-INF/container.xml", "<container/>");
            add(zip, entry, content);
        }
    }

    private static void rejectEntry(ZipFile zip, String entry, int limit) throws IOException {
        try {
            BookFiles.extract(zip, entry, limit);
            throw new AssertionError("Expected rejected entry " + entry);
        } catch (IOException expected) {}
    }

    public static void main(String[] args) throws IOException {
        Path directory = Files.createTempDirectory("xinjian-bookfiles-test");
        File epub = directory.resolve("测试.EPUB").toFile();
        File invalid = directory.resolve("invalid.epub").toFile();
        File text = directory.resolve("book.TXT").toFile();
        File imported = directory.resolve("new.epub").toFile();
        File staging = directory.resolve(".reader-imports").toFile();
        byte[] chapter = "<html><body>信笺</body></html>".getBytes(StandardCharsets.UTF_8);
        try {
            write(epub, "OPS/章节.xhtml", chapter);
            check(BookFiles.archive(epub), "valid EPUB with a Unicode entry");
            try (ZipFile zip = new ZipFile(epub)) {
                check(Arrays.equals(BookFiles.extract(zip, "OPS/章节.xhtml", 1024), chapter), "chapter bytes");
                rejectEntry(zip, "OPS/章节.xhtml", 4);
                rejectEntry(zip, "missing.xhtml", 1024);
                rejectEntry(zip, "../chapter.xhtml", 1024);
            }
            write(invalid, "../outside.xhtml", chapter);
            check(!BookFiles.archive(invalid), "traversal name rejected without extraction");
            check(!BookFiles.safeEntry("/absolute.xhtml", false), "absolute paths");
            check(!BookFiles.safeEntry("OPS//chapter.xhtml", false), "empty segments");
            check(!BookFiles.safeEntry("OPS\\chapter.xhtml", false), "backslash");
            write(invalid, "large.xhtml", new byte[1024 * 1024]);
            try (ZipFile zip = new ZipFile(invalid)) {
                rejectEntry(zip, "large.xhtml", BookFiles.MAX_MARKUP);
            }
            Files.write(invalid.toPath(), chapter);
            check(!BookFiles.archive(invalid), "damaged EPUB");
            check(BookFiles.size(text) == -1, "missing TXT");
            Files.write(text.toPath(), chapter);
            check(BookFiles.size(text) == chapter.length, "case insensitive TXT");

            String token = BookFiles.begin(imported, 0);
            check(token != null && !imported.exists(), "partial file hidden");
            check(BookFiles.finish(imported, token, 0) && imported.isFile(), "atomic empty import");
            check(BookFiles.begin(imported, 0) == null, "duplicate keeps the original");
            imported.delete();
            token = BookFiles.begin(imported, 10);
            check(!BookFiles.finish(imported, token, 10), "incomplete import is not published");
            BookFiles.cancel(imported, token);
            check(!imported.exists(), "cancel leaves no bookshelf file");
            System.out.println("PASS native ZIP validation, bounded entries, Unicode, and import lifecycle");
        } finally {
            epub.delete();
            invalid.delete();
            text.delete();
            imported.delete();
            File[] pending = staging.listFiles();
            if (pending != null) for (File file : pending) file.delete();
            staging.delete();
            Files.deleteIfExists(directory);
        }
    }
}
