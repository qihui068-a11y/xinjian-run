package tt.xinjian.cn;

import org.json.JSONException;
import org.json.JSONObject;

import android.util.Base64;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/** 鸽屋协议 v1。UDP 发现以及短连接、逐条回执的 TCP 传输。 */
final class LanTransport implements Closeable {
    static final int UDP_PORT = 45789;
    static final int TCP_PORT = 45790;
    static final int MAX_TEXT = 2000;
    private static final int MAX_FRAME = 16384;
    /* 图片：JS 压到 1 MB 以内再传，base64 约 1.37 MB，切 12000 字符一块（帧远小于 MAX_FRAME） */
    static final int MAX_IMAGE = 2 * 1024 * 1024;
    private static final int CHUNK_CHARS = 12000;
    private static final int CHUNK_BYTES = 9000;
    private static final int MAX_CHUNKS = 220;
    /* 装配表的三道闸：条目上限、单张未完成寿命、每来源同时只许一张 */
    private static final int MAX_IMAGES = 8;
    private static final long IMAGE_TTL_MS = 30000L;
    /* 所有半张图加起来最多 4 MB，超了就不收新块 */
    private static final long MAX_IMAGE_BYTES = 4L * 1024 * 1024;
    /* 只淘汰存活超过 5 秒的半张图，避免别人一串新 mid 就把你正在收的挤掉 */
    private static final long EVICT_MIN_AGE_MS = 5000L;
    private static final int HANDSHAKE_MS = 3500;
    private static final int DISCOVERY_MS = 3000;
    private static final int PEER_LIFETIME_MS = 11000;
    private static final int MAX_PEERS = 128;
    private static final Pattern PEER_ID = Pattern.compile("xj-[0-9a-f]{12}");
    private static final Pattern MESSAGE_ID = Pattern.compile("[A-Za-z0-9_-]{1,80}");

    interface Events {
        void event(LanTransport transport, JSONObject event);
    }

    private final String id;
    private final String nick;
    private final Events events;
    private final DatagramSocket discovery;
    private final ServerSocket server;
    private final Map<String, Peer> peers = new HashMap<>();
    private final Map<String, Incoming> images = new HashMap<>();
    private final File media;
    private final Set<Socket> sockets = new HashSet<>();
    private final ThreadPoolExecutor receivers = pool("xj-lan-recv", 4, 12);
    private final ThreadPoolExecutor senders = pool("xj-lan-send", 2, 12);
    private volatile boolean open = true;
    private Thread announcements;

    /* 一张图的分块装配状态。按 mid 归并，收齐后写盘、再从磁盘路径回报给 JS。 */
    private static final class Incoming {
        final String from;
        final String name;
        final int width;
        final int height;
        final int total;
        final byte[][] parts;
        final long started = System.currentTimeMillis();
        int got;

        Incoming(String from, String name, int width, int height, int total) {
            this.from = from;
            this.name = name;
            this.width = width;
            this.height = height;
            this.total = total;
            this.parts = new byte[total][];
        }

        boolean complete() { return got >= total; }

        byte[] assemble() {
            int size = 0;
            for (byte[] part : parts) if (part != null) size += part.length;
            byte[] whole = new byte[size];
            int at = 0;
            for (byte[] part : parts) {
                if (part == null) continue;
                System.arraycopy(part, 0, whole, at, part.length);
                at += part.length;
            }
            return whole;
        }
    }

    private static final class Peer {
        final InetAddress address;
        final String nick;
        final long seen = System.nanoTime();

        Peer(InetAddress address, String nick) {
            this.address = address;
            this.nick = nick;
        }
    }

    LanTransport(String id, String nick, Events events, File media) throws IOException {
        this.id = id;
        this.nick = nick;
        this.events = events;
        this.media = media;
        DatagramSocket udp = new DatagramSocket(null);
        ServerSocket tcp = new ServerSocket();
        try {
            udp.setReuseAddress(true);
            udp.setBroadcast(true);
            udp.bind(new InetSocketAddress(UDP_PORT));
            tcp.setReuseAddress(true);
            tcp.bind(new InetSocketAddress(TCP_PORT), 16);
        } catch (IOException | RuntimeException error) {
            udp.close();
            closeQuietly(tcp);
            throw error;
        }
        discovery = udp;
        server = tcp;
    }

    void start() {
        thread("xj-lan-discover", this::discover).start();
        thread("xj-lan-accept", this::accept).start();
        announcements = thread("xj-lan-announce", this::announce);
        announcements.start();
    }

    static boolean validId(String value) {
        return value != null && PEER_ID.matcher(value).matches();
    }

    static boolean validMid(String value) {
        return value != null && MESSAGE_ID.matcher(value).matches();
    }

    private static boolean local(InetAddress address) {
        return address.isSiteLocalAddress() || address.isLinkLocalAddress() || address.isLoopbackAddress();
    }

    private static Thread thread(String name, Runnable action) {
        Thread thread = new Thread(action, name);
        thread.setDaemon(true);
        return thread;
    }

    private static ThreadPoolExecutor pool(String name, int threads, int queued) {
        return new ThreadPoolExecutor(threads, threads, 0, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(queued), action -> thread(name, action));
    }

    private static JSONObject object(Object... fields) {
        JSONObject value = new JSONObject();
        try {
            for (int i = 0; i < fields.length; i += 2) value.put((String) fields[i], fields[i + 1]);
        } catch (JSONException error) {
            throw new IllegalArgumentException(error);
        }
        return value;
    }

    private void emit(Object... fields) {
        if (open) events.event(this, object(fields));
    }

    private JSONObject introduction(String type) {
        return object("v", 1, "t", type, "id", id, "nick", nick, "tcp", TCP_PORT);
    }

    private boolean validPeer(JSONObject packet) {
        String peer = packet.optString("id");
        return validId(peer) && !id.equals(peer) && packet.optInt("v") == 1 &&
                packet.optInt("tcp", TCP_PORT) == TCP_PORT;
    }

    private static String nickname(JSONObject packet) {
        String value = packet.optString("nick");
        return value.length() <= 48 ? value : value.substring(0, 48);
    }

    private synchronized void observe(JSONObject packet, InetAddress address) {
        if (!open || !local(address) || !validPeer(packet)) return;
        String peerId = packet.optString("id");
        Peer old = peers.get(peerId);
        if (old == null && peers.size() >= MAX_PEERS) return;
        Peer peer = new Peer(address, nickname(packet));
        peers.put(peerId, peer);
        if (old == null || !old.nick.equals(peer.nick)) emit("t", "peer", "id", peerId, "nick", peer.nick);
    }

    private synchronized void expire() {
        Iterator<Map.Entry<String, Peer>> it = peers.entrySet().iterator();
        long now = System.nanoTime();
        while (it.hasNext()) {
            Map.Entry<String, Peer> entry = it.next();
            if (TimeUnit.NANOSECONDS.toMillis(now - entry.getValue().seen) <= PEER_LIFETIME_MS) continue;
            String peer = entry.getKey();
            it.remove();
            emit("t", "offline", "id", peer);
        }
    }

    private void announce() {
        byte[] bytes = introduction("ann").toString().getBytes(StandardCharsets.UTF_8);
        while (open) {
            try {
                discovery.send(new DatagramPacket(bytes, bytes.length,
                        InetAddress.getByName("255.255.255.255"), UDP_PORT));
            } catch (IOException ignored) {
                // 设备可能正在切换网络。下一个周期会重试。
            }
            expire();
            try { Thread.sleep(DISCOVERY_MS); }
            catch (InterruptedException stopped) { return; }
        }
    }

    private void discover() {
        byte[] buffer = new byte[2048];
        while (open) {
            DatagramPacket packet = new DatagramPacket(buffer, buffer.length);
            try { discovery.receive(packet); }
            catch (IOException closed) { return; }
            if (!local(packet.getAddress()) || packet.getLength() == buffer.length) continue;
            try {
                JSONObject value = new JSONObject(new String(buffer, 0, packet.getLength(), StandardCharsets.UTF_8));
                if ("ann".equals(value.optString("t"))) observe(value, packet.getAddress());
            } catch (JSONException ignored) {}
        }
    }

    private synchronized boolean track(Socket socket) {
        if (!open) return false;
        sockets.add(socket);
        return true;
    }

    private synchronized void untrack(Socket socket) {
        sockets.remove(socket);
    }

    private void accept() {
        while (open) {
            Socket socket;
            try { socket = server.accept(); }
            catch (IOException closed) { return; }
            if (!local(socket.getInetAddress()) || !track(socket)) {
                closeQuietly(socket);
                continue;
            }
            try { receivers.execute(() -> receive(socket)); }
            catch (RejectedExecutionException busy) {
                untrack(socket);
                closeQuietly(socket);
            }
        }
    }

    private static JSONObject readFrame(InputStream input) throws IOException, JSONException {
        ByteArrayOutputStream line = new ByteArrayOutputStream(512);
        long start = 0;
        int value;
        while ((value = input.read()) != -1) {
            if (value == '\n') return new JSONObject(line.toString("UTF-8"));
            if (line.size() >= MAX_FRAME) throw new IOException("LAN frame too long");
            if (start == 0) start = System.nanoTime();
            else if (TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start) > HANDSHAKE_MS) {
                throw new IOException("LAN frame timed out");
            }
            line.write(value);
        }
        return null;
    }

    private static void writeFrame(Socket socket, JSONObject frame) throws IOException {
        socket.getOutputStream().write((frame.toString() + "\n").getBytes(StandardCharsets.UTF_8));
    }

    private void receive(Socket socket) {
        try (Socket ignored = socket) {
            socket.setSoTimeout(HANDSHAKE_MS);
            InputStream input = new BufferedInputStream(socket.getInputStream());
            JSONObject hello = readFrame(input);
            if (hello == null || !"hello".equals(hello.optString("t")) || !validPeer(hello)) return;
            String sender = hello.optString("id");
            observe(hello, socket.getInetAddress());
            writeFrame(socket, introduction("hello"));
            socket.setSoTimeout(12000);
            JSONObject packet;
            while (open && (packet = readFrame(input)) != null) {
                acceptMessage(socket, hello, sender, packet);
            }
        } catch (IOException | JSONException ignored) {
        } finally {
            untrack(socket);
        }
    }

    private void acceptMessage(Socket socket, JSONObject hello, String sender, JSONObject packet) throws IOException {
        if ("img".equals(packet.optString("t"))) {
            acceptChunk(socket, hello, sender, packet);
            return;
        }
        if (!"msg".equals(packet.optString("t")) || packet.optInt("v") != 1 ||
                !(packet.opt("text") instanceof String) || !(packet.opt("mid") instanceof String)) return;
        String mid = packet.optString("mid");
        String text = packet.optString("text");
        if (!sender.equals(packet.optString("from")) || !id.equals(packet.optString("to")) ||
                !validMid(mid) || text.trim().isEmpty() || text.length() > MAX_TEXT) return;
        emit("t", "msg", "id", sender, "nick", nickname(hello), "mid", mid, "text", text);
        writeFrame(socket, object("v", 1, "t", "ack", "mid", mid));
    }

    /* 一块图。收齐才落盘；落盘成功才回报 JS，避免半张图进会话。 */
    private void acceptChunk(Socket socket, JSONObject hello, String sender, JSONObject packet) throws IOException {
        String mid = packet.optString("mid");
        if (!sender.equals(packet.optString("from")) || !id.equals(packet.optString("to")) || !validMid(mid)) return;
        int seq = packet.optInt("seq", -1);
        int total = packet.optInt("total", 0);
        if (seq < 0 || total < 1 || total > MAX_CHUNKS || seq >= total) return;
        Object data = packet.opt("data");
        if (!(data instanceof String)) return;
        String chunk = (String) data;
        if (chunk.isEmpty() || chunk.length() > CHUNK_CHARS + 8) return;
        byte[] bytes;
        try { bytes = Base64.decode(chunk, Base64.DEFAULT); }
        catch (IllegalArgumentException bad) { return; }
        if (bytes.length < 1 || bytes.length > CHUNK_BYTES) return;
        Incoming image;
        synchronized (images) {
            prune();
            image = images.get(mid);
            if (image == null) {
                /* 同一台设备同时只装配一张：否则一条连接就能占满整张表 */
                for (Incoming other : images.values()) if (sender.equals(other.from)) return;
                /* 表满不丢新块：淘汰最旧的那张，否则垃圾 mid 一占位，正常图片 30 秒都进不来 */
                while (images.size() >= MAX_IMAGES) { if (!evictOldest()) return; }
                image = new Incoming(sender, packet.optString("name"), packet.optInt("w"), packet.optInt("h"), total);
                images.put(mid, image);
            }
            if (image.total != total) return;
            if (image.parts[seq] == null) {
                if (imageBytes() + bytes.length > MAX_IMAGE_BYTES) return;
                image.parts[seq] = bytes;
                image.got++;
            }
        }
        writeFrame(socket, object("v", 1, "t", "ack", "mid", mid, "seq", seq));
        if (!image.complete()) return;
        byte[] whole = image.assemble();
        synchronized (images) { images.remove(mid); }
        String stored = store(whole, mid);
        if (stored == null) return;
        emit("t", "img", "id", sender, "nick", nickname(hello), "mid", mid, "name", stored,
                "w", image.width, "h", image.height, "size", whole.length);
    }

    private long imageBytes() {
        long total = 0;
        for (Incoming image : images.values()) {
            for (byte[] part : image.parts) if (part != null) total += part.length;
        }
        return total;
    }

    /* 表满时淘汰最早开始的那张；全是刚进来的就返回 false，由调用方拒收新块 */
    private boolean evictOldest() {
        long now = System.currentTimeMillis();
        String oldest = null;
        long stamp = Long.MAX_VALUE;
        for (Map.Entry<String, Incoming> entry : images.entrySet()) {
            long started = entry.getValue().started;
            if (now - started < EVICT_MIN_AGE_MS) continue;
            if (started < stamp) {
                stamp = started;
                oldest = entry.getKey();
            }
        }
        if (oldest == null) return false;
        images.remove(oldest);
        return true;
    }

    /* 超时未收齐的半张图直接丢掉，别留着占内存 */
    private void prune() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, Incoming>> it = images.entrySet().iterator();
        while (it.hasNext()) {
            if (now - it.next().getValue().started > IMAGE_TTL_MS) it.remove();
        }
    }

    /* 写进 getExternalFilesDir/media，和 MainActivity 的 /media/ 服务是同一个目录 */
    private String store(byte[] bytes, String mid) {
        if (bytes.length < 1 || bytes.length > MAX_IMAGE) return null;
        try {
            if (media == null) return null;
            if (!media.isDirectory() && !media.mkdirs()) return null;
            String name = "xj-" + mid + ".jpg";
            File file = new File(media, name);
            try (FileOutputStream out = new FileOutputStream(file)) {
                out.write(bytes);
            }
            return name;
        } catch (IOException error) {
            return null;
        }
    }

    synchronized boolean sendImage(String peerId, String mid, String name, int width, int height, String base64) {
        Peer peer = peers.get(peerId);
        if (!open || peer == null || !validMid(mid) || base64 == null || base64.isEmpty()) return false;
        if (base64.length() > (long) MAX_CHUNKS * CHUNK_CHARS) return false;
        int total = (base64.length() + CHUNK_CHARS - 1) / CHUNK_CHARS;
        if (total < 1 || total > MAX_CHUNKS) return false;
        try {
            senders.execute(() -> deliverImage(peer, peerId, mid, name, width, height, base64, total));
            return true;
        } catch (RejectedExecutionException busy) {
            return false;
        }
    }

    private void deliverImage(Peer peer, String peerId, String mid, String name, int width, int height,
                              String base64, int total) {
        Socket socket = new Socket();
        boolean delivered = false;
        try (Socket ignored = socket) {
            if (!track(socket)) return;
            socket.connect(new InetSocketAddress(peer.address, TCP_PORT), HANDSHAKE_MS);
            socket.setSoTimeout(HANDSHAKE_MS);
            writeFrame(socket, introduction("hello"));
            InputStream input = new BufferedInputStream(socket.getInputStream());
            JSONObject hello = readFrame(input);
            if (hello == null || !"hello".equals(hello.optString("t")) || !validPeer(hello) ||
                    !peerId.equals(hello.optString("id"))) return;
            socket.setSoTimeout(15000);
            for (int seq = 0; seq < total; seq++) {
                int from = seq * CHUNK_CHARS;
                int to = Math.min(base64.length(), from + CHUNK_CHARS);
                writeFrame(socket, object("v", 1, "t", "img", "mid", mid, "from", id, "to", peerId,
                        "seq", seq, "total", total, "name", name == null ? "" : name,
                        "w", width, "h", height, "data", base64.substring(from, to)));
            }
            int acked = 0;
            for (int i = 0; open && i < total * 2 && acked < total; i++) {
                JSONObject packet = readFrame(input);
                if (packet == null) break;
                if (packet.optInt("v") == 1 && "ack".equals(packet.optString("t")) &&
                        mid.equals(packet.optString("mid"))) {
                    acked++;
                } else {
                    acceptMessage(socket, hello, peerId, packet);
                }
            }
            delivered = acked >= total;
        } catch (IOException | JSONException ignored) {
        } finally {
            untrack(socket);
            emit("t", "delivery", "id", peerId, "mid", mid, "ok", delivered);
        }
    }

    synchronized boolean send(String peerId, String mid, String text) {
        Peer peer = peers.get(peerId);
        if (!open || peer == null || !validMid(mid) || text == null ||
                text.trim().isEmpty() || text.length() > MAX_TEXT) return false;
        try {
            senders.execute(() -> deliver(peer, peerId, mid, text));
            return true;
        } catch (RejectedExecutionException busy) {
            return false;
        }
    }

    private void deliver(Peer peer, String peerId, String mid, String text) {
        Socket socket = new Socket();
        boolean delivered = false;
        try (Socket ignored = socket) {
            if (!track(socket)) return;
            socket.connect(new InetSocketAddress(peer.address, TCP_PORT), HANDSHAKE_MS);
            socket.setSoTimeout(HANDSHAKE_MS);
            writeFrame(socket, introduction("hello"));
            InputStream input = new BufferedInputStream(socket.getInputStream());
            JSONObject hello = readFrame(input);
            if (hello == null || !"hello".equals(hello.optString("t")) || !validPeer(hello) ||
                    !peerId.equals(hello.optString("id"))) return;
            writeFrame(socket, object("v", 1, "t", "msg", "mid", mid, "from", id, "nick", nick,
                    "to", peerId, "text", text, "ts", System.currentTimeMillis()));
            for (int i = 0; open && i < 8; i++) {
                JSONObject packet = readFrame(input);
                if (packet == null) return;
                if (packet.optInt("v") == 1 && "ack".equals(packet.optString("t")) &&
                        mid.equals(packet.optString("mid"))) {
                    delivered = true;
                    return;
                }
                acceptMessage(socket, hello, peerId, packet);
            }
        } catch (IOException | JSONException ignored) {
        } finally {
            untrack(socket);
            emit("t", "delivery", "id", peerId, "mid", mid, "ok", delivered);
        }
    }

    @Override public synchronized void close() {
        if (!open) return;
        open = false;
        discovery.close();
        closeQuietly(server);
        if (announcements != null) announcements.interrupt();
        for (Socket socket : new ArrayList<>(sockets)) closeQuietly(socket);
        sockets.clear();
        peers.clear();
        synchronized (images) { images.clear(); }
        receivers.shutdownNow();
        senders.shutdownNow();
    }

    private static void closeQuietly(Closeable resource) {
        try { resource.close(); } catch (IOException ignored) {}
    }
}