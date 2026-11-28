.class public final Ltt/xinjian/cn/UpdateBridge;
.super Ljava/lang/Object;
.source "UpdateBridge.java"


# instance fields
.field private final activity:Landroid/app/Activity;

.field private busy:Z

.field private volatile closed:Z

.field private final installed:Landroid/content/pm/PackageInfo;

.field private ready:Z

.field private release:Ltt/xinjian/cn/UpdateRelease;

.field private volatile state:Ljava/lang/String;

.field private final web:Landroid/webkit/WebView;

.field private final worker:Ljava/util/concurrent/ExecutorService;


# direct methods
.method public constructor <init>(Landroid/app/Activity;Landroid/webkit/WebView;)V
    .locals 1

    .line 46
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 38
    invoke-static {}, Ljava/util/concurrent/Executors;->newSingleThreadExecutor()Ljava/util/concurrent/ExecutorService;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->worker:Ljava/util/concurrent/ExecutorService;

    .line 47
    iput-object p1, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    .line 48
    iput-object p2, p0, Ltt/xinjian/cn/UpdateBridge;->web:Landroid/webkit/WebView;

    .line 50
    :try_start_0
    invoke-virtual {p1}, Landroid/app/Activity;->getPackageManager()Landroid/content/pm/PackageManager;

    move-result-object p2

    invoke-virtual {p1}, Landroid/app/Activity;->getPackageName()Ljava/lang/String;

    move-result-object p1

    invoke-static {}, Ltt/xinjian/cn/UpdateBridge;->signerFlags()I

    move-result v0

    invoke-virtual {p2, p1, v0}, Landroid/content/pm/PackageManager;->getPackageInfo(Ljava/lang/String;I)Landroid/content/pm/PackageInfo;

    move-result-object p1

    iput-object p1, p0, Ltt/xinjian/cn/UpdateBridge;->installed:Landroid/content/pm/PackageInfo;
    :try_end_0
    .catch Landroid/content/pm/PackageManager$NameNotFoundException; {:try_start_0 .. :try_end_0} :catch_0

    .line 53
    nop

    .line 54
    const/4 p1, 0x0

    const-string p2, ""

    const-string v0, "idle"

    invoke-direct {p0, v0, p1, p2}, Ltt/xinjian/cn/UpdateBridge;->status(Ljava/lang/String;ILjava/lang/String;)Lorg/json/JSONObject;

    move-result-object p1

    invoke-virtual {p1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p1

    iput-object p1, p0, Ltt/xinjian/cn/UpdateBridge;->state:Ljava/lang/String;

    .line 55
    return-void

    .line 51
    :catch_0
    move-exception p1

    .line 52
    new-instance p2, Ljava/lang/IllegalStateException;

    const-string v0, "Cannot read the installed version"

    invoke-direct {p2, v0, p1}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;Ljava/lang/Throwable;)V

    throw p2
.end method

.method private begin(Ljava/lang/String;I)Z
    .locals 2

    .line 147
    iget-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    if-nez v0, :cond_1

    iget-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->busy:Z

    if-eqz v0, :cond_0

    goto :goto_0

    .line 148
    :cond_0
    const/4 v0, 0x1

    iput-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->busy:Z

    .line 149
    const-string v1, ""

    invoke-direct {p0, p1, p2, v1}, Ltt/xinjian/cn/UpdateBridge;->publish(Ljava/lang/String;ILjava/lang/String;)V

    .line 150
    return v0

    .line 147
    :cond_1
    :goto_0
    const/4 p1, 0x0

    return p1
.end method

.method private downloadVerified(Ltt/xinjian/cn/UpdateRelease;)V
    .locals 18
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 231
    move-object/from16 v1, p0

    move-object/from16 v0, p1

    iget-object v2, v1, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-static {v2, v0}, Ltt/xinjian/cn/UpdateApkProvider;->apk(Landroid/content/Context;Ltt/xinjian/cn/UpdateRelease;)Ljava/io/File;

    move-result-object v2

    .line 232
    invoke-virtual {v2}, Ljava/io/File;->getParentFile()Ljava/io/File;

    move-result-object v3

    .line 233
    invoke-virtual {v3}, Ljava/io/File;->isDirectory()Z

    move-result v4

    if-nez v4, :cond_1

    invoke-virtual {v3}, Ljava/io/File;->mkdirs()Z

    move-result v4

    if-eqz v4, :cond_0

    goto :goto_0

    :cond_0
    new-instance v0, Ljava/io/IOException;

    const-string v2, "\u65e0\u6cd5\u521b\u5efa\u4e0b\u8f7d\u76ee\u5f55"

    invoke-direct {v0, v2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 234
    :cond_1
    :goto_0
    const-string v4, "download-"

    const-string v5, ".apk"

    invoke-static {v4, v5, v3}, Ljava/io/File;->createTempFile(Ljava/lang/String;Ljava/lang/String;Ljava/io/File;)Ljava/io/File;

    move-result-object v3

    .line 236
    :try_start_0
    invoke-static {}, Ltt/xinjian/cn/UpdateBridge;->newDigest()Ljava/security/MessageDigest;

    move-result-object v4

    .line 237
    iget-object v5, v0, Ltt/xinjian/cn/UpdateRelease;->url:Ljava/lang/String;

    const-string v6, "application/octet-stream"

    invoke-static {v5, v6}, Ltt/xinjian/cn/UpdateBridge;->open(Ljava/lang/String;Ljava/lang/String;)Ljava/net/HttpURLConnection;

    move-result-object v5
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_5

    .line 238
    nop

    .line 239
    nop

    .line 240
    :try_start_1
    invoke-virtual {v5}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;

    move-result-object v6
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_4

    :try_start_2
    new-instance v7, Ljava/io/FileOutputStream;

    invoke-direct {v7, v3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_2

    .line 241
    const/16 v8, 0x4000

    :try_start_3
    new-array v8, v8, [B

    const/4 v9, 0x0

    const-wide/16 v10, 0x0

    const/4 v12, 0x0

    .line 243
    :goto_1
    invoke-virtual {v6, v8}, Ljava/io/InputStream;->read([B)I

    move-result v13

    const/4 v14, -0x1

    if-eq v13, v14, :cond_5

    .line 244
    iget-boolean v14, v1, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    if-nez v14, :cond_4

    .line 245
    int-to-long v14, v13

    add-long/2addr v10, v14

    .line 246
    iget-wide v14, v0, Ltt/xinjian/cn/UpdateRelease;->bytes:J

    cmp-long v16, v10, v14

    if-gtz v16, :cond_3

    .line 247
    invoke-virtual {v7, v8, v9, v13}, Ljava/io/FileOutputStream;->write([BII)V

    .line 248
    invoke-virtual {v4, v8, v9, v13}, Ljava/security/MessageDigest;->update([BII)V

    .line 249
    const-wide/16 v13, 0x64

    mul-long v13, v13, v10

    move-wide/from16 v16, v10

    iget-wide v9, v0, Ltt/xinjian/cn/UpdateRelease;->bytes:J

    div-long/2addr v13, v9

    long-to-int v9, v13

    .line 250
    if-eq v9, v12, :cond_2

    .line 251
    nop

    .line 252
    const-string v10, "downloading"

    const-string v11, ""

    invoke-direct {v1, v10, v9, v11}, Ltt/xinjian/cn/UpdateBridge;->publish(Ljava/lang/String;ILjava/lang/String;)V

    move v12, v9

    .line 254
    :cond_2
    move-wide/from16 v10, v16

    const/4 v9, 0x0

    goto :goto_1

    .line 246
    :cond_3
    new-instance v0, Ljava/io/IOException;

    const-string v2, "\u5b89\u88c5\u5305\u5927\u5c0f\u4e0e\u53d1\u5e03\u4fe1\u606f\u4e0d\u7b26"

    invoke-direct {v0, v2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 244
    :cond_4
    new-instance v0, Ljava/io/IOException;

    const-string v2, "\u4e0b\u8f7d\u5df2\u505c\u6b62"

    invoke-direct {v0, v2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    .line 255
    :cond_5
    :try_start_4
    invoke-virtual {v7}, Ljava/io/FileOutputStream;->close()V
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_2

    if-eqz v6, :cond_6

    :try_start_5
    invoke-virtual {v6}, Ljava/io/InputStream;->close()V
    :try_end_5
    .catchall {:try_start_5 .. :try_end_5} :catchall_4

    .line 256
    :cond_6
    :try_start_6
    invoke-virtual {v5}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 257
    nop

    .line 258
    iget-wide v5, v0, Ltt/xinjian/cn/UpdateRelease;->bytes:J

    cmp-long v7, v10, v5

    if-nez v7, :cond_9

    iget-object v5, v0, Ltt/xinjian/cn/UpdateRelease;->sha256:Ljava/lang/String;

    invoke-virtual {v4}, Ljava/security/MessageDigest;->digest()[B

    move-result-object v4

    invoke-static {v4}, Ltt/xinjian/cn/UpdateBridge;->hex([B)Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v5, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v4

    if-eqz v4, :cond_9

    .line 261
    invoke-direct {v1, v3, v0}, Ltt/xinjian/cn/UpdateBridge;->verifyPackage(Ljava/io/File;Ltt/xinjian/cn/UpdateRelease;)V

    .line 262
    iget-boolean v0, v1, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    if-nez v0, :cond_8

    invoke-virtual {v3, v2}, Ljava/io/File;->renameTo(Ljava/io/File;)Z

    move-result v0
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_5

    if-eqz v0, :cond_8

    .line 264
    invoke-virtual {v3}, Ljava/io/File;->exists()Z

    move-result v0

    if-eqz v0, :cond_7

    invoke-virtual {v3}, Ljava/io/File;->delete()Z

    .line 266
    :cond_7
    return-void

    .line 262
    :cond_8
    :try_start_7
    new-instance v0, Ljava/io/IOException;

    const-string v2, "\u65e0\u6cd5\u4fdd\u5b58\u5df2\u6821\u9a8c\u7684\u5b89\u88c5\u5305"

    invoke-direct {v0, v2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0

    .line 259
    :cond_9
    new-instance v0, Ljava/io/IOException;

    const-string v2, "\u5b89\u88c5\u5305\u6821\u9a8c\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5"

    invoke-direct {v0, v2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v0
    :try_end_7
    .catchall {:try_start_7 .. :try_end_7} :catchall_5

    .line 240
    :catchall_0
    move-exception v0

    move-object v2, v0

    :try_start_8
    invoke-virtual {v7}, Ljava/io/FileOutputStream;->close()V
    :try_end_8
    .catchall {:try_start_8 .. :try_end_8} :catchall_1

    goto :goto_2

    :catchall_1
    move-exception v0

    move-object v4, v0

    :try_start_9
    invoke-virtual {v2, v4}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :goto_2
    throw v2
    :try_end_9
    .catchall {:try_start_9 .. :try_end_9} :catchall_2

    :catchall_2
    move-exception v0

    move-object v2, v0

    if-eqz v6, :cond_a

    :try_start_a
    invoke-virtual {v6}, Ljava/io/InputStream;->close()V
    :try_end_a
    .catchall {:try_start_a .. :try_end_a} :catchall_3

    goto :goto_3

    :catchall_3
    move-exception v0

    move-object v4, v0

    :try_start_b
    invoke-virtual {v2, v4}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :cond_a
    :goto_3
    throw v2
    :try_end_b
    .catchall {:try_start_b .. :try_end_b} :catchall_4

    .line 256
    :catchall_4
    move-exception v0

    :try_start_c
    invoke-virtual {v5}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 257
    throw v0
    :try_end_c
    .catchall {:try_start_c .. :try_end_c} :catchall_5

    .line 264
    :catchall_5
    move-exception v0

    invoke-virtual {v3}, Ljava/io/File;->exists()Z

    move-result v2

    if-eqz v2, :cond_b

    invoke-virtual {v3}, Ljava/io/File;->delete()Z

    .line 265
    :cond_b
    throw v0
.end method

.method private static fetchLatest()Lorg/json/JSONObject;
    .locals 7
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;,
            Lorg/json/JSONException;
        }
    .end annotation

    .line 215
    const-string v0, "https://api.github.com/repos/qihui068-a11y/xinjian-run/releases/latest"

    const-string v1, "application/vnd.github+json"

    invoke-static {v0, v1}, Ltt/xinjian/cn/UpdateBridge;->open(Ljava/lang/String;Ljava/lang/String;)Ljava/net/HttpURLConnection;

    move-result-object v0

    .line 216
    :try_start_0
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->getInputStream()Ljava/io/InputStream;

    move-result-object v1
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_2

    .line 217
    :try_start_1
    new-instance v2, Ljava/io/ByteArrayOutputStream;

    invoke-direct {v2}, Ljava/io/ByteArrayOutputStream;-><init>()V

    .line 218
    const/16 v3, 0x2000

    new-array v3, v3, [B

    .line 220
    :goto_0
    invoke-virtual {v1, v3}, Ljava/io/InputStream;->read([B)I

    move-result v4

    const/4 v5, -0x1

    if-eq v4, v5, :cond_1

    .line 221
    invoke-virtual {v2}, Ljava/io/ByteArrayOutputStream;->size()I

    move-result v5

    add-int/2addr v5, v4

    const/high16 v6, 0x80000

    if-gt v5, v6, :cond_0

    .line 222
    const/4 v5, 0x0

    invoke-virtual {v2, v3, v5, v4}, Ljava/io/ByteArrayOutputStream;->write([BII)V

    goto :goto_0

    .line 221
    :cond_0
    new-instance v2, Ljava/io/IOException;

    const-string v3, "\u7248\u672c\u4fe1\u606f\u8fc7\u957f"

    invoke-direct {v2, v3}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw v2

    .line 224
    :cond_1
    new-instance v3, Lorg/json/JSONObject;

    sget-object v4, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {v4}, Ljava/nio/charset/Charset;->name()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v2, v4}, Ljava/io/ByteArrayOutputStream;->toString(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    invoke-direct {v3, v2}, Lorg/json/JSONObject;-><init>(Ljava/lang/String;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 225
    if-eqz v1, :cond_2

    :try_start_2
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_2

    .line 226
    :cond_2
    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 224
    return-object v3

    .line 216
    :catchall_0
    move-exception v2

    if-eqz v1, :cond_3

    :try_start_3
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    goto :goto_1

    :catchall_1
    move-exception v1

    :try_start_4
    invoke-virtual {v2, v1}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :cond_3
    :goto_1
    throw v2
    :try_end_4
    .catchall {:try_start_4 .. :try_end_4} :catchall_2

    .line 226
    :catchall_2
    move-exception v1

    invoke-virtual {v0}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 227
    throw v1
.end method

.method private declared-synchronized finish(Ljava/lang/String;ILjava/lang/String;)V
    .locals 1

    monitor-enter p0

    .line 154
    const/4 v0, 0x0

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->busy:Z

    .line 155
    invoke-direct {p0, p1, p2, p3}, Ltt/xinjian/cn/UpdateBridge;->publish(Ljava/lang/String;ILjava/lang/String;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 156
    monitor-exit p0

    return-void

    .line 153
    :catchall_0
    move-exception p1

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw p1
.end method

.method private static hex([B)Ljava/lang/String;
    .locals 6

    .line 319
    new-instance v0, Ljava/lang/StringBuilder;

    array-length v1, p0

    mul-int/lit8 v1, v1, 0x2

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(I)V

    .line 320
    array-length v1, p0

    const/4 v2, 0x0

    :goto_0
    if-ge v2, v1, :cond_0

    aget-byte v3, p0, v2

    .line 321
    shr-int/lit8 v4, v3, 0x4

    and-int/lit8 v4, v4, 0xf

    const/16 v5, 0x10

    invoke-static {v4, v5}, Ljava/lang/Character;->forDigit(II)C

    move-result v4

    invoke-virtual {v0, v4}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    move-result-object v4

    and-int/lit8 v3, v3, 0xf

    invoke-static {v3, v5}, Ljava/lang/Character;->forDigit(II)C

    move-result v3

    invoke-virtual {v4, v3}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    .line 320
    add-int/lit8 v2, v2, 0x1

    goto :goto_0

    .line 323
    :cond_0
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method

.method private static message(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;
    .locals 1

    .line 327
    invoke-virtual {p0}, Ljava/lang/Exception;->getMessage()Ljava/lang/String;

    move-result-object v0

    .line 328
    instance-of p0, p0, Ljava/io/IOException;

    if-eqz p0, :cond_0

    if-eqz v0, :cond_0

    const-string p0, "[\\u4e00-\\u9fffA-Za-z \uff0c]{1,70}"

    invoke-virtual {v0, p0}, Ljava/lang/String;->matches(Ljava/lang/String;)Z

    move-result p0

    if-eqz p0, :cond_0

    .line 329
    move-object p1, v0

    goto :goto_0

    :cond_0
    nop

    .line 328
    :goto_0
    return-object p1
.end method

.method private static newDigest()Ljava/security/MessageDigest;
    .locals 2

    .line 314
    :try_start_0
    const-string v0, "SHA-256"

    invoke-static {v0}, Ljava/security/MessageDigest;->getInstance(Ljava/lang/String;)Ljava/security/MessageDigest;

    move-result-object v0
    :try_end_0
    .catch Ljava/security/NoSuchAlgorithmException; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    .line 315
    :catch_0
    move-exception v0

    new-instance v1, Ljava/lang/IllegalStateException;

    invoke-direct {v1, v0}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/Throwable;)V

    throw v1
.end method

.method private static open(Ljava/lang/String;Ljava/lang/String;)Ljava/net/HttpURLConnection;
    .locals 6
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 177
    new-instance v0, Ljava/net/URL;

    invoke-direct {v0, p0}, Ljava/net/URL;-><init>(Ljava/lang/String;)V

    .line 178
    const/4 p0, 0x0

    const/4 v1, 0x0

    :goto_0
    const/4 v2, 0x5

    if-ge v1, v2, :cond_9

    .line 179
    invoke-virtual {v0}, Ljava/net/URL;->getHost()Ljava/lang/String;

    move-result-object v2

    .line 180
    const-string v3, "https"

    invoke-virtual {v0}, Ljava/net/URL;->getProtocol()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    const-string v4, "\u66f4\u65b0\u4e0b\u8f7d\u5730\u5740\u65e0\u6548"

    if-eqz v3, :cond_8

    invoke-virtual {v0}, Ljava/net/URL;->getUserInfo()Ljava/lang/String;

    move-result-object v3

    if-nez v3, :cond_8

    .line 181
    invoke-virtual {v0}, Ljava/net/URL;->getPort()I

    move-result v3

    const/4 v5, -0x1

    if-eq v3, v5, :cond_0

    invoke-virtual {v0}, Ljava/net/URL;->getPort()I

    move-result v3

    const/16 v5, 0x1bb

    if-ne v3, v5, :cond_8

    .line 182
    :cond_0
    const-string v3, "api.github.com"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-nez v3, :cond_1

    const-string v3, "github.com"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-nez v3, :cond_1

    .line 183
    const-string v3, "release-assets.githubusercontent.com"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v3

    if-nez v3, :cond_1

    const-string v3, "objects.githubusercontent.com"

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_8

    .line 186
    :cond_1
    invoke-virtual {v0}, Ljava/net/URL;->openConnection()Ljava/net/URLConnection;

    move-result-object v2

    check-cast v2, Ljava/net/HttpURLConnection;

    .line 187
    const/16 v3, 0x2ee0

    invoke-virtual {v2, v3}, Ljava/net/HttpURLConnection;->setConnectTimeout(I)V

    .line 188
    invoke-virtual {v2, v3}, Ljava/net/HttpURLConnection;->setReadTimeout(I)V

    .line 189
    invoke-virtual {v2, p0}, Ljava/net/HttpURLConnection;->setInstanceFollowRedirects(Z)V

    .line 190
    invoke-virtual {v2, p0}, Ljava/net/HttpURLConnection;->setUseCaches(Z)V

    .line 191
    const-string v3, "User-Agent"

    const-string v5, "XinJian-Run-Android"

    invoke-virtual {v2, v3, v5}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    .line 192
    const-string v3, "Accept"

    invoke-virtual {v2, v3, p1}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    .line 193
    const-string v3, "Accept-Encoding"

    const-string v5, "identity"

    invoke-virtual {v2, v3, v5}, Ljava/net/HttpURLConnection;->setRequestProperty(Ljava/lang/String;Ljava/lang/String;)V

    .line 195
    :try_start_0
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->getResponseCode()I

    move-result v3

    .line 196
    const/16 v5, 0xc8

    if-ne v3, v5, :cond_2

    return-object v2

    .line 197
    :cond_2
    const/16 v5, 0x12d

    if-eq v3, v5, :cond_6

    const/16 v5, 0x12e

    if-eq v3, v5, :cond_6

    const/16 v5, 0x12f

    if-eq v3, v5, :cond_6

    const/16 v5, 0x133

    if-eq v3, v5, :cond_6

    const/16 v5, 0x134

    if-ne v3, v5, :cond_3

    goto :goto_2

    .line 204
    :cond_3
    const/16 p0, 0x193

    if-eq v3, p0, :cond_5

    const/16 p0, 0x1ad

    if-ne v3, p0, :cond_4

    goto :goto_1

    .line 205
    :cond_4
    new-instance p0, Ljava/io/IOException;

    const-string p1, "\u66f4\u65b0\u670d\u52a1\u6682\u4e0d\u53ef\u7528"

    invoke-direct {p0, p1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 204
    :cond_5
    :goto_1
    new-instance p0, Ljava/io/IOException;

    const-string p1, "GitHub \u6682\u65f6\u9650\u5236\u4e86\u8bbf\u95ee\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"

    invoke-direct {p0, p1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 198
    :cond_6
    :goto_2
    const-string v3, "Location"

    invoke-virtual {v2, v3}, Ljava/net/HttpURLConnection;->getHeaderField(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 199
    if-eqz v3, :cond_7

    .line 200
    new-instance v4, Ljava/net/URL;

    invoke-direct {v4, v0, v3}, Ljava/net/URL;-><init>(Ljava/net/URL;Ljava/lang/String;)V

    .line 201
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 202
    nop

    .line 178
    add-int/lit8 v1, v1, 0x1

    move-object v0, v4

    goto/16 :goto_0

    .line 199
    :cond_7
    new-instance p0, Ljava/io/IOException;

    invoke-direct {p0, v4}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    .line 206
    :catch_0
    move-exception p0

    .line 207
    invoke-virtual {v2}, Ljava/net/HttpURLConnection;->disconnect()V

    .line 208
    throw p0

    .line 184
    :cond_8
    new-instance p0, Ljava/io/IOException;

    invoke-direct {p0, v4}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0

    .line 211
    :cond_9
    new-instance p0, Ljava/io/IOException;

    const-string p1, "\u66f4\u65b0\u4e0b\u8f7d\u5730\u5740\u8df3\u8f6c\u8fc7\u591a"

    invoke-direct {p0, p1}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p0
.end method

.method private openInstaller(Ltt/xinjian/cn/UpdateRelease;)V
    .locals 5

    .line 114
    iget-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    const/16 v1, 0x64

    const-string v2, "ready"

    if-nez v0, :cond_2

    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->isFinishing()Z

    move-result v0

    if-eqz v0, :cond_0

    goto/16 :goto_4

    .line 118
    :cond_0
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x1a

    if-lt v0, v3, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->getPackageManager()Landroid/content/pm/PackageManager;

    move-result-object v0

    invoke-virtual {v0}, Landroid/content/pm/PackageManager;->canRequestPackageInstalls()Z

    move-result v0

    if-nez v0, :cond_1

    .line 120
    :try_start_0
    new-instance p1, Landroid/content/Intent;

    const-string v0, "android.settings.MANAGE_UNKNOWN_APP_SOURCES"

    new-instance v3, Ljava/lang/StringBuilder;

    invoke-direct {v3}, Ljava/lang/StringBuilder;-><init>()V

    const-string v4, "package:"

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    iget-object v4, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    .line 121
    invoke-virtual {v4}, Landroid/app/Activity;->getPackageName()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v3, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v3

    invoke-virtual {v3}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v3

    invoke-static {v3}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v3

    invoke-direct {p1, v0, v3}, Landroid/content/Intent;-><init>(Ljava/lang/String;Landroid/net/Uri;)V

    .line 122
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-virtual {v0, p1}, Landroid/app/Activity;->startActivity(Landroid/content/Intent;)V

    .line 123
    const-string p1, "\u5141\u8bb8\u4fe1\u7b3a\u5b89\u88c5\u5e94\u7528\u540e\uff0c\u8fd4\u56de\u8fd9\u91cc\u518d\u70b9\u4e00\u6b21\u5b89\u88c5"

    invoke-direct {p0, v2, v1, p1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V
    :try_end_0
    .catch Landroid/content/ActivityNotFoundException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/SecurityException; {:try_start_0 .. :try_end_0} :catch_0

    .line 126
    goto :goto_1

    .line 124
    :catch_0
    move-exception p1

    goto :goto_0

    :catch_1
    move-exception p1

    .line 125
    :goto_0
    const-string p1, "\u7cfb\u7edf\u9650\u5236\u4e86\u5e94\u7528\u5185\u5b89\u88c5"

    invoke-direct {p0, v2, v1, p1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 127
    :goto_1
    return-void

    .line 130
    :cond_1
    :try_start_1
    new-instance v0, Landroid/content/Intent;

    const-string v3, "android.intent.action.VIEW"

    invoke-direct {v0, v3}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 132
    iget-object v3, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-static {v3, p1}, Ltt/xinjian/cn/UpdateApkProvider;->uri(Landroid/content/Context;Ltt/xinjian/cn/UpdateRelease;)Landroid/net/Uri;

    move-result-object p1

    const-string v3, "application/vnd.android.package-archive"

    invoke-virtual {v0, p1, v3}, Landroid/content/Intent;->setDataAndType(Landroid/net/Uri;Ljava/lang/String;)Landroid/content/Intent;

    .line 133
    const/4 p1, 0x1

    invoke-virtual {v0, p1}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    .line 134
    iget-object p1, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-virtual {p1, v0}, Landroid/app/Activity;->startActivity(Landroid/content/Intent;)V

    .line 135
    const-string p1, "\u8bf7\u5728\u7cfb\u7edf\u5b89\u88c5\u5668\u4e2d\u786e\u8ba4\u66f4\u65b0"

    invoke-direct {p0, v2, v1, p1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V
    :try_end_1
    .catch Landroid/content/ActivityNotFoundException; {:try_start_1 .. :try_end_1} :catch_3
    .catch Ljava/lang/SecurityException; {:try_start_1 .. :try_end_1} :catch_2

    .line 138
    goto :goto_3

    .line 136
    :catch_2
    move-exception p1

    goto :goto_2

    :catch_3
    move-exception p1

    .line 137
    :goto_2
    const-string p1, "\u65e0\u6cd5\u6253\u5f00\u7cfb\u7edf\u5b89\u88c5\u5668"

    invoke-direct {p0, v2, v1, p1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 139
    :goto_3
    return-void

    .line 115
    :cond_2
    :goto_4
    const-string p1, ""

    invoke-direct {p0, v2, v1, p1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 116
    return-void
.end method

.method private publish(Ljava/lang/String;ILjava/lang/String;)V
    .locals 1

    .line 168
    iget-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    if-eqz v0, :cond_0

    return-void

    .line 169
    :cond_0
    invoke-direct {p0, p1, p2, p3}, Ltt/xinjian/cn/UpdateBridge;->status(Ljava/lang/String;ILjava/lang/String;)Lorg/json/JSONObject;

    move-result-object p1

    invoke-virtual {p1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p1

    .line 170
    iput-object p1, p0, Ltt/xinjian/cn/UpdateBridge;->state:Ljava/lang/String;

    .line 171
    iget-object p2, p0, Ltt/xinjian/cn/UpdateBridge;->web:Landroid/webkit/WebView;

    new-instance p3, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;

    invoke-direct {p3, p0, p1}, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;-><init>(Ltt/xinjian/cn/UpdateBridge;Ljava/lang/String;)V

    invoke-virtual {p2, p3}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 174
    return-void
.end method

.method private static signatures(Landroid/content/pm/PackageInfo;)[Landroid/content/pm/Signature;
    .locals 2

    .line 304
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1c

    if-ge v0, v1, :cond_0

    iget-object p0, p0, Landroid/content/pm/PackageInfo;->signatures:[Landroid/content/pm/Signature;

    return-object p0

    .line 305
    :cond_0
    iget-object v0, p0, Landroid/content/pm/PackageInfo;->signingInfo:Landroid/content/pm/SigningInfo;

    if-nez v0, :cond_1

    const/4 p0, 0x0

    goto :goto_0

    :cond_1
    iget-object p0, p0, Landroid/content/pm/PackageInfo;->signingInfo:Landroid/content/pm/SigningInfo;

    invoke-virtual {p0}, Landroid/content/pm/SigningInfo;->getApkContentsSigners()[Landroid/content/pm/Signature;

    move-result-object p0

    :goto_0
    return-object p0
.end method

.method private static signerFlags()I
    .locals 2

    .line 299
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1c

    if-lt v0, v1, :cond_0

    const/high16 v0, 0x8000000

    goto :goto_0

    :cond_0
    const/16 v0, 0x40

    :goto_0
    return v0
.end method

.method private status(Ljava/lang/String;ILjava/lang/String;)Lorg/json/JSONObject;
    .locals 2

    .line 160
    :try_start_0
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    const-string v1, "state"

    invoke-virtual {v0, v1, p1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1

    const-string v0, "current"

    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge;->installed:Landroid/content/pm/PackageInfo;

    iget-object v1, v1, Landroid/content/pm/PackageInfo;->versionName:Ljava/lang/String;

    invoke-virtual {p1, v0, v1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1

    const-string v0, "latest"

    .line 161
    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    if-nez v1, :cond_0

    const-string v1, ""

    goto :goto_0

    :cond_0
    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    iget-object v1, v1, Ltt/xinjian/cn/UpdateRelease;->version:Ljava/lang/String;

    :goto_0
    invoke-virtual {p1, v0, v1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1

    const-string v0, "percent"

    invoke-virtual {p1, v0, p2}, Lorg/json/JSONObject;->put(Ljava/lang/String;I)Lorg/json/JSONObject;

    move-result-object p1

    const-string p2, "message"

    invoke-virtual {p1, p2, p3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    move-result-object p1
    :try_end_0
    .catch Lorg/json/JSONException; {:try_start_0 .. :try_end_0} :catch_0

    .line 160
    return-object p1

    .line 162
    :catch_0
    move-exception p1

    .line 163
    new-instance p2, Ljava/lang/IllegalStateException;

    invoke-direct {p2, p1}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/Throwable;)V

    throw p2
.end method

.method private validCached(Ljava/io/File;Ltt/xinjian/cn/UpdateRelease;)Z
    .locals 6

    .line 269
    invoke-virtual {p1}, Ljava/io/File;->isFile()Z

    move-result v0

    const/4 v1, 0x0

    if-eqz v0, :cond_3

    invoke-virtual {p1}, Ljava/io/File;->length()J

    move-result-wide v2

    iget-wide v4, p2, Ltt/xinjian/cn/UpdateRelease;->bytes:J

    cmp-long v0, v2, v4

    if-eqz v0, :cond_0

    goto :goto_3

    .line 270
    :cond_0
    :try_start_0
    new-instance v0, Ljava/io/FileInputStream;

    invoke-direct {v0, p1}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    .line 271
    :try_start_1
    invoke-static {}, Ltt/xinjian/cn/UpdateBridge;->newDigest()Ljava/security/MessageDigest;

    move-result-object v2

    .line 272
    const/16 v3, 0x4000

    new-array v3, v3, [B

    .line 274
    :goto_0
    invoke-virtual {v0, v3}, Ljava/io/FileInputStream;->read([B)I

    move-result v4

    const/4 v5, -0x1

    if-eq v4, v5, :cond_1

    invoke-virtual {v2, v3, v1, v4}, Ljava/security/MessageDigest;->update([BII)V

    goto :goto_0

    .line 275
    :cond_1
    iget-object v3, p2, Ltt/xinjian/cn/UpdateRelease;->sha256:Ljava/lang/String;

    invoke-virtual {v2}, Ljava/security/MessageDigest;->digest()[B

    move-result-object v2

    invoke-static {v2}, Ltt/xinjian/cn/UpdateBridge;->hex([B)Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v3, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    if-nez v2, :cond_2

    .line 278
    :try_start_2
    invoke-virtual {v0}, Ljava/io/FileInputStream;->close()V
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_2 .. :try_end_2} :catch_0

    .line 275
    return v1

    .line 276
    :cond_2
    :try_start_3
    invoke-direct {p0, p1, p2}, Ltt/xinjian/cn/UpdateBridge;->verifyPackage(Ljava/io/File;Ltt/xinjian/cn/UpdateRelease;)V
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    .line 277
    nop

    .line 278
    :try_start_4
    invoke-virtual {v0}, Ljava/io/FileInputStream;->close()V
    :try_end_4
    .catch Ljava/io/IOException; {:try_start_4 .. :try_end_4} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_4 .. :try_end_4} :catch_0

    .line 277
    const/4 p1, 0x1

    return p1

    .line 270
    :catchall_0
    move-exception p1

    :try_start_5
    invoke-virtual {v0}, Ljava/io/FileInputStream;->close()V
    :try_end_5
    .catchall {:try_start_5 .. :try_end_5} :catchall_1

    goto :goto_1

    :catchall_1
    move-exception p2

    :try_start_6
    invoke-virtual {p1, p2}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :goto_1
    throw p1
    :try_end_6
    .catch Ljava/io/IOException; {:try_start_6 .. :try_end_6} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_6 .. :try_end_6} :catch_0

    .line 278
    :catch_0
    move-exception p1

    goto :goto_2

    :catch_1
    move-exception p1

    .line 279
    :goto_2
    return v1

    .line 269
    :cond_3
    :goto_3
    return v1
.end method

.method private verifyPackage(Ljava/io/File;Ltt/xinjian/cn/UpdateRelease;)V
    .locals 4
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/io/IOException;
        }
    .end annotation

    .line 285
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-virtual {v0}, Landroid/app/Activity;->getPackageManager()Landroid/content/pm/PackageManager;

    move-result-object v0

    invoke-virtual {p1}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object p1

    invoke-static {}, Ltt/xinjian/cn/UpdateBridge;->signerFlags()I

    move-result v1

    invoke-virtual {v0, p1, v1}, Landroid/content/pm/PackageManager;->getPackageArchiveInfo(Ljava/lang/String;I)Landroid/content/pm/PackageInfo;

    move-result-object p1

    .line 286
    if-eqz p1, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->installed:Landroid/content/pm/PackageInfo;

    iget-object v0, v0, Landroid/content/pm/PackageInfo;->packageName:Ljava/lang/String;

    iget-object v1, p1, Landroid/content/pm/PackageInfo;->packageName:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_1

    iget-object p2, p2, Ltt/xinjian/cn/UpdateRelease;->version:Ljava/lang/String;

    iget-object v0, p1, Landroid/content/pm/PackageInfo;->versionName:Ljava/lang/String;

    .line 287
    invoke-virtual {p2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-eqz p2, :cond_1

    invoke-static {p1}, Ltt/xinjian/cn/UpdateBridge;->versionCode(Landroid/content/pm/PackageInfo;)J

    move-result-wide v0

    iget-object p2, p0, Ltt/xinjian/cn/UpdateBridge;->installed:Landroid/content/pm/PackageInfo;

    invoke-static {p2}, Ltt/xinjian/cn/UpdateBridge;->versionCode(Landroid/content/pm/PackageInfo;)J

    move-result-wide v2

    cmp-long p2, v0, v2

    if-lez p2, :cond_1

    .line 290
    iget-object p2, p0, Ltt/xinjian/cn/UpdateBridge;->installed:Landroid/content/pm/PackageInfo;

    invoke-static {p2}, Ltt/xinjian/cn/UpdateBridge;->signatures(Landroid/content/pm/PackageInfo;)[Landroid/content/pm/Signature;

    move-result-object p2

    invoke-static {p1}, Ltt/xinjian/cn/UpdateBridge;->signatures(Landroid/content/pm/PackageInfo;)[Landroid/content/pm/Signature;

    move-result-object p1

    .line 291
    if-eqz p2, :cond_0

    if-eqz p1, :cond_0

    array-length v0, p2

    if-eqz v0, :cond_0

    array-length v0, p1

    if-eqz v0, :cond_0

    new-instance v0, Ljava/util/HashSet;

    .line 292
    invoke-static {p2}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object p2

    invoke-direct {v0, p2}, Ljava/util/HashSet;-><init>(Ljava/util/Collection;)V

    new-instance p2, Ljava/util/HashSet;

    invoke-static {p1}, Ljava/util/Arrays;->asList([Ljava/lang/Object;)Ljava/util/List;

    move-result-object p1

    invoke-direct {p2, p1}, Ljava/util/HashSet;-><init>(Ljava/util/Collection;)V

    invoke-virtual {v0, p2}, Ljava/util/HashSet;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_0

    .line 295
    return-void

    .line 293
    :cond_0
    new-instance p1, Ljava/io/IOException;

    const-string p2, "\u5b89\u88c5\u5305\u7b7e\u540d\u4e0e\u5df2\u5b89\u88c5\u5e94\u7528\u4e0d\u4e00\u81f4"

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 288
    :cond_1
    new-instance p1, Ljava/io/IOException;

    const-string p2, "\u5b89\u88c5\u5305\u7684\u5e94\u7528 ID \u6216\u7248\u672c\u4e0d\u5339\u914d"

    invoke-direct {p1, p2}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1
.end method

.method private static versionCode(Landroid/content/pm/PackageInfo;)J
    .locals 2

    .line 310
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1c

    if-lt v0, v1, :cond_0

    invoke-virtual {p0}, Landroid/content/pm/PackageInfo;->getLongVersionCode()J

    move-result-wide v0

    goto :goto_0

    :cond_0
    iget p0, p0, Landroid/content/pm/PackageInfo;->versionCode:I

    int-to-long v0, p0

    :goto_0
    return-wide v0
.end method


# virtual methods
.method public declared-synchronized check()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 62
    :try_start_0
    const-string v0, "checking"

    const/4 v1, 0x0

    invoke-direct {p0, v0, v1}, Ltt/xinjian/cn/UpdateBridge;->begin(Ljava/lang/String;I)Z

    move-result v0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-nez v0, :cond_0

    monitor-exit p0

    return-void

    .line 63
    :cond_0
    :try_start_1
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->worker:Ljava/util/concurrent/ExecutorService;

    new-instance v1, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda1;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda1;-><init>(Ltt/xinjian/cn/UpdateBridge;)V

    invoke-interface {v0, v1}, Ljava/util/concurrent/ExecutorService;->execute(Ljava/lang/Runnable;)V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 79
    monitor-exit p0

    return-void

    .line 61
    :catchall_0
    move-exception v0

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw v0
.end method

.method public declared-synchronized close()V
    .locals 1

    monitor-enter p0

    .line 142
    const/4 v0, 0x1

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    .line 143
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->worker:Ljava/util/concurrent/ExecutorService;

    invoke-interface {v0}, Ljava/util/concurrent/ExecutorService;->shutdownNow()Ljava/util/List;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 144
    monitor-exit p0

    return-void

    .line 141
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public declared-synchronized download()V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 82
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    if-eqz v0, :cond_1

    const-string v0, "downloading"

    const/4 v1, 0x0

    invoke-direct {p0, v0, v1}, Ltt/xinjian/cn/UpdateBridge;->begin(Ljava/lang/String;I)Z

    move-result v0

    if-nez v0, :cond_0

    goto :goto_0

    .line 83
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    .line 84
    iput-boolean v1, p0, Ltt/xinjian/cn/UpdateBridge;->ready:Z

    .line 85
    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge;->worker:Ljava/util/concurrent/ExecutorService;

    new-instance v2, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda3;

    invoke-direct {v2, p0, v0}, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda3;-><init>(Ltt/xinjian/cn/UpdateBridge;Ltt/xinjian/cn/UpdateRelease;)V

    invoke-interface {v1, v2}, Ljava/util/concurrent/ExecutorService;->execute(Ljava/lang/Runnable;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 96
    monitor-exit p0

    return-void

    .line 82
    :cond_1
    :goto_0
    monitor-exit p0

    return-void

    .line 81
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public info()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 58
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->state:Ljava/lang/String;

    return-object v0
.end method

.method public declared-synchronized install()V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 99
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->ready:Z

    if-eqz v0, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    if-eqz v0, :cond_1

    const-string v0, "verifying"

    const/16 v1, 0x64

    invoke-direct {p0, v0, v1}, Ltt/xinjian/cn/UpdateBridge;->begin(Ljava/lang/String;I)Z

    move-result v0

    if-nez v0, :cond_0

    goto :goto_0

    .line 100
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    .line 101
    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge;->worker:Ljava/util/concurrent/ExecutorService;

    new-instance v2, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda0;

    invoke-direct {v2, p0, v0}, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda0;-><init>(Ltt/xinjian/cn/UpdateBridge;Ltt/xinjian/cn/UpdateRelease;)V

    invoke-interface {v1, v2}, Ljava/util/concurrent/ExecutorService;->execute(Ljava/lang/Runnable;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 111
    monitor-exit p0

    return-void

    .line 99
    :cond_1
    :goto_0
    monitor-exit p0

    return-void

    .line 98
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method synthetic lambda$check$0$tt-xinjian-cn-UpdateBridge()V
    .locals 4

    .line 65
    const/4 v0, 0x0

    :try_start_0
    invoke-static {}, Ltt/xinjian/cn/UpdateBridge;->fetchLatest()Lorg/json/JSONObject;

    move-result-object v1

    iget-object v2, p0, Ltt/xinjian/cn/UpdateBridge;->installed:Landroid/content/pm/PackageInfo;

    iget-object v2, v2, Landroid/content/pm/PackageInfo;->versionName:Ljava/lang/String;

    iget-object v3, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    .line 66
    invoke-virtual {v3}, Landroid/app/Activity;->getPackageName()Ljava/lang/String;

    move-result-object v3

    invoke-static {v3}, Ltt/xinjian/cn/UpdateRelease;->channel(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    .line 65
    invoke-static {v1, v2, v3}, Ltt/xinjian/cn/UpdateRelease;->read(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)Ltt/xinjian/cn/UpdateRelease;

    move-result-object v1

    .line 67
    if-eqz v1, :cond_0

    iget-object v2, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-static {v2, v1}, Ltt/xinjian/cn/UpdateApkProvider;->apk(Landroid/content/Context;Ltt/xinjian/cn/UpdateRelease;)Ljava/io/File;

    move-result-object v2

    invoke-direct {p0, v2, v1}, Ltt/xinjian/cn/UpdateBridge;->validCached(Ljava/io/File;Ltt/xinjian/cn/UpdateRelease;)Z

    move-result v2

    if-eqz v2, :cond_0

    const/4 v2, 0x1

    goto :goto_0

    :cond_0
    const/4 v2, 0x0

    .line 68
    :goto_0
    monitor-enter p0
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 69
    :try_start_1
    iput-object v1, p0, Ltt/xinjian/cn/UpdateBridge;->release:Ltt/xinjian/cn/UpdateRelease;

    .line 70
    iput-boolean v2, p0, Ltt/xinjian/cn/UpdateBridge;->ready:Z

    .line 71
    if-nez v1, :cond_1

    const-string v1, "current"

    goto :goto_1

    :cond_1
    if-eqz v2, :cond_2

    const-string v1, "ready"

    goto :goto_1

    :cond_2
    const-string v1, "available"

    :goto_1
    if-eqz v2, :cond_3

    const/16 v2, 0x64

    goto :goto_2

    :cond_3
    const/4 v2, 0x0

    :goto_2
    const-string v3, ""

    invoke-direct {p0, v1, v2, v3}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 72
    monitor-exit p0

    goto :goto_3

    :catchall_0
    move-exception v1

    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    :try_start_2
    throw v1
    :try_end_2
    .catch Ljava/io/IOException; {:try_start_2 .. :try_end_2} :catch_1
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0

    .line 75
    :catch_0
    move-exception v1

    .line 76
    const-string v1, "checkError"

    const-string v2, "\u7248\u672c\u4fe1\u606f\u6709\u8bef\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"

    invoke-direct {p0, v1, v0, v2}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    goto :goto_4

    .line 73
    :catch_1
    move-exception v1

    .line 74
    const-string v2, "checkError"

    const-string v3, "\u68c0\u67e5\u66f4\u65b0\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"

    invoke-static {v1, v3}, Ltt/xinjian/cn/UpdateBridge;->message(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v1

    invoke-direct {p0, v2, v0, v1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 77
    :goto_3
    nop

    .line 78
    :goto_4
    return-void
.end method

.method synthetic lambda$download$1$tt-xinjian-cn-UpdateBridge(Ltt/xinjian/cn/UpdateRelease;)V
    .locals 2

    .line 87
    :try_start_0
    invoke-direct {p0, p1}, Ltt/xinjian/cn/UpdateBridge;->downloadVerified(Ltt/xinjian/cn/UpdateRelease;)V

    .line 88
    monitor-enter p0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 89
    const/4 p1, 0x1

    :try_start_1
    iput-boolean p1, p0, Ltt/xinjian/cn/UpdateBridge;->ready:Z

    .line 90
    const-string p1, "ready"

    const-string v0, ""

    const/16 v1, 0x64

    invoke-direct {p0, p1, v1, v0}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 91
    monitor-exit p0

    .line 94
    goto :goto_0

    .line 91
    :catchall_0
    move-exception p1

    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    :try_start_2
    throw p1
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0

    .line 92
    :catch_0
    move-exception p1

    .line 93
    const-string v0, "downloadError"

    const-string v1, "\u4e0b\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u91cd\u8bd5"

    invoke-static {p1, v1}, Ltt/xinjian/cn/UpdateBridge;->message(Ljava/lang/Exception;Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    const/4 v1, 0x0

    invoke-direct {p0, v0, v1, p1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 95
    :goto_0
    return-void
.end method

.method synthetic lambda$install$2$tt-xinjian-cn-UpdateBridge(Ltt/xinjian/cn/UpdateRelease;)V
    .locals 0

    .line 109
    invoke-direct {p0, p1}, Ltt/xinjian/cn/UpdateBridge;->openInstaller(Ltt/xinjian/cn/UpdateRelease;)V

    return-void
.end method

.method synthetic lambda$install$3$tt-xinjian-cn-UpdateBridge(Ltt/xinjian/cn/UpdateRelease;)V
    .locals 2

    .line 102
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->activity:Landroid/app/Activity;

    invoke-static {v0, p1}, Ltt/xinjian/cn/UpdateApkProvider;->apk(Landroid/content/Context;Ltt/xinjian/cn/UpdateRelease;)Ljava/io/File;

    move-result-object v0

    invoke-direct {p0, v0, p1}, Ltt/xinjian/cn/UpdateBridge;->validCached(Ljava/io/File;Ltt/xinjian/cn/UpdateRelease;)Z

    move-result v0

    if-nez v0, :cond_0

    .line 103
    monitor-enter p0

    .line 104
    const/4 p1, 0x0

    :try_start_0
    iput-boolean p1, p0, Ltt/xinjian/cn/UpdateBridge;->ready:Z

    .line 105
    const-string v0, "downloadError"

    const-string v1, "\u5b89\u88c5\u5305\u6821\u9a8c\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u4e0b\u8f7d"

    invoke-direct {p0, v0, p1, v1}, Ltt/xinjian/cn/UpdateBridge;->finish(Ljava/lang/String;ILjava/lang/String;)V

    .line 106
    monitor-exit p0

    .line 107
    return-void

    .line 106
    :catchall_0
    move-exception p1

    monitor-exit p0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    throw p1

    .line 109
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;

    invoke-direct {v1, p0, p1}, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;-><init>(Ltt/xinjian/cn/UpdateBridge;Ltt/xinjian/cn/UpdateRelease;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 110
    return-void
.end method

.method synthetic lambda$publish$4$tt-xinjian-cn-UpdateBridge(Ljava/lang/String;)V
    .locals 3

    .line 172
    iget-boolean v0, p0, Ltt/xinjian/cn/UpdateBridge;->closed:Z

    if-nez v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "window.__xjUpdate&&window.__xjUpdate("

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-static {p1}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v1, ")"

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    const/4 v1, 0x0

    invoke-virtual {v0, p1, v1}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    .line 173
    :cond_0
    return-void
.end method
