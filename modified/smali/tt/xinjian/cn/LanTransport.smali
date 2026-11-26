.class final Ltt/xinjian/cn/LanTransport;
.super Ljava/lang/Object;
.source "LanTransport.java"

# interfaces
.implements Ljava/io/Closeable;


# annotations
.annotation system Ldalvik/annotation/MemberClasses;
    value = {
        Ltt/xinjian/cn/LanTransport$Events;,
        Ltt/xinjian/cn/LanTransport$Peer;,
        Ltt/xinjian/cn/LanTransport$Incoming;
    }
.end annotation


# static fields
.field private static final CHUNK_BYTES:I = 0x2328

.field private static final CHUNK_CHARS:I = 0x2ee0

.field private static final DISCOVERY_MS:I = 0xbb8

.field private static final EVICT_MIN_AGE_MS:J = 0x1388L

.field private static final HANDSHAKE_MS:I = 0xdac

.field private static final IMAGE_TTL_MS:J = 0x7530L

.field private static final MAX_CHUNKS:I = 0xdc

.field private static final MAX_FRAME:I = 0x4000

.field static final MAX_IMAGE:I = 0x200000

.field private static final MAX_IMAGES:I = 0x8

.field private static final MAX_IMAGE_BYTES:J = 0x400000L

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

.field private final images:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ltt/xinjian/cn/LanTransport$Incoming;",
            ">;"
        }
    .end annotation
.end field

.field private final media:Ljava/io/File;

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

    .line 56
    const-string v0, "xj-[0-9a-f]{12}"

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Ltt/xinjian/cn/LanTransport;->PEER_ID:Ljava/util/regex/Pattern;

    .line 57
    const-string v0, "[A-Za-z0-9_-]{1,80}"

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Ltt/xinjian/cn/LanTransport;->MESSAGE_ID:Ljava/util/regex/Pattern;

    return-void
.end method

.method constructor <init>(Ljava/lang/String;Ljava/lang/String;Ltt/xinjian/cn/LanTransport$Events;Ljava/io/File;)V
    .locals 3
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 124
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 68
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    .line 69
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    .line 71
    new-instance v0, Ljava/util/HashSet;

    invoke-direct {v0}, Ljava/util/HashSet;-><init>()V

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    .line 72
    const-string v0, "xj-lan-recv"

    const/4 v1, 0x4

    const/16 v2, 0xc

    invoke-static {v0, v1, v2}, Ltt/xinjian/cn/LanTransport;->pool(Ljava/lang/String;II)Ljava/util/concurrent/ThreadPoolExecutor;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->receivers:Ljava/util/concurrent/ThreadPoolExecutor;

    .line 73
    const-string v0, "xj-lan-send"

    const/4 v1, 0x2

    invoke-static {v0, v1, v2}, Ltt/xinjian/cn/LanTransport;->pool(Ljava/lang/String;II)Ljava/util/concurrent/ThreadPoolExecutor;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->senders:Ljava/util/concurrent/ThreadPoolExecutor;

    .line 74
    const/4 v0, 0x1

    iput-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    .line 125
    iput-object p1, p0, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    .line 126
    iput-object p2, p0, Ltt/xinjian/cn/LanTransport;->nick:Ljava/lang/String;

    .line 127
    iput-object p3, p0, Ltt/xinjian/cn/LanTransport;->events:Ltt/xinjian/cn/LanTransport$Events;

    .line 128
    iput-object p4, p0, Ltt/xinjian/cn/LanTransport;->media:Ljava/io/File;

    .line 129
    new-instance p1, Ljava/net/DatagramSocket;

    const/4 p2, 0x0

    invoke-direct {p1, p2}, Ljava/net/DatagramSocket;-><init>(Ljava/net/SocketAddress;)V

    .line 130
    new-instance p2, Ljava/net/ServerSocket;

    invoke-direct {p2}, Ljava/net/ServerSocket;-><init>()V

    .line 132
    :try_start_0
    invoke-virtual {p1, v0}, Ljava/net/DatagramSocket;->setReuseAddress(Z)V

    .line 133
    invoke-virtual {p1, v0}, Ljava/net/DatagramSocket;->setBroadcast(Z)V

    .line 134
    new-instance p3, Ljava/net/InetSocketAddress;

    const p4, 0xb2dd

    invoke-direct {p3, p4}, Ljava/net/InetSocketAddress;-><init>(I)V

    invoke-virtual {p1, p3}, Ljava/net/DatagramSocket;->bind(Ljava/net/SocketAddress;)V

    .line 135
    invoke-virtual {p2, v0}, Ljava/net/ServerSocket;->setReuseAddress(Z)V

    .line 136
    new-instance p3, Ljava/net/InetSocketAddress;

    const p4, 0xb2de

    invoke-direct {p3, p4}, Ljava/net/InetSocketAddress;-><init>(I)V

    const/16 p4, 0x10

    invoke-virtual {p2, p3, p4}, Ljava/net/ServerSocket;->bind(Ljava/net/SocketAddress;I)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    .line 141
    nop

    .line 142
    iput-object p1, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    .line 143
    iput-object p2, p0, Ltt/xinjian/cn/LanTransport;->server:Ljava/net/ServerSocket;

    .line 144
    return-void

    .line 137
    :catch_0
    move-exception p3

    goto :goto_0

    :catch_1
    move-exception p3

    .line 138
    :goto_0
    invoke-virtual {p1}, Ljava/net/DatagramSocket;->close()V

    .line 139
    invoke-static {p2}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 140
    throw p3
.end method

.method private accept()V
    .locals 3

    .line 267
    nop

    :goto_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_2

    .line 269
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->server:Ljava/net/ServerSocket;

    invoke-virtual {v0}, Ljava/net/ServerSocket;->accept()Ljava/net/Socket;

    move-result-object v0
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1

    .line 270
    nop

    .line 271
    invoke-virtual {v0}, Ljava/net/Socket;->getInetAddress()Ljava/net/InetAddress;

    move-result-object v1

    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->local(Ljava/net/InetAddress;)Z

    move-result v1

    if-eqz v1, :cond_1

    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->track(Ljava/net/Socket;)Z

    move-result v1

    if-nez v1, :cond_0

    goto :goto_2

    .line 275
    :cond_0
    :try_start_1
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->receivers:Ljava/util/concurrent/ThreadPoolExecutor;

    new-instance v2, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;

    invoke-direct {v2, p0, v0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;-><init>(Ltt/xinjian/cn/LanTransport;Ljava/net/Socket;)V

    invoke-virtual {v1, v2}, Ljava/util/concurrent/ThreadPoolExecutor;->execute(Ljava/lang/Runnable;)V
    :try_end_1
    .catch Ljava/util/concurrent/RejectedExecutionException; {:try_start_1 .. :try_end_1} :catch_0

    .line 279
    goto :goto_1

    .line 276
    :catch_0
    move-exception v1

    .line 277
    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 278
    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 280
    :goto_1
    goto :goto_0

    .line 272
    :cond_1
    :goto_2
    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 273
    goto :goto_0

    .line 270
    :catch_1
    move-exception v0

    return-void

    .line 281
    :cond_2
    return-void
.end method

.method private acceptChunk(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    .locals 18
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 340
    move-object/from16 v1, p0

    move-object/from16 v0, p3

    move-object/from16 v2, p4

    const-string v3, "mid"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v8

    .line 341
    const-string v3, "from"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v0, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_11

    iget-object v3, v1, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    const-string v4, "to"

    invoke-virtual {v2, v4}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-eqz v3, :cond_11

    invoke-static {v8}, Ltt/xinjian/cn/LanTransport;->validMid(Ljava/lang/String;)Z

    move-result v3

    if-nez v3, :cond_0

    goto/16 :goto_3

    .line 342
    :cond_0
    const-string v3, "seq"

    const/4 v4, -0x1

    invoke-virtual {v2, v3, v4}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    move-result v9

    .line 343
    const-string v3, "total"

    const/4 v10, 0x0

    invoke-virtual {v2, v3, v10}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    move-result v11

    .line 344
    if-ltz v9, :cond_10

    const/4 v12, 0x1

    if-lt v11, v12, :cond_10

    const/16 v3, 0xdc

    if-gt v11, v3, :cond_10

    if-lt v9, v11, :cond_1

    goto/16 :goto_2

    .line 345
    :cond_1
    const-string v3, "data"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->opt(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v3

    .line 346
    instance-of v4, v3, Ljava/lang/String;

    if-nez v4, :cond_2

    return-void

    .line 347
    :cond_2
    check-cast v3, Ljava/lang/String;

    .line 348
    invoke-virtual {v3}, Ljava/lang/String;->isEmpty()Z

    move-result v4

    if-nez v4, :cond_f

    invoke-virtual {v3}, Ljava/lang/String;->length()I

    move-result v4

    const/16 v5, 0x2ee8

    if-le v4, v5, :cond_3

    goto/16 :goto_1

    .line 350
    :cond_3
    :try_start_0
    invoke-static {v3, v10}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B

    move-result-object v13
    :try_end_0
    .catch Ljava/lang/IllegalArgumentException; {:try_start_0 .. :try_end_0} :catch_0

    .line 351
    nop

    .line 352
    array-length v3, v13

    if-lt v3, v12, :cond_e

    array-length v3, v13

    const/16 v4, 0x2328

    if-le v3, v4, :cond_4

    goto/16 :goto_0

    .line 354
    :cond_4
    iget-object v14, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    monitor-enter v14

    .line 355
    :try_start_1
    invoke-direct/range {p0 .. p0}, Ltt/xinjian/cn/LanTransport;->prune()V

    .line 356
    iget-object v3, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v3, v8}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ltt/xinjian/cn/LanTransport$Incoming;

    .line 357
    const/16 v15, 0x8

    if-nez v3, :cond_8

    .line 359
    iget-object v3, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v3}, Ljava/util/Map;->values()Ljava/util/Collection;

    move-result-object v3

    invoke-interface {v3}, Ljava/util/Collection;->iterator()Ljava/util/Iterator;

    move-result-object v3

    :cond_5
    invoke-interface {v3}, Ljava/util/Iterator;->hasNext()Z

    move-result v4

    if-eqz v4, :cond_6

    invoke-interface {v3}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v4

    check-cast v4, Ltt/xinjian/cn/LanTransport$Incoming;

    iget-object v4, v4, Ltt/xinjian/cn/LanTransport$Incoming;->from:Ljava/lang/String;

    invoke-virtual {v0, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_5

    monitor-exit v14

    return-void

    .line 361
    :cond_6
    iget-object v3, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v3}, Ljava/util/Map;->size()I

    move-result v3

    if-lt v3, v15, :cond_7

    invoke-direct/range {p0 .. p0}, Ltt/xinjian/cn/LanTransport;->evictOldest()Z

    move-result v3

    if-nez v3, :cond_6

    monitor-exit v14

    return-void

    .line 362
    :cond_7
    new-instance v7, Ltt/xinjian/cn/LanTransport$Incoming;

    const-string v3, "name"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    const-string v3, "w"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v5

    const-string v3, "h"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v6

    move-object v2, v7

    move-object/from16 v3, p3

    move-object v10, v7

    move v7, v11

    invoke-direct/range {v2 .. v7}, Ltt/xinjian/cn/LanTransport$Incoming;-><init>(Ljava/lang/String;Ljava/lang/String;III)V

    .line 363
    iget-object v2, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v2, v8, v10}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    move-object v3, v10

    .line 365
    :cond_8
    iget v2, v3, Ltt/xinjian/cn/LanTransport$Incoming;->total:I

    if-eq v2, v11, :cond_9

    monitor-exit v14

    return-void

    .line 366
    :cond_9
    iget-object v2, v3, Ltt/xinjian/cn/LanTransport$Incoming;->parts:[[B

    aget-object v2, v2, v9

    if-nez v2, :cond_b

    .line 367
    invoke-direct/range {p0 .. p0}, Ltt/xinjian/cn/LanTransport;->imageBytes()J

    move-result-wide v4

    array-length v2, v13

    int-to-long v6, v2

    add-long/2addr v4, v6

    const-wide/32 v6, 0x400000

    cmp-long v2, v4, v6

    if-lez v2, :cond_a

    monitor-exit v14

    return-void

    .line 368
    :cond_a
    iget-object v2, v3, Ltt/xinjian/cn/LanTransport$Incoming;->parts:[[B

    aput-object v13, v2, v9

    .line 369
    iget v2, v3, Ltt/xinjian/cn/LanTransport$Incoming;->got:I

    add-int/2addr v2, v12

    iput v2, v3, Ltt/xinjian/cn/LanTransport$Incoming;->got:I

    .line 371
    :cond_b
    monitor-exit v14
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 372
    invoke-static {v12}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v2

    invoke-static {v9}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    new-array v5, v15, [Ljava/lang/Object;

    const-string v6, "v"

    const/4 v7, 0x0

    aput-object v6, v5, v7

    aput-object v2, v5, v12

    const-string v2, "t"

    const/4 v6, 0x2

    aput-object v2, v5, v6

    const-string v2, "ack"

    const/4 v7, 0x3

    aput-object v2, v5, v7

    const-string v2, "mid"

    const/4 v9, 0x4

    aput-object v2, v5, v9

    const/4 v2, 0x5

    aput-object v8, v5, v2

    const-string v10, "seq"

    const/4 v11, 0x6

    aput-object v10, v5, v11

    const/4 v10, 0x7

    aput-object v4, v5, v10

    invoke-static {v5}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object v4

    move-object/from16 v5, p1

    invoke-static {v5, v4}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 373
    invoke-virtual {v3}, Ltt/xinjian/cn/LanTransport$Incoming;->complete()Z

    move-result v4

    if-nez v4, :cond_c

    return-void

    .line 374
    :cond_c
    invoke-virtual {v3}, Ltt/xinjian/cn/LanTransport$Incoming;->assemble()[B

    move-result-object v4

    .line 375
    iget-object v5, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    monitor-enter v5

    :try_start_2
    iget-object v13, v1, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v13, v8}, Ljava/util/Map;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    monitor-exit v5
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 376
    invoke-direct {v1, v4, v8}, Ltt/xinjian/cn/LanTransport;->store([BLjava/lang/String;)Ljava/lang/String;

    move-result-object v5

    .line 377
    if-nez v5, :cond_d

    return-void

    .line 378
    :cond_d
    invoke-static/range {p2 .. p2}, Ltt/xinjian/cn/LanTransport;->nickname(Lorg/json/JSONObject;)Ljava/lang/String;

    move-result-object v13

    iget v14, v3, Ltt/xinjian/cn/LanTransport$Incoming;->width:I

    .line 379
    invoke-static {v14}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v14

    iget v3, v3, Ltt/xinjian/cn/LanTransport$Incoming;->height:I

    invoke-static {v3}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v3

    array-length v4, v4

    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    const/16 v15, 0x10

    new-array v15, v15, [Ljava/lang/Object;

    const-string v17, "t"

    const/16 v16, 0x0

    aput-object v17, v15, v16

    const-string v16, "img"

    aput-object v16, v15, v12

    const-string v12, "id"

    aput-object v12, v15, v6

    aput-object v0, v15, v7

    const-string v0, "nick"

    aput-object v0, v15, v9

    aput-object v13, v15, v2

    const-string v0, "mid"

    aput-object v0, v15, v11

    aput-object v8, v15, v10

    const-string v0, "name"

    const/16 v2, 0x8

    aput-object v0, v15, v2

    const/16 v0, 0x9

    aput-object v5, v15, v0

    const-string v0, "w"

    const/16 v2, 0xa

    aput-object v0, v15, v2

    const/16 v0, 0xb

    aput-object v14, v15, v0

    const-string v0, "h"

    const/16 v2, 0xc

    aput-object v0, v15, v2

    const/16 v0, 0xd

    aput-object v3, v15, v0

    const-string v0, "size"

    const/16 v2, 0xe

    aput-object v0, v15, v2

    const/16 v0, 0xf

    aput-object v4, v15, v0

    .line 378
    invoke-direct {v1, v15}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 380
    return-void

    .line 375
    :catchall_0
    move-exception v0

    :try_start_3
    monitor-exit v5
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    throw v0

    .line 371
    :catchall_1
    move-exception v0

    :try_start_4
    monitor-exit v14
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_1

    throw v0

    .line 352
    :cond_e
    :goto_0
    return-void

    .line 351
    :catch_0
    move-exception v0

    return-void

    .line 348
    :cond_f
    :goto_1
    return-void

    .line 344
    :cond_10
    :goto_2
    return-void

    .line 341
    :cond_11
    :goto_3
    return-void
.end method

.method private acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    .locals 16
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 324
    move-object/from16 v0, p0

    move-object/from16 v1, p3

    move-object/from16 v2, p4

    const-string v3, "t"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    const-string v5, "img"

    invoke-virtual {v5, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_0

    .line 325
    invoke-direct/range {p0 .. p4}, Ltt/xinjian/cn/LanTransport;->acceptChunk(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V

    .line 326
    return-void

    .line 328
    :cond_0
    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    const-string v5, "msg"

    invoke-virtual {v5, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_4

    const-string v4, "v"

    invoke-virtual {v2, v4}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v6

    const/4 v7, 0x1

    if-ne v6, v7, :cond_4

    .line 329
    const-string v6, "text"

    invoke-virtual {v2, v6}, Lorg/json/JSONObject;->opt(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v8

    instance-of v8, v8, Ljava/lang/String;

    if-eqz v8, :cond_4

    const-string v8, "mid"

    invoke-virtual {v2, v8}, Lorg/json/JSONObject;->opt(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v9

    instance-of v9, v9, Ljava/lang/String;

    if-nez v9, :cond_1

    goto/16 :goto_1

    .line 330
    :cond_1
    invoke-virtual {v2, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v9

    .line 331
    invoke-virtual {v2, v6}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v10

    .line 332
    const-string v11, "from"

    invoke-virtual {v2, v11}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v11

    invoke-virtual {v1, v11}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v11

    if-eqz v11, :cond_3

    iget-object v11, v0, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    const-string v12, "to"

    invoke-virtual {v2, v12}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v11, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_3

    .line 333
    invoke-static {v9}, Ltt/xinjian/cn/LanTransport;->validMid(Ljava/lang/String;)Z

    move-result v2

    if-eqz v2, :cond_3

    invoke-virtual {v10}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/String;->isEmpty()Z

    move-result v2

    if-nez v2, :cond_3

    invoke-virtual {v10}, Ljava/lang/String;->length()I

    move-result v2

    const/16 v11, 0x7d0

    if-le v2, v11, :cond_2

    goto :goto_0

    .line 334
    :cond_2
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

    .line 335
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

    .line 336
    return-void

    .line 333
    :cond_3
    :goto_0
    return-void

    .line 329
    :cond_4
    :goto_1
    return-void
.end method

.method private announce()V
    .locals 6

    .line 228
    const-string v0, "ann"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v0

    invoke-virtual {v0}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object v0

    sget-object v1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v0, v1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object v0

    .line 229
    :goto_0
    iget-boolean v1, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v1, :cond_0

    .line 231
    :try_start_0
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    new-instance v2, Ljava/net/DatagramPacket;

    array-length v3, v0

    const-string v4, "255.255.255.255"

    .line 232
    invoke-static {v4}, Ljava/net/InetAddress;->getByName(Ljava/lang/String;)Ljava/net/InetAddress;

    move-result-object v4

    const v5, 0xb2dd

    invoke-direct {v2, v0, v3, v4, v5}, Ljava/net/DatagramPacket;-><init>([BILjava/net/InetAddress;I)V

    .line 231
    invoke-virtual {v1, v2}, Ljava/net/DatagramSocket;->send(Ljava/net/DatagramPacket;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    .line 235
    goto :goto_1

    .line 233
    :catch_0
    move-exception v1

    .line 236
    :goto_1
    invoke-direct {p0}, Ltt/xinjian/cn/LanTransport;->expire()V

    .line 237
    const-wide/16 v1, 0xbb8

    :try_start_1
    invoke-static {v1, v2}, Ljava/lang/Thread;->sleep(J)V
    :try_end_1
    .catch Ljava/lang/InterruptedException; {:try_start_1 .. :try_end_1} :catch_1

    .line 238
    goto :goto_0

    :catch_1
    move-exception v0

    return-void

    .line 240
    :cond_0
    return-void
.end method

.method private static closeQuietly(Ljava/io/Closeable;)V
    .locals 0

    .line 546
    :try_start_0
    invoke-interface {p0}, Ljava/io/Closeable;->close()V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    move-exception p0

    .line 547
    :goto_0
    return-void
.end method

.method private deliver(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 23

    .line 501
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

    .line 502
    nop

    .line 503
    nop

    .line 504
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

    .line 524
    :try_start_1
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Lorg/json/JSONException; {:try_start_1 .. :try_end_1} :catch_2
    .catchall {:try_start_1 .. :try_end_1} :catchall_3

    .line 526
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 504
    return-void

    .line 505
    :cond_0
    :try_start_2
    new-instance v11, Ljava/net/InetSocketAddress;

    move-object/from16 v13, p1

    iget-object v13, v13, Ltt/xinjian/cn/LanTransport$Peer;->address:Ljava/net/InetAddress;

    const v14, 0xb2de

    invoke-direct {v11, v13, v14}, Ljava/net/InetSocketAddress;-><init>(Ljava/net/InetAddress;I)V

    const/16 v13, 0xdac

    invoke-virtual {v10, v11, v13}, Ljava/net/Socket;->connect(Ljava/net/SocketAddress;I)V

    .line 506
    invoke-virtual {v10, v13}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 507
    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v11

    invoke-static {v10, v11}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 508
    new-instance v11, Ljava/io/BufferedInputStream;

    invoke-virtual {v10}, Ljava/net/Socket;->getInputStream()Ljava/io/InputStream;

    move-result-object v13

    invoke-direct {v11, v13}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V

    .line 509
    invoke-static {v11}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v13

    .line 510
    if-eqz v13, :cond_5

    invoke-virtual {v13, v9}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v14

    invoke-virtual {v4, v14}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_5

    invoke-direct {v1, v13}, Ltt/xinjian/cn/LanTransport;->validPeer(Lorg/json/JSONObject;)Z

    move-result v4

    if-eqz v4, :cond_5

    .line 511
    invoke-virtual {v13, v7}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-nez v4, :cond_1

    goto/16 :goto_2

    .line 512
    :cond_1
    invoke-static {v12}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v4

    iget-object v14, v1, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    iget-object v15, v1, Ltt/xinjian/cn/LanTransport;->nick:Ljava/lang/String;

    .line 513
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

    .line 512
    invoke-static {v12}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object v4

    invoke-static {v10, v4}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 514
    const/4 v4, 0x0

    :goto_0
    iget-boolean v12, v1, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v12, :cond_4

    const/16 v12, 0x8

    if-ge v4, v12, :cond_4

    .line 515
    invoke-static {v11}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v12
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    .line 516
    if-nez v12, :cond_2

    .line 524
    :try_start_3
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_3
    .catch Lorg/json/JSONException; {:try_start_3 .. :try_end_3} :catch_2
    .catchall {:try_start_3 .. :try_end_3} :catchall_3

    .line 526
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 516
    return-void

    .line 517
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

    .line 518
    invoke-virtual {v12, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v14

    invoke-virtual {v3, v14}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v14
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_1

    if-eqz v14, :cond_3

    .line 519
    nop

    .line 524
    :try_start_5
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_5
    .catch Ljava/io/IOException; {:try_start_5 .. :try_end_5} :catch_1
    .catch Lorg/json/JSONException; {:try_start_5 .. :try_end_5} :catch_0
    .catchall {:try_start_5 .. :try_end_5} :catchall_0

    .line 526
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 520
    return-void

    .line 526
    :catchall_0
    move-exception v0

    move-object v4, v0

    const/4 v0, 0x1

    goto/16 :goto_5

    .line 524
    :catch_0
    move-exception v0

    goto :goto_1

    :catch_1
    move-exception v0

    :goto_1
    const/4 v0, 0x1

    goto/16 :goto_6

    .line 522
    :cond_3
    :try_start_6
    invoke-direct {v1, v10, v13, v2, v12}, Ltt/xinjian/cn/LanTransport;->acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_1

    .line 514
    add-int/lit8 v4, v4, 0x1

    goto/16 :goto_0

    .line 524
    :cond_4
    :try_start_7
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_7
    .catch Ljava/io/IOException; {:try_start_7 .. :try_end_7} :catch_3
    .catch Lorg/json/JSONException; {:try_start_7 .. :try_end_7} :catch_2
    .catchall {:try_start_7 .. :try_end_7} :catchall_3

    .line 526
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 524
    :cond_5
    :goto_2
    :try_start_8
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_3
    .catch Lorg/json/JSONException; {:try_start_8 .. :try_end_8} :catch_2
    .catchall {:try_start_8 .. :try_end_8} :catchall_3

    .line 526
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 511
    return-void

    .line 503
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

    .line 526
    :catchall_3
    move-exception v0

    move-object v4, v0

    const/4 v0, 0x0

    goto :goto_5

    .line 524
    :catch_2
    move-exception v0

    goto :goto_4

    :catch_3
    move-exception v0

    :goto_4
    const/4 v0, 0x0

    goto :goto_6

    .line 526
    :goto_5
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 528
    throw v4

    .line 526
    :goto_6
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 527
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

    .line 528
    :goto_7
    nop

    .line 529
    return-void
.end method

.method private deliverImage(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;I)V
    .locals 29

    .line 450
    move-object/from16 v1, p0

    move-object/from16 v2, p2

    move-object/from16 v3, p3

    move/from16 v0, p8

    const-string v4, "hello"

    const-string v5, "ok"

    const-string v6, "delivery"

    const-string v7, "id"

    const-string v8, "mid"

    const-string v9, "t"

    new-instance v10, Ljava/net/Socket;

    invoke-direct {v10}, Ljava/net/Socket;-><init>()V

    .line 451
    nop

    .line 452
    nop

    .line 453
    const/4 v13, 0x5

    const/4 v14, 0x4

    const/4 v15, 0x3

    const/16 v11, 0x8

    const/16 v16, 0x2

    const/4 v12, 0x1

    const/16 v18, 0x0

    :try_start_0
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->track(Ljava/net/Socket;)Z

    move-result v19
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_5

    if-nez v19, :cond_0

    .line 481
    :try_start_1
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_1
    .catch Lorg/json/JSONException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 483
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 484
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

    .line 453
    return-void

    .line 483
    :catchall_0
    move-exception v0

    move-object/from16 v21, v5

    move-object/from16 v28, v7

    goto/16 :goto_c

    .line 481
    :catch_0
    move-exception v0

    goto :goto_0

    :catch_1
    move-exception v0

    :goto_0
    move-object/from16 v21, v5

    move-object/from16 v28, v7

    goto/16 :goto_d

    .line 454
    :cond_0
    :try_start_2
    new-instance v11, Ljava/net/InetSocketAddress;

    move-object/from16 v13, p1

    iget-object v13, v13, Ltt/xinjian/cn/LanTransport$Peer;->address:Ljava/net/InetAddress;

    const v14, 0xb2de

    invoke-direct {v11, v13, v14}, Ljava/net/InetSocketAddress;-><init>(Ljava/net/InetAddress;I)V

    const/16 v13, 0xdac

    invoke-virtual {v10, v11, v13}, Ljava/net/Socket;->connect(Ljava/net/SocketAddress;I)V

    .line 455
    invoke-virtual {v10, v13}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 456
    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v11

    invoke-static {v10, v11}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 457
    new-instance v11, Ljava/io/BufferedInputStream;

    invoke-virtual {v10}, Ljava/net/Socket;->getInputStream()Ljava/io/InputStream;

    move-result-object v13

    invoke-direct {v11, v13}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V

    .line 458
    invoke-static {v11}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v13

    .line 459
    if-eqz v13, :cond_8

    invoke-virtual {v13, v9}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v14

    invoke-virtual {v4, v14}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_8

    invoke-direct {v1, v13}, Ltt/xinjian/cn/LanTransport;->validPeer(Lorg/json/JSONObject;)Z

    move-result v4

    if-eqz v4, :cond_8

    .line 460
    invoke-virtual {v13, v7}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-nez v4, :cond_1

    move-object/from16 v21, v5

    move-object/from16 v28, v7

    goto/16 :goto_7

    .line 461
    :cond_1
    const/16 v4, 0x3a98

    invoke-virtual {v10, v4}, Ljava/net/Socket;->setSoTimeout(I)V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_5

    .line 462
    const/4 v4, 0x0

    :goto_1
    const-string v14, "v"

    if-ge v4, v0, :cond_3

    .line 463
    mul-int/lit16 v15, v4, 0x2ee0

    .line 464
    :try_start_3
    invoke-virtual/range {p7 .. p7}, Ljava/lang/String;->length()I

    move-result v12
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_5

    move-object/from16 v21, v5

    add-int/lit16 v5, v15, 0x2ee0

    :try_start_4
    invoke-static {v12, v5}, Ljava/lang/Math;->min(II)I

    move-result v5

    .line 465
    const/4 v12, 0x1

    invoke-static {v12}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v22

    iget-object v12, v1, Ltt/xinjian/cn/LanTransport;->id:Ljava/lang/String;

    .line 466
    invoke-static {v4}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v23

    invoke-static/range {p8 .. p8}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v24
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_2

    if-nez p4, :cond_2

    :try_start_5
    const-string v25, ""
    :try_end_5
    .catchall {:try_start_5 .. :try_end_5} :catchall_1

    goto :goto_2

    .line 452
    :catchall_1
    move-exception v0

    move-object v4, v0

    move-object/from16 v28, v7

    goto/16 :goto_a

    .line 466
    :cond_2
    move-object/from16 v25, p4

    .line 467
    :goto_2
    :try_start_6
    invoke-static/range {p5 .. p5}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v26

    invoke-static/range {p6 .. p6}, Ljava/lang/Integer;->valueOf(I)Ljava/lang/Integer;

    move-result-object v27
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_2

    move-object/from16 v28, v7

    move-object/from16 v7, p7

    :try_start_7
    invoke-virtual {v7, v15, v5}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v5

    const/16 v15, 0x16

    new-array v15, v15, [Ljava/lang/Object;

    aput-object v14, v15, v18

    const/4 v14, 0x1

    aput-object v22, v15, v14

    aput-object v9, v15, v16

    const-string v14, "img"

    const/16 v20, 0x3

    aput-object v14, v15, v20

    const/4 v14, 0x4

    aput-object v8, v15, v14

    const/4 v14, 0x5

    aput-object v3, v15, v14

    const-string v14, "from"

    const/16 v17, 0x6

    aput-object v14, v15, v17

    const/4 v14, 0x7

    aput-object v12, v15, v14

    const-string v12, "to"

    const/16 v14, 0x8

    aput-object v12, v15, v14

    const/16 v12, 0x9

    aput-object v2, v15, v12

    const-string v12, "seq"

    const/16 v14, 0xa

    aput-object v12, v15, v14

    const/16 v12, 0xb

    aput-object v23, v15, v12

    const-string v12, "total"

    const/16 v14, 0xc

    aput-object v12, v15, v14

    const/16 v12, 0xd

    aput-object v24, v15, v12

    const-string v12, "name"

    const/16 v14, 0xe

    aput-object v12, v15, v14

    const/16 v12, 0xf

    aput-object v25, v15, v12

    const-string v12, "w"

    const/16 v14, 0x10

    aput-object v12, v15, v14

    const/16 v12, 0x11

    aput-object v26, v15, v12

    const-string v12, "h"

    const/16 v14, 0x12

    aput-object v12, v15, v14

    const/16 v12, 0x13

    aput-object v27, v15, v12

    const-string v12, "data"

    const/16 v14, 0x14

    aput-object v12, v15, v14

    const/16 v12, 0x15

    aput-object v5, v15, v12

    .line 465
    invoke-static {v15}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object v5

    invoke-static {v10, v5}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 462
    add-int/lit8 v4, v4, 0x1

    move-object/from16 v5, v21

    move-object/from16 v7, v28

    const/4 v12, 0x1

    const/4 v15, 0x3

    goto/16 :goto_1

    .line 452
    :catchall_2
    move-exception v0

    goto/16 :goto_8

    .line 469
    :cond_3
    move-object/from16 v21, v5

    move-object/from16 v28, v7

    .line 470
    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_3
    iget-boolean v7, v1, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v7, :cond_6

    mul-int/lit8 v7, v0, 0x2

    if-ge v4, v7, :cond_6

    if-ge v5, v0, :cond_6

    .line 471
    invoke-static {v11}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v7

    .line 472
    if-nez v7, :cond_4

    goto :goto_5

    .line 473
    :cond_4
    invoke-virtual {v7, v14}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;)I

    move-result v12

    const/4 v15, 0x1

    if-ne v12, v15, :cond_5

    const-string v12, "ack"

    invoke-virtual {v7, v9}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v15

    invoke-virtual {v12, v15}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v12

    if-eqz v12, :cond_5

    .line 474
    invoke-virtual {v7, v8}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v12

    invoke-virtual {v3, v12}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v12

    if-eqz v12, :cond_5

    .line 475
    add-int/lit8 v5, v5, 0x1

    goto :goto_4

    .line 477
    :cond_5
    invoke-direct {v1, v10, v13, v2, v7}, Ltt/xinjian/cn/LanTransport;->acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    :try_end_7
    .catchall {:try_start_7 .. :try_end_7} :catchall_4

    .line 470
    :goto_4
    add-int/lit8 v4, v4, 0x1

    goto :goto_3

    .line 480
    :cond_6
    :goto_5
    if-lt v5, v0, :cond_7

    const/4 v4, 0x1

    goto :goto_6

    :cond_7
    const/4 v4, 0x0

    .line 481
    :goto_6
    :try_start_8
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_8
    .catch Ljava/io/IOException; {:try_start_8 .. :try_end_8} :catch_3
    .catch Lorg/json/JSONException; {:try_start_8 .. :try_end_8} :catch_2
    .catchall {:try_start_8 .. :try_end_8} :catchall_3

    .line 483
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 484
    invoke-static {v4}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v5, 0x1

    aput-object v6, v4, v5

    aput-object v28, v4, v16

    const/4 v5, 0x3

    aput-object v2, v4, v5

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v21, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    goto/16 :goto_10

    .line 483
    :catchall_3
    move-exception v0

    goto :goto_e

    .line 481
    :catch_2
    move-exception v0

    goto/16 :goto_f

    :catch_3
    move-exception v0

    goto/16 :goto_f

    .line 452
    :catchall_4
    move-exception v0

    goto :goto_9

    .line 459
    :cond_8
    move-object/from16 v21, v5

    move-object/from16 v28, v7

    .line 481
    :goto_7
    :try_start_9
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_9
    .catch Ljava/io/IOException; {:try_start_9 .. :try_end_9} :catch_5
    .catch Lorg/json/JSONException; {:try_start_9 .. :try_end_9} :catch_4
    .catchall {:try_start_9 .. :try_end_9} :catchall_7

    .line 483
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 484
    invoke-static/range {v18 .. v18}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v5, 0x1

    aput-object v6, v4, v5

    aput-object v28, v4, v16

    const/4 v5, 0x3

    aput-object v2, v4, v5

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v21, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 460
    return-void

    .line 452
    :catchall_5
    move-exception v0

    move-object/from16 v21, v5

    :goto_8
    move-object/from16 v28, v7

    :goto_9
    move-object v4, v0

    :goto_a
    :try_start_a
    invoke-virtual {v10}, Ljava/net/Socket;->close()V
    :try_end_a
    .catchall {:try_start_a .. :try_end_a} :catchall_6

    goto :goto_b

    :catchall_6
    move-exception v0

    move-object v5, v0

    :try_start_b
    invoke-virtual {v4, v5}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :goto_b
    throw v4
    :try_end_b
    .catch Ljava/io/IOException; {:try_start_b .. :try_end_b} :catch_5
    .catch Lorg/json/JSONException; {:try_start_b .. :try_end_b} :catch_4
    .catchall {:try_start_b .. :try_end_b} :catchall_7

    .line 483
    :catchall_7
    move-exception v0

    :goto_c
    const/4 v4, 0x0

    goto :goto_e

    .line 481
    :catch_4
    move-exception v0

    goto :goto_d

    :catch_5
    move-exception v0

    :goto_d
    const/4 v4, 0x0

    goto :goto_f

    .line 483
    :goto_e
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 484
    invoke-static {v4}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v4

    const/16 v5, 0x8

    new-array v5, v5, [Ljava/lang/Object;

    aput-object v9, v5, v18

    const/4 v7, 0x1

    aput-object v6, v5, v7

    aput-object v28, v5, v16

    const/4 v6, 0x3

    aput-object v2, v5, v6

    const/4 v2, 0x4

    aput-object v8, v5, v2

    const/4 v2, 0x5

    aput-object v3, v5, v2

    const/4 v2, 0x6

    aput-object v21, v5, v2

    const/4 v2, 0x7

    aput-object v4, v5, v2

    invoke-direct {v1, v5}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 485
    throw v0

    .line 483
    :goto_f
    invoke-direct {v1, v10}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 484
    invoke-static {v4}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v0

    const/16 v4, 0x8

    new-array v4, v4, [Ljava/lang/Object;

    aput-object v9, v4, v18

    const/4 v5, 0x1

    aput-object v6, v4, v5

    aput-object v28, v4, v16

    const/4 v5, 0x3

    aput-object v2, v4, v5

    const/4 v2, 0x4

    aput-object v8, v4, v2

    const/4 v2, 0x5

    aput-object v3, v4, v2

    const/4 v2, 0x6

    aput-object v21, v4, v2

    const/4 v2, 0x7

    aput-object v0, v4, v2

    invoke-direct {v1, v4}, Ltt/xinjian/cn/LanTransport;->emit([Ljava/lang/Object;)V

    .line 485
    :goto_10
    nop

    .line 486
    return-void
.end method

.method private discover()V
    .locals 8

    .line 243
    const/16 v0, 0x800

    new-array v1, v0, [B

    .line 244
    :cond_0
    :goto_0
    iget-boolean v2, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v2, :cond_3

    .line 245
    new-instance v2, Ljava/net/DatagramPacket;

    invoke-direct {v2, v1, v0}, Ljava/net/DatagramPacket;-><init>([BI)V

    .line 246
    :try_start_0
    iget-object v3, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    invoke-virtual {v3, v2}, Ljava/net/DatagramSocket;->receive(Ljava/net/DatagramPacket;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1

    .line 247
    nop

    .line 248
    invoke-virtual {v2}, Ljava/net/DatagramPacket;->getAddress()Ljava/net/InetAddress;

    move-result-object v3

    invoke-static {v3}, Ltt/xinjian/cn/LanTransport;->local(Ljava/net/InetAddress;)Z

    move-result v3

    if-eqz v3, :cond_0

    invoke-virtual {v2}, Ljava/net/DatagramPacket;->getLength()I

    move-result v3

    if-ne v3, v0, :cond_1

    goto :goto_0

    .line 250
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

    .line 251
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

    .line 252
    :catch_0
    move-exception v2

    :cond_2
    :goto_1
    nop

    .line 253
    goto :goto_0

    .line 247
    :catch_1
    move-exception v0

    return-void

    .line 254
    :cond_3
    return-void
.end method

.method private varargs emit([Ljava/lang/Object;)V
    .locals 1

    .line 187
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->events:Ltt/xinjian/cn/LanTransport$Events;

    invoke-static {p1}, Ltt/xinjian/cn/LanTransport;->object([Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1

    invoke-interface {v0, p0, p1}, Ltt/xinjian/cn/LanTransport$Events;->event(Ltt/xinjian/cn/LanTransport;Lorg/json/JSONObject;)V

    .line 188
    :cond_0
    return-void
.end method

.method private evictOldest()Z
    .locals 14

    .line 392
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v0

    .line 393
    nop

    .line 394
    nop

    .line 395
    iget-object v2, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v2}, Ljava/util/Map;->entrySet()Ljava/util/Set;

    move-result-object v2

    invoke-interface {v2}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object v2

    const/4 v3, 0x0

    const-wide v4, 0x7fffffffffffffffL

    :goto_0
    invoke-interface {v2}, Ljava/util/Iterator;->hasNext()Z

    move-result v6

    if-eqz v6, :cond_2

    invoke-interface {v2}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v6

    check-cast v6, Ljava/util/Map$Entry;

    .line 396
    invoke-interface {v6}, Ljava/util/Map$Entry;->getValue()Ljava/lang/Object;

    move-result-object v7

    check-cast v7, Ltt/xinjian/cn/LanTransport$Incoming;

    iget-wide v7, v7, Ltt/xinjian/cn/LanTransport$Incoming;->started:J

    .line 397
    sub-long v9, v0, v7

    const-wide/16 v11, 0x1388

    cmp-long v13, v9, v11

    if-gez v13, :cond_0

    goto :goto_0

    .line 398
    :cond_0
    cmp-long v9, v7, v4

    if-gez v9, :cond_1

    .line 399
    nop

    .line 400
    invoke-interface {v6}, Ljava/util/Map$Entry;->getKey()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/lang/String;

    move-wide v4, v7

    .line 402
    :cond_1
    goto :goto_0

    .line 403
    :cond_2
    if-nez v3, :cond_3

    const/4 v0, 0x0

    return v0

    .line 404
    :cond_3
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v0, v3}, Ljava/util/Map;->remove(Ljava/lang/Object;)Ljava/lang/Object;

    .line 405
    const/4 v0, 0x1

    return v0
.end method

.method private declared-synchronized expire()V
    .locals 9

    monitor-enter p0

    .line 216
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v0}, Ljava/util/Map;->entrySet()Ljava/util/Set;

    move-result-object v0

    invoke-interface {v0}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object v0

    .line 217
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v1

    .line 218
    :goto_0
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v3

    if-eqz v3, :cond_1

    .line 219
    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/util/Map$Entry;

    .line 220
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

    .line 221
    :cond_0
    invoke-interface {v3}, Ljava/util/Map$Entry;->getKey()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/lang/String;

    .line 222
    invoke-interface {v0}, Ljava/util/Iterator;->remove()V

    .line 223
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

    .line 224
    goto :goto_0

    .line 225
    :cond_1
    monitor-exit p0

    return-void

    .line 215
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method private imageBytes()J
    .locals 8

    .line 383
    nop

    .line 384
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v0}, Ljava/util/Map;->values()Ljava/util/Collection;

    move-result-object v0

    invoke-interface {v0}, Ljava/util/Collection;->iterator()Ljava/util/Iterator;

    move-result-object v0

    const-wide/16 v1, 0x0

    :goto_0
    invoke-interface {v0}, Ljava/util/Iterator;->hasNext()Z

    move-result v3

    if-eqz v3, :cond_2

    invoke-interface {v0}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ltt/xinjian/cn/LanTransport$Incoming;

    .line 385
    iget-object v3, v3, Ltt/xinjian/cn/LanTransport$Incoming;->parts:[[B

    array-length v4, v3

    const/4 v5, 0x0

    :goto_1
    if-ge v5, v4, :cond_1

    aget-object v6, v3, v5

    if-eqz v6, :cond_0

    array-length v6, v6

    int-to-long v6, v6

    add-long/2addr v1, v6

    :cond_0
    add-int/lit8 v5, v5, 0x1

    goto :goto_1

    .line 386
    :cond_1
    goto :goto_0

    .line 387
    :cond_2
    return-wide v1
.end method

.method private introduction(Ljava/lang/String;)Lorg/json/JSONObject;
    .locals 8

    .line 191
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

    .line 173
    invoke-static {p0, p1}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object p0

    return-object p0
.end method

.method private static local(Ljava/net/InetAddress;)Z
    .locals 1

    .line 162
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

    .line 201
    const-string v0, "nick"

    invoke-virtual {p0, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p0

    .line 202
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

    .line 177
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    .line 179
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

    .line 182
    :cond_0
    nop

    .line 183
    return-object v0

    .line 180
    :catch_0
    move-exception p0

    .line 181
    new-instance v0, Ljava/lang/IllegalArgumentException;

    invoke-direct {v0, p0}, Ljava/lang/IllegalArgumentException;-><init>(Ljava/lang/Throwable;)V

    throw v0
.end method

.method private declared-synchronized observe(Lorg/json/JSONObject;Ljava/net/InetAddress;)V
    .locals 4

    monitor-enter p0

    .line 206
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

    .line 207
    :cond_0
    const-string v0, "id"

    invoke-virtual {p1, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 208
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v1, v0}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ltt/xinjian/cn/LanTransport$Peer;

    .line 209
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

    .line 210
    :cond_1
    :try_start_1
    new-instance v2, Ltt/xinjian/cn/LanTransport$Peer;

    invoke-static {p1}, Ltt/xinjian/cn/LanTransport;->nickname(Lorg/json/JSONObject;)Ljava/lang/String;

    move-result-object p1

    invoke-direct {v2, p2, p1}, Ltt/xinjian/cn/LanTransport$Peer;-><init>(Ljava/net/InetAddress;Ljava/lang/String;)V

    .line 211
    iget-object p1, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {p1, v0, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 212
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

    .line 213
    :cond_3
    monitor-exit p0

    return-void

    .line 206
    :cond_4
    :goto_0
    monitor-exit p0

    return-void

    .line 205
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

    .line 172
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

.method private prune()V
    .locals 8

    .line 410
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v0

    .line 411
    iget-object v2, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v2}, Ljava/util/Map;->entrySet()Ljava/util/Set;

    move-result-object v2

    invoke-interface {v2}, Ljava/util/Set;->iterator()Ljava/util/Iterator;

    move-result-object v2

    .line 412
    :cond_0
    :goto_0
    invoke-interface {v2}, Ljava/util/Iterator;->hasNext()Z

    move-result v3

    if-eqz v3, :cond_1

    .line 413
    invoke-interface {v2}, Ljava/util/Iterator;->next()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ljava/util/Map$Entry;

    invoke-interface {v3}, Ljava/util/Map$Entry;->getValue()Ljava/lang/Object;

    move-result-object v3

    check-cast v3, Ltt/xinjian/cn/LanTransport$Incoming;

    iget-wide v3, v3, Ltt/xinjian/cn/LanTransport$Incoming;->started:J

    sub-long v3, v0, v3

    const-wide/16 v5, 0x7530

    cmp-long v7, v3, v5

    if-lez v7, :cond_0

    invoke-interface {v2}, Ljava/util/Iterator;->remove()V

    goto :goto_0

    .line 415
    :cond_1
    return-void
.end method

.method private static readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;
    .locals 11
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;,
            Lorg/json/JSONException;
        }
    .end annotation

    .line 284
    new-instance v0, Ljava/io/ByteArrayOutputStream;

    const/16 v1, 0x200

    invoke-direct {v0, v1}, Ljava/io/ByteArrayOutputStream;-><init>(I)V

    .line 285
    const-wide/16 v1, 0x0

    move-wide v3, v1

    .line 287
    :goto_0
    invoke-virtual {p0}, Ljava/io/InputStream;->read()I

    move-result v5

    const/4 v6, -0x1

    if-eq v5, v6, :cond_4

    .line 288
    const/16 v6, 0xa

    if-ne v5, v6, :cond_0

    new-instance p0, Lorg/json/JSONObject;

    const-string v1, "UTF-8"

    invoke-virtual {v0, v1}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, v0}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V

    return-object p0

    .line 289
    :cond_0
    invoke-virtual {v0}, Ljava/io/ByteArrayOutputStream;->size()I

    move-result v6

    const/16 v7, 0x4000

    if-ge v6, v7, :cond_3

    .line 290
    cmp-long v6, v3, v1

    if-nez v6, :cond_1

    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v3

    goto :goto_1

    .line 291
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

    .line 294
    :goto_1
    invoke-virtual {v0, v5}, Ljava/io/ByteArrayOutputStream;->write(I)V

    goto :goto_0

    .line 292
    :cond_2
    new-instance p0, Ljava/io/IOException;

    const-string v0, "LAN frame timed out"

    invoke-direct {p0, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 289
    :cond_3
    new-instance p0, Ljava/io/IOException;

    const-string v0, "LAN frame too long"

    invoke-direct {p0, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 296
    :cond_4
    const/4 p0, 0x0

    return-object p0
.end method

.method private receive(Ljava/net/Socket;)V
    .locals 5

    .line 304
    const-string v0, "hello"

    .line 305
    const/16 v1, 0xdac

    :try_start_0
    invoke-virtual {p1, v1}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 306
    new-instance v1, Ljava/io/BufferedInputStream;

    invoke-virtual {p1}, Ljava/net/Socket;->getInputStream()Ljava/io/InputStream;

    move-result-object v2

    invoke-direct {v1, v2}, Ljava/io/BufferedInputStream;-><init>(Ljava/io/InputStream;)V

    .line 307
    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v2

    .line 308
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

    .line 309
    :cond_0
    const-string v3, "id"

    invoke-virtual {v2, v3}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 310
    invoke-virtual {p1}, Ljava/net/Socket;->getInetAddress()Ljava/net/InetAddress;

    move-result-object v4

    invoke-direct {p0, v2, v4}, Ltt/xinjian/cn/LanTransport;->observe(Lorg/json/JSONObject;Ljava/net/InetAddress;)V

    .line 311
    invoke-direct {p0, v0}, Ltt/xinjian/cn/LanTransport;->introduction(Ljava/lang/String;)Lorg/json/JSONObject;

    move-result-object v0

    invoke-static {p1, v0}, Ltt/xinjian/cn/LanTransport;->writeFrame(Ljava/net/Socket;Lorg/json/JSONObject;)V

    .line 312
    const/16 v0, 0x2ee0

    invoke-virtual {p1, v0}, Ljava/net/Socket;->setSoTimeout(I)V

    .line 314
    :goto_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    if-eqz v0, :cond_1

    invoke-static {v1}, Ltt/xinjian/cn/LanTransport;->readFrame(Ljava/io/InputStream;)Lorg/json/JSONObject;

    move-result-object v0

    if-eqz v0, :cond_1

    .line 315
    invoke-direct {p0, p1, v2, v3, v0}, Ltt/xinjian/cn/LanTransport;->acceptMessage(Ljava/net/Socket;Lorg/json/JSONObject;Ljava/lang/String;Lorg/json/JSONObject;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    goto :goto_0

    .line 317
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

    .line 319
    :cond_3
    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 308
    return-void

    .line 304
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

    .line 319
    :catchall_2
    move-exception v0

    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 320
    throw v0

    .line 317
    :catch_0
    move-exception v0

    goto :goto_3

    :catch_1
    move-exception v0

    .line 319
    :cond_5
    :goto_3
    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->untrack(Ljava/net/Socket;)V

    .line 320
    nop

    .line 321
    return-void
.end method

.method private store([BLjava/lang/String;)Ljava/lang/String;
    .locals 3

    .line 419
    array-length v0, p1

    const/4 v1, 0x1

    const/4 v2, 0x0

    if-lt v0, v1, :cond_3

    array-length v0, p1

    const/high16 v1, 0x200000

    if-le v0, v1, :cond_0

    goto :goto_1

    .line 421
    :cond_0
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->media:Ljava/io/File;

    if-nez v0, :cond_1

    return-object v2

    .line 422
    :cond_1
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->media:Ljava/io/File;

    invoke-virtual {v0}, Ljava/io/File;->isDirectory()Z

    move-result v0

    if-nez v0, :cond_2

    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->media:Ljava/io/File;

    invoke-virtual {v0}, Ljava/io/File;->mkdirs()Z

    move-result v0

    if-nez v0, :cond_2

    return-object v2

    .line 423
    :cond_2
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "xj-"

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    const-string v0, ".jpg"

    invoke-virtual {p2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p2

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p2

    .line 424
    new-instance v0, Ljava/io/File;

    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->media:Ljava/io/File;

    invoke-direct {v0, v1, p2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 425
    new-instance v1, Ljava/io/FileOutputStream;

    invoke-direct {v1, v0}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    .line 426
    :try_start_1
    invoke-virtual {v1, p1}, Ljava/io/FileOutputStream;->write([B)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 427
    :try_start_2
    invoke-virtual {v1}, Ljava/io/FileOutputStream;->close()V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_0

    .line 428
    return-object p2

    .line 425
    :catchall_0
    move-exception p1

    :try_start_3
    invoke-virtual {v1}, Ljava/io/FileOutputStream;->close()V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    goto :goto_0

    :catchall_1
    move-exception p2

    :try_start_4
    invoke-virtual {p1, p2}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :goto_0
    throw p1
    :try_end_4
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_0

    .line 429
    :catch_0
    move-exception p1

    .line 430
    return-object v2

    .line 419
    :cond_3
    :goto_1
    return-object v2
.end method

.method private static thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;
    .locals 1

    .line 166
    new-instance v0, Ljava/lang/Thread;

    invoke-direct {v0, p1, p0}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;Ljava/lang/String;)V

    .line 167
    const/4 p0, 0x1

    invoke-virtual {v0, p0}, Ljava/lang/Thread;->setDaemon(Z)V

    .line 168
    return-object v0
.end method

.method private declared-synchronized track(Ljava/net/Socket;)Z
    .locals 1

    monitor-enter p0

    .line 257
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-nez v0, :cond_0

    monitor-exit p0

    const/4 p1, 0x0

    return p1

    .line 258
    :cond_0
    :try_start_1
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-interface {v0, p1}, Ljava/util/Set;->add(Ljava/lang/Object;)Z
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 259
    monitor-exit p0

    const/4 p1, 0x1

    return p1

    .line 256
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

    .line 263
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-interface {v0, p1}, Ljava/util/Set;->remove(Ljava/lang/Object;)Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 264
    monitor-exit p0

    return-void

    .line 262
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

    .line 154
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

    .line 158
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

    .line 195
    const-string v0, "id"

    invoke-virtual {p1, v0}, Lorg/json/JSONObject;->optString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    .line 196
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

    .line 197
    const-string v0, "tcp"

    const v2, 0xb2de

    invoke-virtual {p1, v0, v2}, Lorg/json/JSONObject;->optInt(Ljava/lang/String;I)I

    move-result p1

    if-ne p1, v2, :cond_0

    goto :goto_0

    :cond_0
    const/4 v1, 0x0

    .line 196
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

    .line 300
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

    .line 301
    return-void
.end method


# virtual methods
.method public declared-synchronized close()V
    .locals 2

    monitor-enter p0

    .line 532
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    if-nez v0, :cond_0

    monitor-exit p0

    return-void

    .line 533
    :cond_0
    const/4 v0, 0x0

    :try_start_1
    iput-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    .line 534
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->discovery:Ljava/net/DatagramSocket;

    invoke-virtual {v0}, Ljava/net/DatagramSocket;->close()V

    .line 535
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->server:Ljava/net/ServerSocket;

    invoke-static {v0}, Ltt/xinjian/cn/LanTransport;->closeQuietly(Ljava/io/Closeable;)V

    .line 536
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    if-eqz v0, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    invoke-virtual {v0}, Ljava/lang/Thread;->interrupt()V

    .line 537
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

    .line 538
    :cond_2
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->sockets:Ljava/util/Set;

    invoke-interface {v0}, Ljava/util/Set;->clear()V

    .line 539
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v0}, Ljava/util/Map;->clear()V

    .line 540
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    monitor-enter v0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    :try_start_2
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport;->images:Ljava/util/Map;

    invoke-interface {v1}, Ljava/util/Map;->clear()V

    monitor-exit v0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 541
    :try_start_3
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->receivers:Ljava/util/concurrent/ThreadPoolExecutor;

    invoke-virtual {v0}, Ljava/util/concurrent/ThreadPoolExecutor;->shutdownNow()Ljava/util/List;

    .line 542
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->senders:Ljava/util/concurrent/ThreadPoolExecutor;

    invoke-virtual {v0}, Ljava/util/concurrent/ThreadPoolExecutor;->shutdownNow()Ljava/util/List;
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    .line 543
    monitor-exit p0

    return-void

    .line 540
    :catchall_0
    move-exception v1

    :try_start_4
    monitor-exit v0
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_0

    :try_start_5
    throw v1

    .line 531
    :catchall_1
    move-exception v0

    monitor-exit p0
    :try_end_5
    .catchall {:try_start_5 .. :try_end_5} :catchall_1

    throw v0
.end method

.method synthetic lambda$accept$1$tt-xinjian-cn-LanTransport(Ljava/net/Socket;)V
    .locals 0

    .line 275
    invoke-direct {p0, p1}, Ltt/xinjian/cn/LanTransport;->receive(Ljava/net/Socket;)V

    return-void
.end method

.method synthetic lambda$send$3$tt-xinjian-cn-LanTransport(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 0

    .line 493
    invoke-direct {p0, p1, p2, p3, p4}, Ltt/xinjian/cn/LanTransport;->deliver(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V

    return-void
.end method

.method synthetic lambda$sendImage$2$tt-xinjian-cn-LanTransport(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;I)V
    .locals 0

    .line 441
    invoke-direct/range {p0 .. p8}, Ltt/xinjian/cn/LanTransport;->deliverImage(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;I)V

    return-void
.end method

.method declared-synchronized send(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 9

    monitor-enter p0

    .line 489
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    invoke-interface {v0, p1}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    move-object v3, v0

    check-cast v3, Ltt/xinjian/cn/LanTransport$Peer;

    .line 490
    iget-boolean v0, p0, Ltt/xinjian/cn/LanTransport;->open:Z

    const/4 v7, 0x0

    if-eqz v0, :cond_1

    if-eqz v3, :cond_1

    invoke-static {p2}, Ltt/xinjian/cn/LanTransport;->validMid(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_1

    if-eqz p3, :cond_1

    .line 491
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

    .line 493
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

    .line 494
    monitor-exit p0

    const/4 p1, 0x1

    return p1

    .line 495
    :catch_0
    move-exception p1

    .line 496
    monitor-exit p0

    return v7

    .line 491
    :cond_1
    :goto_0
    monitor-exit p0

    return v7

    .line 488
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1
.end method

.method declared-synchronized sendImage(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;)Z
    .locals 15

    move-object v11, p0

    monitor-enter p0

    .line 435
    :try_start_0
    iget-object v0, v11, Ltt/xinjian/cn/LanTransport;->peers:Ljava/util/Map;

    move-object/from16 v4, p1

    invoke-interface {v0, v4}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object v0

    move-object v3, v0

    check-cast v3, Ltt/xinjian/cn/LanTransport$Peer;

    .line 436
    iget-boolean v0, v11, Ltt/xinjian/cn/LanTransport;->open:Z

    const/4 v12, 0x0

    if-eqz v0, :cond_4

    if-eqz v3, :cond_4

    invoke-static/range {p2 .. p2}, Ltt/xinjian/cn/LanTransport;->validMid(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_4

    if-eqz p6, :cond_4

    invoke-virtual/range {p6 .. p6}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-eqz v0, :cond_0

    goto :goto_1

    .line 437
    :cond_0
    invoke-virtual/range {p6 .. p6}, Ljava/lang/String;->length()I

    move-result v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    int-to-long v0, v0

    const-wide/32 v5, 0x284880

    cmp-long v2, v0, v5

    if-lez v2, :cond_1

    monitor-exit p0

    return v12

    .line 438
    :cond_1
    :try_start_1
    invoke-virtual/range {p6 .. p6}, Ljava/lang/String;->length()I

    move-result v0

    add-int/lit16 v0, v0, 0x2ee0

    const/4 v13, 0x1

    sub-int/2addr v0, v13

    div-int/lit16 v10, v0, 0x2ee0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 439
    if-lt v10, v13, :cond_3

    const/16 v0, 0xdc

    if-le v10, v0, :cond_2

    goto :goto_0

    .line 441
    :cond_2
    :try_start_2
    iget-object v0, v11, Ltt/xinjian/cn/LanTransport;->senders:Ljava/util/concurrent/ThreadPoolExecutor;

    new-instance v14, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;

    move-object v1, v14

    move-object v2, p0

    move-object/from16 v4, p1

    move-object/from16 v5, p2

    move-object/from16 v6, p3

    move/from16 v7, p4

    move/from16 v8, p5

    move-object/from16 v9, p6

    invoke-direct/range {v1 .. v10}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;-><init>(Ltt/xinjian/cn/LanTransport;Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;I)V

    invoke-virtual {v0, v14}, Ljava/util/concurrent/ThreadPoolExecutor;->execute(Ljava/lang/Runnable;)V
    :try_end_2
    .catch Ljava/util/concurrent/RejectedExecutionException; {:try_start_2 .. :try_end_2} :catch_0
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 442
    monitor-exit p0

    return v13

    .line 443
    :catch_0
    move-exception v0

    .line 444
    monitor-exit p0

    return v12

    .line 439
    :cond_3
    :goto_0
    monitor-exit p0

    return v12

    .line 436
    :cond_4
    :goto_1
    monitor-exit p0

    return v12

    .line 434
    :catchall_0
    move-exception v0

    :try_start_3
    monitor-exit p0
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    throw v0
.end method

.method start()V
    .locals 2

    .line 147
    new-instance v0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda4;

    invoke-direct {v0, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda4;-><init>(Ltt/xinjian/cn/LanTransport;)V

    const-string v1, "xj-lan-discover"

    invoke-static {v1, v0}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 148
    new-instance v0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda5;

    invoke-direct {v0, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda5;-><init>(Ltt/xinjian/cn/LanTransport;)V

    const-string v1, "xj-lan-accept"

    invoke-static {v1, v0}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 149
    new-instance v0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda6;

    invoke-direct {v0, p0}, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda6;-><init>(Ltt/xinjian/cn/LanTransport;)V

    const-string v1, "xj-lan-announce"

    invoke-static {v1, v0}, Ltt/xinjian/cn/LanTransport;->thread(Ljava/lang/String;Ljava/lang/Runnable;)Ljava/lang/Thread;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    .line 150
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport;->announcements:Ljava/lang/Thread;

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V

    .line 151
    return-void
.end method
