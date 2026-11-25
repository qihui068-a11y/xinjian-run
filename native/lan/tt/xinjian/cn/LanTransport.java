package tt.xinjian.cn;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
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
    private final Set<Socket> sockets = new HashSet<>();
    private final ThreadPoolExecutor receivers = pool("xj-lan-recv", 4, 12);
    private final ThreadPoolExecutor senders = pool("xj-lan-send", 2, 12);
    private volatile boolean open = true;
    private Thread announcements;

    private static final class Peer {
        final InetAddress address;
        final String nick;
        final long seen = System.nanoTime();

        Peer(InetAddress address, String nick) {
            this.address = address;
            this.nick = nick;
        }
    }

    LanTransport(String id, String nick, Events events) throws IOException {
        this.id = id;
        this.nick = nick;
        this.events = events;
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
        if (!"msg".equals(packet.optString("t")) || packet.optInt("v") != 1 ||
                !(packet.opt("text") instanceof String) || !(packet.opt("mid") instanceof String)) return;
        String mid = packet.optString("mid");
        String text = packet.optString("text");
        if (!sender.equals(packet.optString("from")) || !id.equals(packet.optString("to")) ||
                !validMid(mid) || text.trim().isEmpty() || text.length() > MAX_TEXT) return;
        emit("t", "msg", "id", sender, "nick", nickname(hello), "mid", mid, "text", text);
        writeFrame(socket, object("v", 1, "t", "ack", "mid", mid));
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
        receivers.shutdownNow();
        senders.shutdownNow();
    }

    private static void closeQuietly(Closeable resource) {
        try { resource.close(); } catch (IOException ignored) {}
    }
}
