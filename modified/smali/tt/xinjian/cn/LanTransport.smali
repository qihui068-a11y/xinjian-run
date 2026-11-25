.class final Ltt/xinjian/cn/LanTransport;
.super Ljava/lang/Object;
.source "LanTransport.java"

# interfaces
.implements Ljava/io/Closeable;


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Ltt/xinjian/cn/LanTransport$Events;,
        Ltt/xinjian/cn/LanTransport$Peer;
    }
.end annotation


# static fields
.field private static final DISCOVERY_MS:I = 0xbb8

.field private static final HANDSHAKE_MS:I = 0xdac

.field private static final MAX_FRAME:I = 0x4000

.field private static final MAX_PEERS:I = 0x80

.field static final MAX_TEXT:I = 0x7d0

.field private static final MESSAGE_ID:Ljava/util/regex/Pattern;

.field private static final PEER_ID:Ljava/util/regex/Pattern;

.field private static final PEER_LIFETIME_MS:I = 0x2af8

.field static final TCP_PORT:I = 0xb2de

.field static final UDP_PORT:I = 0xb2dd


# instance fields
.field private announcements:Ljava/lang/Thread;

.field private final discovery:Ljava/net/DatagramSocket;

.field private final events:Ltt/xinjian/cn/LanTransport$Events;

.field private final id:Ljava/lang/String;

.field private final nick:Ljava/lang/String;

.field private volatile open:Z

.field private final peers:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ltt/xinjian/cn/LanTransport$Peer;",
            ">;"
        }
    .end annotation
.end field

.field private final receivers:Ljava/util/concurrent/ThreadPoolExecutor;

.field private final senders:Ljava/util/concurrent/ThreadPoolExecutor;

.field private final server:Ljava/net/ServerSocket;

.field private final sockets:Ljava/util/Set;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Set<",
            "Ljava/net/Socket;",
            ">;"
        }
    .end annotation
.end field


# direct methods
.method public static synthetic $r8$lambda$Fbb168GgYZAKtLwf5SgwoB1WAtc(Ltt/xinjian/cn/LanTransport;)V
    .locals 0

    invoke-direct {p0}, Ltt/xinjian/cn/LanTransport;->accept()V

    return-void
.end method

.method public static synthetic $r8$lambda$jwF3EmRnkk_mT6JCbhuMaFUQzqg(Ltt/xinjian/cn/LanTransport;)V
    .locals 0

    invoke-direct {p0}, Ltt/xinjian/cn/LanTransport;->announce()V

    return-void
.end method

.method public static synthetic $r8$lambda$oztljU3XsbQoUWqNLc3PvgZ91Lg(Ltt/xinjian/cn/LanTransport;)V
    .locals 0

    invoke-direct {p0}, Ltt/xinjian/cn/LanTransport;->discover()V

    return-void
.end method

.method static constructor <clinit>()V
    .locals 1

    .line 40
    const-string v0, "xj-[0-9a-f]{12}"

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Ltt/xinjian/cn/LanTransport;->PEER_ID:Ljava/util/regex/Pattern;

    .line 41
    const-string v0, "[A-Za-z0-9_-]{1,80}"

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Ltt/xinjian/cn/LanTransport;->MESSAGE_ID:Ljava/util/regex/Pattern;

    return-void
.end method

.method constructor <init>(Ljava/lang/String;Ljava/lang/String;Ltt/xinjian/cn/LanTransport$Events;)V
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 70
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 52
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    .line 53
    new-instance v0, Ljava/util/HashSet;

    invoke-direct {v0}, Ljava/util/HashSet;-><init>()V

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    .line 54
    const-string v0, "xj-lan-recv"

    const/4 v1, 0x4

    const/16 v2, 0xc

    invoke-static {v0, v1, v2}, Ltt/xinjian/cn/LanTransport;->pool(Ljava/lang/String;II)Ljava/util/concurrent/ThreadPoolExecutor;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->receivers:Ljava/util/concurrent/ThreadPoolExecutor;

    .line 55
    const-string v0, "xj-lan-send"

    const/4 v1, 0x2

    invoke-static {v0, v1, v2}, Ltt/xinjian/cn/LanTransport;->pool(Ljava/lang/String;II)Ljava/util/concurrent/ThreadPoolExecutor;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->senders:Ljava/util/concurrent/ThreadPoolExecutor;

    .line 56
    const/4 v0, 0x1

    iput-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    .line 71
    iput-object p1, p0, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    .line 72
    iput-object p2, p0, Ltt/xinjian/cn/LanTransport;->nick:Ljava/lang/String;

    .line 73
    iput-object p3, p0, Ltt/xinjian/cn/LanTransport;->events:Ltt/xinjian/cn/LanTransport$Events;

    .line 74
    new-instance p1, Ljava/net/DatagramSocket;

    const/4 p2, 0x0

    invoke-direct {p1, p2}, Ljava/net/DatagramSocket;-><init>(Ljava/net/SocketAddress;)V

    .line 75
    new-instance p2, Ljava/net/ServerSocket;

    invoke-direct {p2}, Ljava/net/ServerSocket;-><init>()V

    .line 77
    :try_start_0
    invoke-virtual {p1, v0}, Ljava/net/DatagramSocket;->setReuseAddress(Z)V

    .line 78
    invoke-virtual {p1, v0}, Ljava/net/DatagramSocket;->setBroadcast(Z)V

    .line 79
    new-instance p3, Ljava/net/InetSocketAddress;

    const v1, 0xb2dd

    invoke-direct {p3, v1}, Ljava/net/InetSocketAddress;-><init>(I)V

    invoke-virtual {p1, p3}, Ljava/net/DatagramSocket;->bind(Ljava/net/SocketAddress;)V

    .line 80
    invoke-virtual {p2, v0}, Ljava/net/ServerSocket;->setReuseAddress(Z)V

    .line 81
    new-instance p3, Ljava/net/InetSocketAddress;

    const v0, 0xb2de

    invoke-direct {p3, v0}, Ljava/net/InetSocketAddress;-><init>(I)V

    const/16 v0, 0x10

    invoke-virtual {p2, p3, v0}, Ljava/net/ServerSocket;->bind(Ljava/net/SocketAddress;I)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    .line 86
    nop

    .line 87
    iput-object p1, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    .line 88
    iput-object p2, p0, Ltt/xinjian/cn/LanTransport;->server:Ljava/net/ServerSocket;

    .line 89
    return-void

    .line 82
    :catch_0
    move-exception p3

    goto :goto_0

    :catch_1
    move-exception p3

    .line 83
    :goto_0
    invoke-virtual {p1}, Ljava/net/DatagramSocket;->close()V

    .line 84
    invoke-static {p2}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 85
    throw p3
.end method

.method private accept()V
    .locals 3

    .line 212
    nop

    :goto_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_2

    .line 214
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->server:Ljava/net/ServerSocket;

    invoke-virtual {v0}, Ljava/net/ServerSocket;->accept()Ljava/net/Socket;

    move-result-object v0
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1

    .line 215
    nop

    .line 216
    invoke-virtual {v0}, Ljava/net/Socket;->getInetAddress()Ljava/net/InetAddress;

    move-result-object v1

    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->local(Ljava/net/InetAddress;)Z

    move-result v1

    if-eqz v1, :cond_1

    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->track(Ljava/net/Socket;)Z

    move-result v1

    if-nez v1, :cond_0

    goto :goto_2

    .line 220
    :cond_0
    :try_start_1
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->receivers:Ljava/util/concurrent/ThreadPoolExecutor;

    new-instance v2, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;

    invoke-direct {v2, p0, v0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;-><init>(Ltt/xinjian/cn/LanTransport;Ljava/net/Socket;)V

    invoke-virtual {v1, v2}, Ljava/util/concurrent/ThreadPoolExecutor;->execute(Ljava/lang/Runnable;)V
    :try_end_1
    .catch Ljava/util/concurrent/RejectedExecutionException; {:try_start_1 .. :try_end_1} :catch_0

    .line 224
    goto :goto_1

    .line 221
    :catch_0
    move-exception v1

    .line 222
    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 223
    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 225
    :goto_1
    goto :goto_0

    .line 217
    :cond_1
    :goto_2
    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 218
    goto :goto_0

    .line 215
    :catch_1
    move-exception v0

    return-void

    .line 226
    :cond_2
    return-void
.end method

.method private acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    .locals 16
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 269
    move-object/from16 v0, p0

    move-object/from16 v1, p3

    move-object/from16 v2, p4

    const-string v3, "t"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    const-string v5, "msg"

    invoke-virtual {v5, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_3

    const-string v4, "v"

    invoke-virtual {v2, v4}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v6

    const/4 v7, 0x1

    if-ne v6, v7, :cond_3

    .line 270
    const-string v6, "text"

    invoke-virtual {v2, v6}, Lorg/json/JSONObject;->opt(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v8

    instance-of v8, v8, Ljava/lang/String;

    if-eqz v8, :cond_3

    const-string v8, "mid"

    invoke-virtual {v2, v8}, Lorg/json/JSONObject;->opt(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v9

    instance-of v9, v9, Ljava/lang/String;

    if-nez v9, :cond_0

    goto/16 :goto_1

    .line 271
    :cond_0
    invoke-virtual {v2, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v9

    .line 272
    invoke-virtual {v2, v6}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v10

    .line 273
    const-string v11, "from"

    invoke-virtual {v2, v11}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v11

    invoke-virtual {v1, v11}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v11

    if-eqz v11, :cond_2

    iget-object v11, v0, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    const-string v12, "to"

    invoke-virtual {v2, v12}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v11, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_2

    .line 274
    invoke-static {v9}, Ltt/xinjian/cn/LanTransport;->validMid(Ljava/lang/String;)Z

    move-result v2

    if-eqz v2, :cond_2

    invoke-virtual {v10}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    if-nez v2, :cond_2

    invoke-virtual {v10}, Ljava/lang/String;->length()I

    move-result v2

    const/16 v11, 0x7d0

    if-le v2, v11, :cond_1

    goto :goto_0

    .line 275
    :cond_1
    invoke-static/range {p2 .. p2}, Ltt/xinjian/cn/LanTransport;->nickname(Lorg/json/JSONObject;)Ljava/lang/String;

    move-result-object v2

    const/16 v11, 0xa

    new-array v11, v11, [Ljava/lang/Object;

    const/4 v12, 0x0

    aput-object v3, v11, v12

    aput-object v5, v11, v7

    const-string v5, "id"

    const/4 v13, 0x2

    aput-object v5, v11, v13

    const/4 v5, 0x3

    aput-object v1, v11, v5

    const-string v1, "nick"

    const/4 v14, 0x4

    aput-object v1, v11, v14

    const/4 v1, 0x5

    aput-object v2, v11, v1

    const/4 v2, 0x6

    aput-object v8, v11, v2

    const/4 v15, 0x7

    aput-object v9, v11, v15

    const/16 v15, 0x8

    aput-object v6, v11, v15

    const/16 v6, 0x9

    aput-object v10, v11, v6

    invoke-direct {v0, v11}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 276
    invoke-static {v7}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v6

    new-array v2, v2, [Ljava/lang/Object;

    aput-object v4, v2, v12

    aput-object v6, v2, v7

    aput-object v3, v2, v13

    const-string v3, "ack"

    aput-object v3, v2, v5

    aput-object v8, v2, v14

    aput-object v9, v2, v1

    invoke-static {v2}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object v1

    move-object/from16 v2, p1

    invoke-static {v2, v1}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 277
    return-void

    .line 274
    :cond_2
    :goto_0
    return-void

    .line 270
    :cond_3
    :goto_1
    return-void
.end method

.method private announce()V
    .locals 6

    .line 173
    const-string v0, "ann"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v0

    invoke-virtual {v0}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object v0

    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v0, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v0

    .line 174
    :goto_0
    iget-boolean v1, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v1, :cond_0

    .line 176
    :try_start_0
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    new-instance v2, Ljava/net/DatagramPacket;

    array-length v3, v0

    const-string v4, "255.255.255.255"

    .line 177
    invoke-static {v4}, Ljava/net/InetAddress;->getByName(Ljava/lang/String;)Ljava/net/InetAddress;

    move-result-object v4

    const v5, 0xb2dd

    invoke-direct {v2, v0, v3, v4, v5}, Ljava/net/DatagramPacket;-><init>([BILjava/net/InetAddress;I)V

    .line 176
    invoke-virtual {v1, v2}, Ljava/net/DatagramSocket;->send(Ljava/net/DatagramPacket;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    .line 180
    goto :goto_1

    .line 178
    :catch_0
    move-exception v1

    .line 181
    :goto_1
    invoke-direct {p0}, Ltt/xinjian/cn/LanTransport;->expire()V

    .line 182
    const-wide/16 v1, 0xbb8

    :try_start_1
    invoke-static {v1, v2}, Ljava/lang/Thread;->sleep(J)V
    :try_end_1
    .catch Ljava/lang/InterruptedException; {:try_start_1 .. :try_end_1} :catch_1

    .line 183
    goto :goto_0

    :catch_1
    move-exception v0

    return-void

    .line 185
    :cond_0
    return-void
.end method

.method private static closeQuietly(Ljava/io/Closeable;)V
    .locals 0

    .line 336
    :try_start_0
    invoke-interface {p0}, Ljava/io/Closeable;->close()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception p0

    .line 337
    :goto_0
    return-void
.end method

.method private deliver(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 23

    .line 292
    move-object/from16 v1, p0

    move-object/from16 v2, p2

    move-object/from16 v3, p3

    const-string v0, "v"

    const-string v4, "hello"

    const-string v5, "ok"

    const-string v6, "delivery"

    const-string v7, "id"

    const-string v8, "mid"

    const-string v9, "t"

    new-instance v10, Ljava/net/Socket;

    invoke-direct {v10}, Ljava/net/Socket;-><init>()V

    .line 293
    nop

    .line 294
    nop

    .line 295
    const/4 v13, 0x5

    const/4 v14, 0x4

    const/4 v15, 0x3

    const/16 v16, 0x2

    const/16 v11, 0x8

    const/4 v12, 0x1

    const/16 v18, 0x0

    :try_start_0
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->track(Ljava/net/Socket;)Z

    move-result v19
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    if-nez v19, :cond_0

    .line 315
    :try_start_1
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Lorg/json/JSONException; {:try_start_1 .. :try_end_1} :catch_2
    .catchall {:try_start_1 .. :try_end_1} :catchall_3

    .line 317
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    invoke-static/range {v18 .. v18}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    new-array v4, v11, [Ljava/lang/Object;

    aput-object v9, v4, v18

    aput-object v6, v4, v12

    aput-object v7, v4, v16

    aput-object v2, v4, v15

    aput-object v8, v4, v14

    aput-object v3, v4, v13

    const/4 v2, 0x6

    aput-object v5, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 295
    return-void

    .line 296
    :cond_0
    :try_start_2
    new-instance v11, Ljava/net/InetSocketAddress;

    move-object/from16 v13, p1

    iget-object v13, v13, Ltt/xinjian/cn/LanTransport$Peer;->address:Ljava/net/InetAddress;

    const v14, 0xb2de

    invoke-direct {v11, v13, v14}, Ljava/net/InetSocketAddress;-><init>(Ljava/net/InetAddress;I)V

    const/16 v13, 0xdac

    invoke-virtual {v10, v11, v13}, Ljava/net/Socket;->connect(Ljava/net/SocketAddress;I)V

    .line 297
    invoke-virtual {v10, v13}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 298
    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v11

    invoke-static {v10, v11}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 299
    new-instance v11, Ljava/io/BufferedInputStream;

    invoke-virtual {v10}, Ljava/net/Socket;->getInputStream()Ljava/io/InputStream;

    move-result-object v13

    invoke-direct {v11, v13}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V

    .line 300
    invoke-static {v11}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v13

    .line 301
    if-eqz v13, :cond_5

    invoke-virtual {v13, v9}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v14

    invoke-virtual {v4, v14}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_5

    invoke-direct {v1, v13}, Ltt/xinjian/cn/LanTransport;->validPeer(Lorg/json/JSONObject;)Z

    move-result v4

    if-eqz v4, :cond_5

    .line 302
    invoke-virtual {v13, v7}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-nez v4, :cond_1

    goto/16 :goto_2

    .line 303
    :cond_1
    invoke-static {v12}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    iget-object v14, v1, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    iget-object v15, v1, Ltt/xinjian/cn/LanTransport;->nick:Ljava/lang/String;

    .line 304
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v21

    invoke-static/range {v21 .. v22}, Ljava/lang/Long;->valueOf(J)Ljava/lang/Long;

    move-result-object v21

    const/16 v12, 0x10

    new-array v12, v12, [Ljava/lang/Object;

    aput-object v0, v12, v18

    const/16 v22, 0x1

    aput-object v4, v12, v22

    aput-object v9, v12, v16

    const-string v4, "msg"

    const/16 v20, 0x3

    aput-object v4, v12, v20

    const/4 v4, 0x4

    aput-object v8, v12, v4

    const/4 v4, 0x5

    aput-object v3, v12, v4

    const-string v4, "from"

    const/16 v17, 0x6

    aput-object v4, v12, v17

    const/4 v4, 0x7

    aput-object v14, v12, v4

    const-string v4, "nick"

    const/16 v14, 0x8

    aput-object v4, v12, v14

    const/16 v4, 0x9

    aput-object v15, v12, v4

    const-string v4, "to"

    const/16 v14, 0xa

    aput-object v4, v12, v14

    const/16 v4, 0xb

    aput-object v2, v12, v4

    const-string v4, "text"

    const/16 v14, 0xc

    aput-object v4, v12, v14

    const/16 v4, 0xd

    aput-object p4, v12, v4

    const-string v4, "ts"

    const/16 v14, 0xe

    aput-object v4, v12, v14

    const/16 v4, 0xf

    aput-object v21, v12, v4

    .line 303
    invoke-static {v12}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object v4

    invoke-static {v10, v4}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 305
    const/4 v4, 0x0

    :goto_0
    iget-boolean v12, v1, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v12, :cond_4

    const/16 v12, 0x8

    if-ge v4, v12, :cond_4

    .line 306
    invoke-static {v11}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v12
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    .line 307
    if-nez v12, :cond_2

    .line 315
    :try_start_3
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_3
    .catch Lorg/json/JSONException; {:try_start_3 .. :try_end_3} :catch_2
    .catchall {:try_start_3 .. :try_end_3} :catchall_3

    .line 317
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    invoke-static/range {v18 .. v18}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v9, 0x1

    aput-object v6, v4, v9

    aput-object v7, v4, v16

    const/4 v6, 0x3

    aput-object v2, v4, v6

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v5, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 307
    return-void

    .line 308
    :cond_2
    :try_start_4
    invoke-virtual {v12, v0}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v14

    const/4 v15, 0x1

    if-ne v14, v15, :cond_3

    const-string v14, "ack"

    invoke-virtual {v12, v9}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v15

    invoke-virtual {v14, v15}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v14

    if-eqz v14, :cond_3

    .line 309
    invoke-virtual {v12, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v14

    invoke-virtual {v3, v14}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v14
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_1

    if-eqz v14, :cond_3

    .line 310
    nop

    .line 315
    :try_start_5
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_5 .. :try_end_5} :catch_1
    .catch Lorg/json/JSONException; {:try_start_5 .. :try_end_5} :catch_0
    .catchall {:try_start_5 .. :try_end_5} :catchall_0

    .line 317
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    const/4 v4, 0x1

    invoke-static {v4}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v10, 0x8

    new-array v10, v10, [Ljava/lang/Object;

    aput-object v9, v10, v18

    aput-object v6, v10, v4

    aput-object v7, v10, v16

    const/4 v4, 0x3

    aput-object v2, v10, v4

    const/4 v2, 0x4

    aput-object v8, v10, v2

    const/4 v2, 0x5

    aput-object v3, v10, v2

    const/4 v2, 0x6

    aput-object v5, v10, v2

    const/4 v2, 0x7

    aput-object v0, v10, v2

    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 311
    return-void

    .line 317
    :catchall_0
    move-exception v0

    move-object v4, v0

    const/4 v0, 0x1

    goto/16 :goto_5

    .line 315
    :catch_0
    move-exception v0

    goto :goto_1

    :catch_1
    move-exception v0

    :goto_1
    const/4 v0, 0x1

    goto/16 :goto_6

    .line 313
    :cond_3
    :try_start_6
    invoke-direct {v1, v10, v13, v2, v12}, Ltt/xinjian/cn/LanTransport;->acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_1

    .line 305
    add-int/lit8 v4, v4, 0x1

    goto/16 :goto_0

    .line 315
    :cond_4
    :try_start_7
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_7
    .catch Ljava/io/IOException; {:try_start_7 .. :try_end_7} :catch_3
    .catch Lorg/json/JSONException; {:try_start_7 .. :try_end_7} :catch_2
    .catchall {:try_start_7 .. :try_end_7} :catchall_3

    .line 317
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    invoke-static/range {v18 .. v18}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v9, 0x1

    aput-object v6, v4, v9

    aput-object v7, v4, v16

    const/4 v6, 0x3

    aput-object v2, v4, v6

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v5, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    goto/16 :goto_7

    .line 315
    :cond_5
    :goto_2
    :try_start_8
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_3
    .catch Lorg/json/JSONException; {:try_start_8 .. :try_end_8} :catch_2
    .catchall {:try_start_8 .. :try_end_8} :catchall_3

    .line 317
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    invoke-static/range {v18 .. v18}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v9, 0x1

    aput-object v6, v4, v9

    aput-object v7, v4, v16

    const/4 v6, 0x3

    aput-object v2, v4, v6

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v5, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 302
    return-void

    .line 294
    :catchall_1
    move-exception v0

    move-object v4, v0

    :try_start_9
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_9
    .catchall {:try_start_9 .. :try_end_9} :catchall_2

    goto :goto_3

    :catchall_2
    move-exception v0

    move-object v11, v0

    :try_start_a
    invoke-virtual {v4, v11}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :goto_3
    throw v4
    :try_end_a
    .catch Ljava/io/IOException; {:try_start_a .. :try_end_a} :catch_3
    .catch Lorg/json/JSONException; {:try_start_a .. :try_end_a} :catch_2
    .catchall {:try_start_a .. :try_end_a} :catchall_3

    .line 317
    :catchall_3
    move-exception v0

    move-object v4, v0

    const/4 v0, 0x0

    goto :goto_5

    .line 315
    :catch_2
    move-exception v0

    goto :goto_4

    :catch_3
    move-exception v0

    :goto_4
    const/4 v0, 0x0

    goto :goto_6

    .line 317
    :goto_5
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v10, 0x8

    new-array v10, v10, [Ljava/lang/Object;

    aput-object v9, v10, v18

    const/4 v9, 0x1

    aput-object v6, v10, v9

    aput-object v7, v10, v16

    const/4 v6, 0x3

    aput-object v2, v10, v6

    const/4 v2, 0x4

    aput-object v8, v10, v2

    const/4 v2, 0x5

    aput-object v3, v10, v2

    const/4 v2, 0x6

    aput-object v5, v10, v2

    const/4 v2, 0x7

    aput-object v0, v10, v2

    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 319
    throw v4

    .line 317
    :goto_6
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 318
    invoke-static {v0}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v9, 0x1

    aput-object v6, v4, v9

    aput-object v7, v4, v16

    const/4 v6, 0x3

    aput-object v2, v4, v6

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v5, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 319
    :goto_7
    nop

    .line 320
    return-void
.end method

.method private discover()V
    .locals 8

    .line 188
    const/16 v0, 0x800

    new-array v1, v0, [B

    .line 189
    :cond_0
    :goto_0
    iget-boolean v2, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v2, :cond_3

    .line 190
    new-instance v2, Ljava/net/DatagramPacket;

    invoke-direct {v2, v1, v0}, Ljava/net/DatagramPacket;-><init>([BI)V

    .line 191
    :try_start_0
    iget-object v3, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    invoke-virtual {v3, v2}, Ljava/net/DatagramSocket;->receive(Ljava/net/DatagramPacket;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1

    .line 192
    nop

    .line 193
    invoke-virtual {v2}, Ljava/net/DatagramPacket;->getAddress()Ljava/net/InetAddress;

    move-result-object v3

    invoke-static {v3}, Ltt/xinjian/cn/LanTransport;->local(Ljava/net/InetAddress;)Z

    move-result v3

    if-eqz v3, :cond_0

    invoke-virtual {v2}, Ljava/net/DatagramPacket;->getLength()I

    move-result v3

    if-ne v3, v0, :cond_1

    goto :goto_0

    .line 195
    :cond_1
    :try_start_1
    new-instance v3, Lorg/json/JSONObject;

    new-instance v4, Ljava/lang/String;

    invoke-virtual {v2}, Ljava/net/DatagramPacket;->getLength()I

    move-result v5

    sget-object v6, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    const/4 v7, 0x0

    invoke-direct {v4, v1, v7, v5, v6}, Ljava/lang/String;-><init>([BIILjava/nio/charset/Charset;)V

    invoke-direct {v3, v4}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V

    .line 196
    const-string v4, "ann"

    const-string v5, "t"

    invoke-virtual {v3, v5}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v5

    invoke-virtual {v4, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_2

    invoke-virtual {v2}, Ljava/net/DatagramPacket;->getAddress()Ljava/net/InetAddress;

    move-result-object v2

    invoke-direct {p0, v3, v2}, Ltt/xinjian/cn/LanTransport;->observe(Lorg/json/JSONObject;Ljava/net/InetAddress;)V
    :try_end_1
    .catch Lorg/json/JSONException; {:try_start_1 .. :try_end_1} :catch_0

    goto :goto_1

    .line 197
    :catch_0
    move-exception v2

    :cond_2
    :goto_1
    nop

    .line 198
    goto :goto_0

    .line 192
    :catch_1
    move-exception v0

    return-void

    .line 199
    :cond_3
    return-void
.end method

.method private varargs emit([Ljava/lang/Object;)V
    .locals 1

    .line 132
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->events:Ltt/xinjian/cn/LanTransport$Events;

    invoke-static {p1}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1

    invoke-interface {v0, p0, p1}, Ltt/xinjian/cn/LanTransport$Events;->event(Ltt/xinjian/cn/LanTransport;Lorg/json/JSONObject;)V

    .line 133
    :cond_0
    return-void
.end method

.method private declared-synchronized expire()V
    .locals 9

    monitor-enter p0

    .line 161
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v0}, Ljava/util/Map;->entrySet()Ljava/util/Set;

    move-result-object v0

    invoke-interface {v0}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object v0

    .line 162
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v1

    .line 163
    :goto_0
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v3

    if-eqz v3, :cond_1

    .line 164
    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/util/Map$Entry;

    .line 165
    sget-object v4, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    invoke-interface {v3}, Ljava/util/Map$Entry;->getValue()Ljava/lang/Object;

    move-result-object v5

    check-cast v5, Ltt/xinjian/cn/LanTransport$Peer;

    iget-wide v5, v5, Ltt/xinjian/cn/LanTransport$Peer;->seen:J

    sub-long v5, v1, v5

    invoke-virtual {v4, v5, v6}, Ljava/util/concurrent/TimeUnit;->toMillis(J)J

    move-result-wide v4

    const-wide/16 v6, 0x2af8

    cmp-long v8, v4, v6

    if-gtz v8, :cond_0

    goto :goto_0

    .line 166
    :cond_0
    invoke-interface {v3}, Ljava/util/Map$Entry;->getKey()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/lang/String;

    .line 167
    invoke-interface {v0}, Ljava/util/Iterator;->remove()V

    .line 168
    const/4 v4, 0x4

    new-array v4, v4, [Ljava/lang/Object;

    const-string v5, "t"

    const/4 v6, 0x0

    aput-object v5, v4, v6

    const-string v5, "offline"

    const/4 v6, 0x1

    aput-object v5, v4, v6

    const-string v5, "id"

    const/4 v6, 0x2

    aput-object v5, v4, v6

    const/4 v5, 0x3

    aput-object v3, v4, v5

    invoke-direct {p0, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 169
    goto :goto_0

    .line 170
    :cond_1
    monitor-exit p0

    return-void

    .line 160
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method private introduction(Ljava/lang/String;)Lorg/json/JSONObject;
    .locals 8

    .line 136
    const/4 v0, 0x1

    invoke-static {v0}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v1

    iget-object v2, p0, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    iget-object v3, p0, Ltt/xinjian/cn/LanTransport;->nick:Ljava/lang/String;

    const v4, 0xb2de

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    const/16 v5, 0xa

    new-array v5, v5, [Ljava/lang/Object;

    const-string v6, "v"

    const/4 v7, 0x0

    aput-object v6, v5, v7

    aput-object v1, v5, v0

    const-string v0, "t"

    const/4 v1, 0x2

    aput-object v0, v5, v1

    const/4 v0, 0x3

    aput-object p1, v5, v0

    const-string p1, "id"

    const/4 v0, 0x4

    aput-object p1, v5, v0

    const/4 p1, 0x5

    aput-object v2, v5, p1

    const-string p1, "nick"

    const/4 v0, 0x6

    aput-object p1, v5, v0

    const/4 p1, 0x7

    aput-object v3, v5, p1

    const-string p1, "tcp"

    const/16 v0, 0x8

    aput-object p1, v5, v0

    const/16 p1, 0x9

    aput-object v4, v5, p1

    invoke-static {v5}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1

    return-object p1
.end method

.method static synthetic lambda$pool$0(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;
    .locals 0

    .line 118
    invoke-static {p0, p1}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object p0

    return-object p0
.end method

.method private static local(Ljava/net/InetAddress;)Z
    .locals 1

    .line 107
    invoke-virtual {p0}, Ljava/net/InetAddress;->isSiteLocalAddress()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Ljava/net/InetAddress;->isLinkLocalAddress()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p0}, Ljava/net/InetAddress;->isLoopbackAddress()Z

    move-result p0

    if-eqz p0, :cond_0

    goto :goto_0

    :cond_0
    const/4 p0, 0x0

    goto :goto_1

    :cond_1
    :goto_0
    const/4 p0, 0x1

    :goto_1
    return p0
.end method

.method private static nickname(Lorg/json/JSONObject;)Ljava/lang/String;
    .locals 2

    .line 146
    const-string v0, "nick"

    invoke-virtual {p0, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0

    .line 147
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v0

    const/16 v1, 0x30

    if-gt v0, v1, :cond_0

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    invoke-virtual {p0, v0, v1}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object p0

    :goto_0
    return-object p0
.end method

.method private static varargs object([Ljava/lang/Object;)Lorg/json/JSONObject;
    .locals 4

    .line 122
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    .line 124
    const/4 v1, 0x0

    :goto_0
    :try_start_0
    array-length v2, p0

    if-ge v1, v2, :cond_0

    aget-object v2, p0, v1

    check-cast v2, Ljava/lang/String;

    add-int/lit8 v3, v1, 0x1

    aget-object v3, p0, v3

    invoke-virtual {v0, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;
    :try_end_0
    .catch Lorg/json/JSONException; {:try_start_0 .. :try_end_0} :catch_0

    add-int/lit8 v1, v1, 0x2

    goto :goto_0

    .line 127
    :cond_0
    nop

    .line 128
    return-object v0

    .line 125
    :catch_0
    move-exception p0

    .line 126
    new-instance v0, Ljava/lang/IllegalArgumentException;

    invoke-direct {v0, p0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/Throwable;)V

    throw v0
.end method

.method private declared-synchronized observe(Lorg/json/JSONObject;Ljava/net/InetAddress;)V
    .locals 4

    monitor-enter p0

    .line 151
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_4

    invoke-static {p2}, Ltt/xinjian/cn/LanTransport;->local(Ljava/net/InetAddress;)Z

    move-result v0

    if-eqz v0, :cond_4

    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->validPeer(Lorg/json/JSONObject;)Z

    move-result v0

    if-nez v0, :cond_0

    goto :goto_0

    .line 152
    :cond_0
    const-string v0, "id"

    invoke-virtual {p1, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 153
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v1, v0}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ltt/xinjian/cn/LanTransport$Peer;

    .line 154
    if-nez v1, :cond_1

    iget-object v2, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v2}, Ljava/util/Map;->size()I

    move-result v2
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    const/16 v3, 0x80

    if-lt v2, v3, :cond_1

    monitor-exit p0

    return-void

    .line 155
    :cond_1
    :try_start_1
    new-instance v2, Ltt/xinjian/cn/LanTransport$Peer;

    invoke-static {p1}, Ltt/xinjian/cn/LanTransport;->nickname(Lorg/json/JSONObject;)Ljava/lang/String;

    move-result-object p1

    invoke-direct {v2, p2, p1}, Ltt/xinjian/cn/LanTransport$Peer;-><init>(Ljava/net/InetAddress;Ljava/lang/String;)V

    .line 156
    iget-object p1, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {p1, v0, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 157
    if-eqz v1, :cond_2

    iget-object p1, v1, Ltt/xinjian/cn/LanTransport$Peer;->nick:Ljava/lang/String;

    iget-object p2, v2, Ltt/xinjian/cn/LanTransport$Peer;->nick:Ljava/lang/String;

    invoke-virtual {p1, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-nez p1, :cond_3

    :cond_2
    iget-object p1, v2, Ltt/xinjian/cn/LanTransport$Peer;->nick:Ljava/lang/String;

    const/4 p2, 0x6

    new-array p2, p2, [Ljava/lang/Object;

    const-string v1, "t"

    const/4 v2, 0x0

    aput-object v1, p2, v2

    const-string v1, "peer"

    const/4 v2, 0x1

    aput-object v1, p2, v2

    const-string v1, "id"

    const/4 v2, 0x2

    aput-object v1, p2, v2

    const/4 v1, 0x3

    aput-object v0, p2, v1

    const-string v0, "nick"

    const/4 v1, 0x4

    aput-object v0, p2, v1

    const/4 v0, 0x5

    aput-object p1, p2, v0

    invoke-direct {p0, p2}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 158
    :cond_3
    monitor-exit p0

    return-void

    .line 151
    :cond_4
    :goto_0
    monitor-exit p0

    return-void

    .line 150
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1
.end method

.method private static pool(Ljava/lang/String;II)Ljava/util/concurrent/ThreadPoolExecutor;
    .locals 9

    .line 117
    new-instance v8, Ljava/util/concurrent/ThreadPoolExecutor;

    sget-object v5, Ljava/util/concurrent/TimeUnit;->MILLISECONDS:Ljava/util/concurrent/TimeUnit;

    new-instance v6, Ljava/util/concurrent/ArrayBlockingQueue;

    invoke-direct {v6, p2}, Ljava/util/concurrent/ArrayBlockingQueue;-><init>(I)V

    new-instance v7, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda0;

    invoke-direct {v7, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda0;-><init>(Ljava/lang/String;)V

    const-wide/16 v3, 0x0

    move-object v0, v8

    move v1, p1

    move v2, p1

    invoke-direct/range {v0 .. v7}, Ljava/util/concurrent/ThreadPoolExecutor;-><init>(IIJLjava/util/concurrent/TimeUnit;Ljava/util/concurrent/BlockingQueue;Ljava/util/concurrent/ThreadFactory;)V

    return-object v8
.end method

.method private static readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;
    .locals 11
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;,
            Lorg/json/JSONException;
        }
    .end annotation

    .line 229
    new-instance v0, Ljava/io/ByteArrayOutputStream;

    const/16 v1, 0x200

    invoke-direct {v0, v1}, Ljava/io/ByteArrayOutputStream;-><init>(I)V

    .line 230
    const-wide/16 v1, 0x0

    move-wide v3, v1

    .line 232
    :goto_0
    invoke-virtual {p0}, Ljava/io/InputStream;->read()I

    move-result v5

    const/4 v6, -0x1

    if-eq v5, v6, :cond_4

    .line 233
    const/16 v6, 0xa

    if-ne v5, v6, :cond_0

    new-instance p0, Lorg/json/JSONObject;

    const-string v1, "UTF-8"

    invoke-virtual {v0, v1}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V

    return-object p0

    .line 234
    :cond_0
    invoke-virtual {v0}, Ljava/io/ByteArrayOutputStream;->size()I

    move-result v6

    const/16 v7, 0x4000

    if-ge v6, v7, :cond_3

    .line 235
    cmp-long v6, v3, v1

    if-nez v6, :cond_1

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v3

    goto :goto_1

    .line 236
    :cond_1
    sget-object v6, Ljava/util/concurrent/TimeUnit;->NANOSECONDS:Ljava/util/concurrent/TimeUnit;

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v7

    sub-long/2addr v7, v3

    invoke-virtual {v6, v7, v8}, Ljava/util/concurrent/TimeUnit;->toMillis(J)J

    move-result-wide v6

    const-wide/16 v8, 0xdac

    cmp-long v10, v6, v8

    if-gtz v10, :cond_2

    .line 239
    :goto_1
    invoke-virtual {v0, v5}, Ljava/io/ByteArrayOutputStream;->write(I)V

    goto :goto_0

    .line 237
    :cond_2
    new-instance p0, Ljava/io/IOException;

    const-string v0, "LAN frame timed out"

    invoke-direct {p0, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 234
    :cond_3
    new-instance p0, Ljava/io/IOException;

    const-string v0, "LAN frame too long"

    invoke-direct {p0, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 241
    :cond_4
    const/4 p0, 0x0

    return-object p0
.end method

.method private receive(Ljava/net/Socket;)V
    .locals 5

    .line 249
    const-string v0, "hello"

    .line 250
    const/16 v1, 0xdac

    :try_start_0
    invoke-virtual {p1, v1}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 251
    new-instance v1, Ljava/io/BufferedInputStream;

    invoke-virtual {p1}, Ljava/net/Socket;->getInputStream()Ljava/io/InputStream;

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V

    .line 252
    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v2

    .line 253
    if-eqz v2, :cond_2

    const-string v3, "t"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_2

    invoke-direct {p0, v2}, Ltt/xinjian/cn/LanTransport;->validPeer(Lorg/json/JSONObject;)Z

    move-result v3

    if-nez v3, :cond_0

    goto :goto_1

    .line 254
    :cond_0
    const-string v3, "id"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 255
    invoke-virtual {p1}, Ljava/net/Socket;->getInetAddress()Ljava/net/InetAddress;

    move-result-object v4

    invoke-direct {p0, v2, v4}, Ltt/xinjian/cn/LanTransport;->observe(Lorg/json/JSONObject;Ljava/net/InetAddress;)V

    .line 256
    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v0

    invoke-static {p1, v0}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 257
    const/16 v0, 0x2ee0

    invoke-virtual {p1, v0}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 259
    :goto_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_1

    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v0

    if-eqz v0, :cond_1

    .line 260
    invoke-direct {p0, p1, v2, v3, v0}, Ltt/xinjian/cn/LanTransport;->acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    goto :goto_0

    .line 262
    :cond_1
    if-eqz p1, :cond_5

    :try_start_1
    invoke-virtual {p1}, Ljava/net/Socket;->close()V

    goto :goto_3

    :cond_2
    :goto_1
    if-eqz p1, :cond_3

    invoke-virtual {p1}, Ljava/net/Socket;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Lorg/json/JSONException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_2

    .line 264
    :cond_3
    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 253
    return-void

    .line 249
    :catchall_0
    move-exception v0

    if-eqz p1, :cond_4

    :try_start_2
    invoke-virtual {p1}, Ljava/net/Socket;->close()V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    goto :goto_2

    :catchall_1
    move-exception v1

    :try_start_3
    invoke-virtual {v0, v1}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :cond_4
    :goto_2
    throw v0
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_1
    .catch Lorg/json/JSONException; {:try_start_3 .. :try_end_3} :catch_0
    .catchall {:try_start_3 .. :try_end_3} :catchall_2

    .line 264
    :catchall_2
    move-exception v0

    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 265
    throw v0

    .line 262
    :catch_0
    move-exception v0

    goto :goto_3

    :catch_1
    move-exception v0

    .line 264
    :cond_5
    :goto_3
    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 265
    nop

    .line 266
    return-void
.end method

.method private static thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;
    .locals 1

    .line 111
    new-instance v0, Ljava/lang/Thread;

    invoke-direct {v0, p1, p0}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;Ljava/lang/String;)V

    .line 112
    const/4 p0, 0x1

    invoke-virtual {v0, p0}, Ljava/lang/Thread;->setDaemon(Z)V

    .line 113
    return-object v0
.end method

.method private declared-synchronized track(Ljava/net/Socket;)Z
    .locals 1

    monitor-enter p0

    .line 202
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-nez v0, :cond_0

    monitor-exit p0

    const/4 p1, 0x0

    return p1

    .line 203
    :cond_0
    :try_start_1
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-interface {v0, p1}, Ljava/util/Set;->add(Ljava/lang/Object;)Z
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 204
    monitor-exit p0

    const/4 p1, 0x1

    return p1

    .line 201
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1
.end method

.method private declared-synchronized untrack(Ljava/net/Socket;)V
    .locals 1

    monitor-enter p0

    .line 208
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-interface {v0, p1}, Ljava/util/Set;->remove(Ljava/lang/Object;)Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 209
    monitor-exit p0

    return-void

    .line 207
    :catchall_0
    move-exception p1

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw p1
.end method

.method static validId(Ljava/lang/String;)Z
    .locals 1

    .line 99
    if-eqz p0, :cond_0

    sget-object v0, Ltt/xinjian/cn/LanTransport;->PEER_ID:Ljava/util/regex/Pattern;

    invoke-virtual {v0, p0}, Ljava/util/regex/Pattern;->matcher(Ljava/lang/CharSequence;)Ljava/util/regex/Matcher;

    move-result-object p0

    invoke-virtual {p0}, Ljava/util/regex/Matcher;->matches()Z

    move-result p0

    if-eqz p0, :cond_0

    const/4 p0, 0x1

    goto :goto_0

    :cond_0
    const/4 p0, 0x0

    :goto_0
    return p0
.end method

.method static validMid(Ljava/lang/String;)Z
    .locals 1

    .line 103
    if-eqz p0, :cond_0

    sget-object v0, Ltt/xinjian/cn/LanTransport;->MESSAGE_ID:Ljava/util/regex/Pattern;

    invoke-virtual {v0, p0}, Ljava/util/regex/Pattern;->matcher(Ljava/lang/CharSequence;)Ljava/util/regex/Matcher;

    move-result-object p0

    invoke-virtual {p0}, Ljava/util/regex/Matcher;->matches()Z

    move-result p0

    if-eqz p0, :cond_0

    const/4 p0, 0x1

    goto :goto_0

    :cond_0
    const/4 p0, 0x0

    :goto_0
    return p0
.end method

.method private validPeer(Lorg/json/JSONObject;)Z
    .locals 3

    .line 140
    const-string v0, "id"

    invoke-virtual {p1, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 141
    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->validId(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :cond_0

    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-nez v0, :cond_0

    const-string v0, "v"

    invoke-virtual {p1, v0}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v0

    const/4 v1, 0x1

    if-ne v0, v1, :cond_0

    .line 142
    const-string v0, "tcp"

    const v2, 0xb2de

    invoke-virtual {p1, v0, v2}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    move-result p1

    if-ne p1, v2, :cond_0

    goto :goto_0

    :cond_0
    const/4 v1, 0x0

    .line 141
    :goto_0
    return v1
.end method

.method private static writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V
    .locals 1
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 245
    invoke-virtual {p0}, Ljava/net/Socket;->getOutputStream()Ljava/io/OutputStream;

    move-result-object p0

    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {p1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v0, "\n"

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    sget-object v0, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {p1, v0}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object p1

    invoke-virtual {p0, p1}, Ljava/io/OutputStream;->write([B)V

    .line 246
    return-void
.end method


# virtual methods
.method public declared-synchronized close()V
    .locals 2

    monitor-enter p0

    .line 323
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-nez v0, :cond_0

    monitor-exit p0

    return-void

    .line 324
    :cond_0
    const/4 v0, 0x0

    :try_start_1
    iput-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    .line 325
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    invoke-virtual {v0}, Ljava/net/DatagramSocket;->close()V

    .line 326
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->server:Ljava/net/ServerSocket;

    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 327
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    if-eqz v0, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    invoke-virtual {v0}, Ljava/lang/Thread;->interrupt()V

    .line 328
    :cond_1
    new-instance v0, Ljava/util/ArrayList;

    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-direct {v0, v1}, Ljava/util/ArrayList;-><init>(Ljava/util/Collection;)V

    invoke-virtual {v0}, Ljava/util/ArrayList;->iterator()Ljava/util/Iterator;

    move-result-object v0

    :goto_0
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v1

    if-eqz v1, :cond_2

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/net/Socket;

    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    goto :goto_0

    .line 329
    :cond_2
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-interface {v0}, Ljava/util/Set;->clear()V

    .line 330
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v0}, Ljava/util/Map;->clear()V

    .line 331
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->receivers:Ljava/util/concurrent/ThreadPoolExecutor;

    invoke-virtual {v0}, Ljava/util/concurrent/ThreadPoolExecutor;->shutdownNow()Ljava/util/List;

    .line 332
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->senders:Ljava/util/concurrent/ThreadPoolExecutor;

    invoke-virtual {v0}, Ljava/util/concurrent/ThreadPoolExecutor;->shutdownNow()Ljava/util/List;
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 333
    monitor-exit p0

    return-void

    .line 322
    :catchall_0
    move-exception v0

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw v0
.end method

.method synthetic lambda$accept$1$tt-xinjian-cn-LanTransport(Ljava/net/Socket;)V
    .locals 0

    .line 220
    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->receive(Ljava/net/Socket;)V

    return-void
.end method

.method synthetic lambda$send$2$tt-xinjian-cn-LanTransport(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 0

    .line 284
    invoke-direct {p0, p1, p2, p3, p4}, Ltt/xinjian/cn/LanTransport;->deliver(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    return-void
.end method

.method declared-synchronized send(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 9

    monitor-enter p0

    .line 280
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v0, p1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    move-object v3, v0

    check-cast v3, Ltt/xinjian/cn/LanTransport$Peer;

    .line 281
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    const/4 v7, 0x0

    if-eqz v0, :cond_1

    if-eqz v3, :cond_1

    invoke-static {p2}, Ltt/xinjian/cn/LanTransport;->validMid(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_1

    if-eqz p3, :cond_1

    .line 282
    invoke-virtual {p3}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p3}, Ljava/lang/String;->length()I

    move-result v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    const/16 v1, 0x7d0

    if-le v0, v1, :cond_0

    goto :goto_0

    .line 284
    :cond_0
    :try_start_1
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->senders:Ljava/util/concurrent/ThreadPoolExecutor;

    new-instance v8, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda1;

    move-object v1, v8

    move-object v2, p0

    move-object v4, p1

    move-object v5, p2

    move-object v6, p3

    invoke-direct/range {v1 .. v6}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda1;-><init>(Ltt/xinjian/cn/LanTransport;Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    invoke-virtual {v0, v8}, Ljava/util/concurrent/ThreadPoolExecutor;->execute(Ljava/lang/Runnable;)V
    :try_end_1
    .catch Ljava/util/concurrent/RejectedExecutionException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 285
    monitor-exit p0

    const/4 p1, 0x1

    return p1

    .line 286
    :catch_0
    move-exception p1

    .line 287
    monitor-exit p0

    return v7

    .line 282
    :cond_1
    :goto_0
    monitor-exit p0

    return v7

    .line 279
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1
.end method

.method start()V
    .locals 2

    .line 92
    new-instance v0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;

    invoke-direct {v0, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;-><init>(Ltt/xinjian/cn/LanTransport;)V

    const-string v1, "xj-lan-discover"

    invoke-static {v1, v0}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 93
    new-instance v0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda4;

    invoke-direct {v0, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda4;-><init>(Ltt/xinjian/cn/LanTransport;)V

    const-string v1, "xj-lan-accept"

    invoke-static {v1, v0}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 94
    new-instance v0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda5;

    invoke-direct {v0, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda5;-><init>(Ltt/xinjian/cn/LanTransport;)V

    const-string v1, "xj-lan-announce"

    invoke-static {v1, v0}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    .line 95
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 96
    return-void
.end method
