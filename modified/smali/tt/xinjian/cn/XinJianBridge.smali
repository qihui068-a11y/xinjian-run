.class public Ltt/xinjian/cn/XinJianBridge;
.super Ljava/lang/Object;
.source "XinJianBridge.java"


# instance fields
.field private final ctx:Landroid/content/Context;

.field private final dir:Ljava/io/File;


# direct methods
.method public constructor <init>(Landroid/content/Context;)V
    .locals 2

    .line 85
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 86
    iput-object p1, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    const/4 v0, 0x0

    .line 87
    invoke-virtual {p1, v0}, Landroid/content/Context;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v0

    if-nez v0, :cond_0

    .line 88
    new-instance v0, Ljava/io/File;

    invoke-virtual {p1}, Landroid/content/Context;->getFilesDir()Ljava/io/File;

    move-result-object p1

    const-string v1, "ext"

    invoke-direct {v0, p1, v1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 89
    :cond_0
    new-instance p1, Ljava/io/File;

    const-string v1, "bookcase"

    invoke-direct {p1, v0, v1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    iput-object p1, p0, Ltt/xinjian/cn/XinJianBridge;->dir:Ljava/io/File;

    .line 90
    invoke-virtual {p1}, Ljava/io/File;->exists()Z

    move-result v0

    if-nez v0, :cond_1

    invoke-virtual {p1}, Ljava/io/File;->mkdirs()Z

    :cond_1
    return-void
.end method

.method private static excerpt(Ljava/io/File;)Ljava/lang/String;
    .locals 7

    .line 223
    const-string v0, ""

    const/4 v1, 0x0

    .line 225
    :try_start_0
    new-instance v2, Ljava/io/InputStreamReader;

    new-instance v3, Ljava/io/FileInputStream;

    invoke-direct {v3, p0}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    const-string p0, "UTF-8"

    invoke-direct {v2, v3, p0}, Ljava/io/InputStreamReader;-><init>(Ljava/io/InputStream;Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_4
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    const/16 p0, 0x1000

    .line 226
    :try_start_1
    new-array p0, p0, [C

    .line 227
    invoke-virtual {v2, p0}, Ljava/io/Reader;->read([C)I

    move-result v1
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_2
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    if-gtz v1, :cond_0

    .line 236
    :try_start_2
    invoke-virtual {v2}, Ljava/io/Reader;->close()V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0

    :catch_0
    return-object v0

    .line 229
    :cond_0
    :try_start_3
    new-instance v3, Ljava/lang/String;

    const/4 v4, 0x0

    invoke-direct {v3, p0, v4, v1}, Ljava/lang/String;-><init>([CII)V

    .line 230
    const-string p0, "\r?\n"

    invoke-virtual {v3, p0}, Ljava/lang/String;->split(Ljava/lang/String;)[Ljava/lang/String;

    move-result-object p0

    array-length v1, p0

    const/4 v3, 0x0

    :goto_0
    if-ge v3, v1, :cond_3

    aget-object v5, p0, v3

    .line 231
    invoke-virtual {v5}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v5

    .line 232
    invoke-virtual {v5}, Ljava/lang/String;->isEmpty()Z

    move-result v6

    if-nez v6, :cond_2

    invoke-virtual {v5}, Ljava/lang/String;->length()I

    move-result p0

    const/16 v1, 0x3c

    if-le p0, v1, :cond_1

    invoke-virtual {v5, v4, v1}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v5
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_2
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    .line 236
    :cond_1
    :try_start_4
    invoke-virtual {v2}, Ljava/io/Reader;->close()V
    :try_end_4
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4} :catch_1

    :catch_1
    return-object v5

    :cond_2
    add-int/lit8 v3, v3, 0x1

    goto :goto_0

    :cond_3
    :try_start_5
    invoke-virtual {v2}, Ljava/io/Reader;->close()V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_5} :catch_5

    goto :goto_3

    :catchall_0
    move-exception p0

    move-object v1, v2

    goto :goto_1

    :catch_2
    nop

    move-object v1, v2

    goto :goto_2

    :catchall_1
    move-exception p0

    :goto_1
    if-eqz v1, :cond_4

    :try_start_6
    invoke-virtual {v1}, Ljava/io/Reader;->close()V
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_3

    .line 237
    :catch_3
    :cond_4
    throw p0

    :catch_4
    nop

    :goto_2
    if-eqz v1, :cond_5

    .line 236
    :try_start_7
    invoke-virtual {v1}, Ljava/io/Reader;->close()V
    :try_end_7
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_7} :catch_5

    :catch_5
    :cond_5
    :goto_3
    return-object v0
.end method

.method private static ext(Ljava/lang/String;)Ljava/lang/String;
    .locals 2

    const/16 v0, 0x2e

    .line 217
    invoke-virtual {p0, v0}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v0

    if-lez v0, :cond_0

    .line 218
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v1

    add-int/lit8 v1, v1, -0x1

    if-ge v0, v1, :cond_0

    add-int/lit8 v0, v0, 0x1

    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/String;->toLowerCase()Ljava/lang/String;

    move-result-object p0

    return-object p0

    :cond_0
    const-string p0, ""

    return-object p0
.end method

.method private has(Ljava/lang/String;)Z
    .locals 3

    .line 117
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x17

    const/4 v2, 0x1

    if-ge v0, v1, :cond_0

    return v2

    .line 118
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    invoke-virtual {v0, p1}, Landroid/content/Context;->checkSelfPermission(Ljava/lang/String;)I

    move-result p1

    if-nez p1, :cond_1

    return v2

    :cond_1
    const/4 p1, 0x0

    return p1
.end method

.method private notifyPerm(Ljava/lang/String;Z)V
    .locals 2

    .line 213
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v1, v0, Ltt/xinjian/cn/MainActivity;

    if-eqz v1, :cond_0

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0, p1, p2}, Ltt/xinjian/cn/MainActivity;->notifyPerm(Ljava/lang/String;Z)V

    :cond_0
    return-void
.end method

.method private static readText(Ljava/io/File;)Ljava/lang/String;
    .locals 4

    const/4 v0, 0x0

    .line 244
    :try_start_0
    new-instance v1, Ljava/io/FileInputStream;

    invoke-direct {v1, p0}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_2
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    .line 245
    :try_start_1
    new-instance p0, Ljava/io/ByteArrayOutputStream;

    invoke-direct {p0}, Ljava/io/ByteArrayOutputStream;-><init>()V

    const/16 v0, 0x2000

    .line 246
    new-array v0, v0, [B

    .line 248
    :goto_0
    invoke-virtual {v1, v0}, Ljava/io/FileInputStream;->read([B)I

    move-result v2

    if-lez v2, :cond_0

    const/4 v3, 0x0

    invoke-virtual {p0, v0, v3, v2}, Ljava/io/ByteArrayOutputStream;->write([BII)V

    goto :goto_0

    .line 249
    :cond_0
    new-instance v0, Ljava/lang/String;

    invoke-virtual {p0}, Ljava/io/ByteArrayOutputStream;->toByteArray()[B

    move-result-object p0

    const-string v2, "UTF-8"

    invoke-direct {v0, p0, v2}, Ljava/lang/String;-><init>([BLjava/lang/String;)V
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 253
    :try_start_2
    invoke-virtual {v1}, Ljava/io/FileInputStream;->close()V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0

    :catch_0
    return-object v0

    :catchall_0
    move-exception p0

    move-object v0, v1

    goto :goto_2

    :catch_1
    move-object v0, v1

    goto :goto_1

    :catchall_1
    move-exception p0

    goto :goto_2

    .line 251
    :catch_2
    :goto_1
    :try_start_3
    const-string p0, ""
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    if-eqz v0, :cond_1

    .line 253
    :try_start_4
    invoke-virtual {v0}, Ljava/io/FileInputStream;->close()V
    :try_end_4
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4} :catch_3

    :catch_3
    :cond_1
    return-object p0

    :goto_2
    if-eqz v0, :cond_2

    :try_start_5
    invoke-virtual {v0}, Ljava/io/FileInputStream;->close()V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_5} :catch_4

    .line 254
    :catch_4
    :cond_2
    throw p0
.end method

.method private resolve(Ljava/lang/String;)Ljava/io/File;
    .locals 3

    const/4 v0, 0x0

    if-nez p1, :cond_0

    return-object v0

    .line 96
    :cond_0
    invoke-virtual {p1}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p1

    .line 97
    invoke-virtual {p1}, Ljava/lang/String;->isEmpty()Z

    move-result v1

    if-nez v1, :cond_6

    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v1

    const/16 v2, 0xc8

    if-le v1, v2, :cond_1

    goto :goto_0

    :cond_1
    const/16 v1, 0x2f

    .line 98
    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(I)I

    move-result v1

    if-gez v1, :cond_6

    const/16 v1, 0x5c

    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(I)I

    move-result v1

    if-ltz v1, :cond_2

    goto :goto_0

    :cond_2
    const/4 v1, 0x0

    .line 99
    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(I)I

    move-result v1

    if-ltz v1, :cond_3

    return-object v0

    .line 101
    :cond_3
    const-string v1, "."

    invoke-virtual {v1, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-nez v1, :cond_6

    const-string v1, ".."

    invoke-virtual {v1, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_4

    goto :goto_0

    .line 102
    :cond_4
    new-instance v1, Ljava/io/File;

    iget-object v2, p0, Ltt/xinjian/cn/XinJianBridge;->dir:Ljava/io/File;

    invoke-direct {v1, v2, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 104
    :try_start_0
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1}, Ljava/lang/StringBuilder;-><init>()V

    iget-object v2, p0, Ltt/xinjian/cn/XinJianBridge;->dir:Ljava/io/File;

    invoke-virtual {v2}, Ljava/io/File;->getCanonicalPath()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {p1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    sget-object v2, Ljava/io/File;->separator:Ljava/lang/String;

    invoke-virtual {p1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    .line 105
    invoke-virtual {v1}, Ljava/io/File;->getCanonicalPath()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v2, p1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result p1
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_0

    if-nez p1, :cond_5

    return-object v0

    :cond_5
    return-object v1

    :catch_0
    :cond_6
    :goto_0
    return-object v0
.end method

.method private static storagePerm()Ljava/lang/String;
    .locals 2

    .line 123
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x21

    if-lt v0, v1, :cond_0

    .line 124
    const-string v0, "android.permission.READ_MEDIA_IMAGES"

    return-object v0

    .line 125
    :cond_0
    const-string v0, "android.permission.READ_EXTERNAL_STORAGE"

    return-object v0
.end method

.method private static writeText(Ljava/io/File;Ljava/lang/String;)Z
    .locals 3

    const/4 v0, 0x0

    const/4 v1, 0x0

    .line 260
    :try_start_0
    new-instance v2, Ljava/io/FileOutputStream;

    invoke-direct {v2, p0}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_3
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    if-nez p1, :cond_0

    .line 261
    :try_start_1
    new-array p0, v0, [B

    goto :goto_0

    :cond_0
    const-string p0, "UTF-8"

    invoke-virtual {p1, p0}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B

    move-result-object p0

    :goto_0
    invoke-virtual {v2, p0}, Ljava/io/FileOutputStream;->write([B)V

    .line 262
    invoke-virtual {v2}, Ljava/io/FileOutputStream;->flush()V
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    const/4 p0, 0x1

    .line 267
    :try_start_2
    invoke-virtual {v2}, Ljava/io/FileOutputStream;->close()V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0

    :catch_0
    return p0

    :catchall_0
    move-exception p0

    move-object v1, v2

    goto :goto_1

    :catch_1
    nop

    move-object v1, v2

    goto :goto_2

    :catchall_1
    move-exception p0

    :goto_1
    if-eqz v1, :cond_1

    :try_start_3
    invoke-virtual {v1}, Ljava/io/FileOutputStream;->close()V
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_2

    .line 268
    :catch_2
    :cond_1
    throw p0

    :catch_3
    nop

    :goto_2
    if-eqz v1, :cond_2

    .line 267
    :try_start_4
    invoke-virtual {v1}, Ljava/io/FileOutputStream;->close()V
    :try_end_4
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4} :catch_4

    :catch_4
    :cond_2
    return v0
.end method


# virtual methods
.method public askPerm(Ljava/lang/String;)V
    .locals 4
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 188
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v0, v0, Landroid/app/Activity;

    if-nez v0, :cond_0

    const/4 v0, 0x0

    invoke-direct {p0, p1, v0}, Ltt/xinjian/cn/XinJianBridge;->notifyPerm(Ljava/lang/String;Z)V

    return-void

    .line 190
    :cond_0
    const-string v0, "loc"

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    const-string v1, "android.permission.ACCESS_COARSE_LOCATION"

    const/4 v2, 0x1

    if-eqz v0, :cond_2

    .line 192
    invoke-direct {p0, v1}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v0

    if-eqz v0, :cond_1

    invoke-direct {p0, p1, v2}, Ltt/xinjian/cn/XinJianBridge;->notifyPerm(Ljava/lang/String;Z)V

    return-void

    .line 193
    :cond_1
    iget-object p1, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    check-cast p1, Landroid/app/Activity;

    filled-new-array {v1}, [Ljava/lang/String;

    move-result-object v0

    const/16 v1, 0x3ec

    invoke-virtual {p1, v0, v1}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V

    return-void

    .line 196
    :cond_2
    const-string v0, "locFine"

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_4

    .line 201
    const-string v0, "android.permission.ACCESS_FINE_LOCATION"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v3

    if-eqz v3, :cond_3

    invoke-direct {p0, p1, v2}, Ltt/xinjian/cn/XinJianBridge;->notifyPerm(Ljava/lang/String;Z)V

    return-void

    .line 202
    :cond_3
    iget-object p1, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    check-cast p1, Landroid/app/Activity;

    filled-new-array {v0, v1}, [Ljava/lang/String;

    move-result-object v0

    const/16 v1, 0x3ed

    invoke-virtual {p1, v0, v1}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V

    return-void

    .line 206
    :cond_4
    const-string v0, "camera"

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_5

    .line 207
    const-string v1, "android.permission.CAMERA"

    goto :goto_0

    :cond_5
    invoke-static {}, Ltt/xinjian/cn/XinJianBridge;->storagePerm()Ljava/lang/String;

    move-result-object v1

    .line 208
    :goto_0
    invoke-direct {p0, v1}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v3

    if-eqz v3, :cond_6

    invoke-direct {p0, p1, v2}, Ltt/xinjian/cn/XinJianBridge;->notifyPerm(Ljava/lang/String;Z)V

    return-void

    .line 209
    :cond_6
    iget-object p1, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    check-cast p1, Landroid/app/Activity;

    filled-new-array {v1}, [Ljava/lang/String;

    move-result-object v1

    if-eqz v0, :cond_7

    const/16 v0, 0x3ea

    goto :goto_1

    :cond_7
    const/16 v0, 0x3eb

    :goto_1
    invoke-virtual {p1, v1, v0}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V

    return-void
.end method

.method public capture()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 51
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v1, v0, Ltt/xinjian/cn/MainActivity;

    if-eqz v1, :cond_0

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->capture()V

    :cond_0
    return-void
.end method

.method public create(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 310
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    .line 311
    const-string v0, "false"

    if-nez p1, :cond_0

    return-object v0

    .line 312
    :cond_0
    invoke-virtual {p1}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_1

    return-object v0

    :cond_1
    if-nez p2, :cond_2

    .line 313
    const-string p2, ""

    :cond_2
    invoke-static {p1, p2}, Ltt/xinjian/cn/XinJianBridge;->writeText(Ljava/io/File;Ljava/lang/String;)Z

    move-result p1

    if-eqz p1, :cond_3

    const-string p1, "true"

    return-object p1

    :cond_3
    return-object v0
.end method

.method public exists(Ljava/lang/String;)Ljava/lang/String;
    .locals 0
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 339
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    if-eqz p1, :cond_0

    .line 340
    invoke-virtual {p1}, Ljava/io/File;->isFile()Z

    move-result p1

    if-eqz p1, :cond_0

    const-string p1, "true"

    return-object p1

    :cond_0
    const-string p1, "false"

    return-object p1
.end method

# Match MediaStore MIME to the actual suffix so .html/.css/.js/.json/.xml stay intact.
.method private static documentMime(Ljava/lang/String;)Ljava/lang/String;
    .locals 2

    const/16 v0, 0x2e

    invoke-virtual {p0, v0}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v0

    if-ltz v0, :mime_fallback

    add-int/lit8 v0, v0, 0x1

    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v0

    sget-object v1, Ljava/util/Locale;->ROOT:Ljava/util/Locale;

    invoke-virtual {v0, v1}, Ljava/lang/String;->toLowerCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object v0

    invoke-static {}, Landroid/webkit/MimeTypeMap;->getSingleton()Landroid/webkit/MimeTypeMap;

    move-result-object v1

    invoke-virtual {v1, v0}, Landroid/webkit/MimeTypeMap;->getMimeTypeFromExtension(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    if-eqz v0, :mime_fallback

    return-object v0

    :mime_fallback
    const-string v0, "text/plain"

    return-object v0
.end method

.method public export(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 346
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    .line 347
    const-string v0, "false"

    if-nez p1, :cond_0

    return-object v0

    :cond_0
    if-nez p2, :cond_1

    .line 350
    :try_start_0
    const-string p2, ""

    :cond_1
    const-string v1, "UTF-8"

    invoke-virtual {p2, v1}, Ljava/lang/String;->getBytes(Ljava/lang/String;)[B

    move-result-object p2
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    const/4 p2, 0x0

    .line 352
    new-array p2, p2, [B

    .line 355
    :goto_0
    sget v1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v2, 0x1d

    const-string v3, "true"

    const/4 v4, 0x0

    if-lt v1, v2, :cond_8

    .line 358
    :try_start_1
    new-instance v1, Landroid/content/ContentValues;

    invoke-direct {v1}, Landroid/content/ContentValues;-><init>()V

    .line 359
    const-string v2, "_display_name"

    invoke-virtual {p1}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v1, v2, p1}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 360
    invoke-static {p1}, Ltt/xinjian/cn/XinJianBridge;->documentMime(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    const-string p1, "mime_type"

    invoke-virtual {v1, p1, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 361
    const-string p1, "relative_path"

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    sget-object v5, Landroid/os/Environment;->DIRECTORY_DOWNLOADS:Ljava/lang/String;

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v5, "/信笺代码版"

    invoke-virtual {v2, v5}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, p1, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 363
    iget-object p1, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    invoke-virtual {p1}, Landroid/content/Context;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p1

    sget-object v2, Landroid/provider/MediaStore$Downloads;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    .line 364
    invoke-virtual {p1, v2, v1}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object p1

    if-nez p1, :cond_2

    return-object v0

    .line 366
    :cond_2
    iget-object v1, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    invoke-virtual {v1}, Landroid/content/Context;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    invoke-virtual {v1, p1}, Landroid/content/ContentResolver;->openOutputStream(Landroid/net/Uri;)Ljava/io/OutputStream;

    move-result-object v4
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_4
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    if-nez v4, :cond_4

    if-eqz v4, :cond_3

    .line 374
    :try_start_2
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_1

    :catch_1
    :cond_3
    return-object v0

    .line 368
    :cond_4
    :try_start_3
    invoke-virtual {v4, p2}, Ljava/io/OutputStream;->write([B)V

    .line 369
    invoke-virtual {v4}, Ljava/io/OutputStream;->flush()V
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_4
    .catchall {:try_start_3 .. :try_end_3} :catchall_0

    if-eqz v4, :cond_5

    .line 374
    :try_start_4
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_4
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4} :catch_2

    :catch_2
    :cond_5
    return-object v3

    :catchall_0
    move-exception p1

    if-eqz v4, :cond_6

    :try_start_5
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_5} :catch_3

    .line 375
    :catch_3
    :cond_6
    throw p1

    :catch_4
    nop

    if-eqz v4, :cond_7

    .line 374
    :try_start_6
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_5

    :catch_5
    :cond_7
    return-object v0

    .line 380
    :cond_8
    :try_start_7
    new-instance v1, Ljava/io/File;

    sget-object v2, Landroid/os/Environment;->DIRECTORY_DOWNLOADS:Ljava/lang/String;

    invoke-static {v2}, Landroid/os/Environment;->getExternalStoragePublicDirectory(Ljava/lang/String;)Ljava/io/File;

    move-result-object v2

    const-string v5, "信笺代码版"

    invoke-direct {v1, v2, v5}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 382
    invoke-virtual {v1}, Ljava/io/File;->exists()Z

    move-result v2

    if-nez v2, :cond_9

    invoke-virtual {v1}, Ljava/io/File;->mkdirs()Z

    .line 383
    :cond_9
    new-instance v2, Ljava/io/FileOutputStream;

    new-instance v5, Ljava/io/File;

    invoke-virtual {p1}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object p1

    invoke-direct {v5, v1, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-direct {v2, v5}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_7
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_7} :catch_9
    .catchall {:try_start_7 .. :try_end_7} :catchall_2

    .line 384
    :try_start_8
    invoke-virtual {v2, p2}, Ljava/io/FileOutputStream;->write([B)V

    .line 385
    invoke-virtual {v2}, Ljava/io/FileOutputStream;->flush()V
    :try_end_8
    .catch Ljava/lang/Exception; {:try_start_8 .. :try_end_8} :catch_7
    .catchall {:try_start_8 .. :try_end_8} :catchall_1

    .line 390
    :try_start_9
    invoke-virtual {v2}, Ljava/io/FileOutputStream;->close()V
    :try_end_9
    .catch Ljava/lang/Exception; {:try_start_9 .. :try_end_9} :catch_6

    :catch_6
    return-object v3

    :catchall_1
    move-exception p1

    move-object v4, v2

    goto :goto_1

    :catch_7
    nop

    move-object v4, v2

    goto :goto_2

    :catchall_2
    move-exception p1

    :goto_1
    if-eqz v4, :cond_a

    :try_start_a
    invoke-virtual {v4}, Ljava/io/FileOutputStream;->close()V
    :try_end_a
    .catch Ljava/lang/Exception; {:try_start_a .. :try_end_a} :catch_8

    .line 391
    :catch_8
    :cond_a
    throw p1

    :catch_9
    nop

    :goto_2
    if-eqz v4, :cond_b

    .line 390
    :try_start_b
    invoke-virtual {v4}, Ljava/io/FileOutputStream;->close()V
    :try_end_b
    .catch Ljava/lang/Exception; {:try_start_b .. :try_end_b} :catch_a

    :catch_a
    :cond_b
    return-object v0
.end method

# Read-only display preferences for the app shell. WebView stays at 100% text zoom so
# editor font metrics, selection, and highlighting remain aligned.
.method public appearance()Ljava/lang/String;
    .locals 5
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;
    invoke-virtual {v0}, Landroid/content/Context;->getResources()Landroid/content/res/Resources;
    move-result-object v0
    invoke-virtual {v0}, Landroid/content/res/Resources;->getConfiguration()Landroid/content/res/Configuration;
    move-result-object v0

    new-instance v1, Ljava/lang/StringBuilder;
    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v2, "|"
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    iget v3, v0, Landroid/content/res/Configuration;->uiMode:I
    and-int/lit8 v3, v3, 0x30
    const/16 v4, 0x20
    if-ne v3, v4, :appearance_light
    const/4 v3, 0x1
    goto :appearance_mode

    :appearance_light
    const/4 v3, 0x0

    :appearance_mode
    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    iget v0, v0, Landroid/content/res/Configuration;->fontScale:F
    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(F)Ljava/lang/StringBuilder;
    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method public insets()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 76
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->insetsJson()Ljava/lang/String;

    move-result-object v0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    .line 78
    :catch_0
    const-string v0, "{}"

    return-object v0
.end method

.method public list()Ljava/lang/String;
    .locals 11
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 276
    const-string v0, "[]"

    :try_start_0
    iget-object v1, p0, Ltt/xinjian/cn/XinJianBridge;->dir:Ljava/io/File;

    invoke-virtual {v1}, Ljava/io/File;->listFiles()[Ljava/io/File;

    move-result-object v1

    if-nez v1, :cond_0

    return-object v0

    .line 278
    :cond_0
    new-instance v2, Ltt/xinjian/cn/XinJianBridge$1;

    invoke-direct {v2, p0}, Ltt/xinjian/cn/XinJianBridge$1;-><init>(Ltt/xinjian/cn/XinJianBridge;)V

    invoke-static {v1, v2}, Ljava/util/Arrays;->sort([Ljava/lang/Object;Ljava/util/Comparator;)V

    .line 283
    new-instance v2, Lorg/json/JSONArray;

    invoke-direct {v2}, Lorg/json/JSONArray;-><init>()V

    .line 284
    array-length v3, v1

    const/4 v4, 0x0

    :goto_0
    if-ge v4, v3, :cond_2

    aget-object v5, v1, v4

    .line 285
    invoke-virtual {v5}, Ljava/io/File;->isFile()Z

    move-result v6

    if-nez v6, :cond_1

    goto :goto_1

    .line 286
    :cond_1
    invoke-virtual {v5}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v6

    .line 287
    new-instance v7, Lorg/json/JSONObject;

    invoke-direct {v7}, Lorg/json/JSONObject;-><init>()V

    .line 288
    const-string v8, "name"

    invoke-virtual {v7, v8, v6}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 289
    const-string v8, "size"

    invoke-virtual {v5}, Ljava/io/File;->length()J

    move-result-wide v9

    invoke-virtual {v7, v8, v9, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 290
    const-string v8, "mtime"

    invoke-virtual {v5}, Ljava/io/File;->lastModified()J

    move-result-wide v9

    invoke-virtual {v7, v8, v9, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 291
    const-string v8, "excerpt"

    invoke-static {v5}, Ltt/xinjian/cn/XinJianBridge;->excerpt(Ljava/io/File;)Ljava/lang/String;

    move-result-object v5

    invoke-virtual {v7, v8, v5}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 292
    const-string v5, "ext"

    invoke-static {v6}, Ltt/xinjian/cn/XinJianBridge;->ext(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v6

    invoke-virtual {v7, v5, v6}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 293
    invoke-virtual {v2, v7}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    :goto_1
    add-int/lit8 v4, v4, 0x1

    goto :goto_0

    .line 295
    :cond_2
    invoke-virtual {v2}, Lorg/json/JSONArray;->toString()Ljava/lang/String;

    move-result-object v0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-object v0
.end method

.method public locate()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 56
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v1, v0, Ltt/xinjian/cn/MainActivity;

    if-eqz v1, :cond_0

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->locate()V

    :cond_0
    return-void
.end method

.method public openAppSettings()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 62
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v1, v0, Ltt/xinjian/cn/MainActivity;

    if-eqz v1, :cond_0

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->openAppSettings()V

    :cond_0
    return-void
.end method

.method public permStatus()Ljava/lang/String;
    .locals 12
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 130
    const-string v0, "revocable"

    const-string v1, "canAsk"

    const-string v2, "granted"

    const-string v3, "note"

    const-string v4, "label"

    const-string v5, "key"

    sget v6, Landroid/os/Build$VERSION;->SDK_INT:I

    .line 131
    new-instance v7, Lorg/json/JSONArray;

    invoke-direct {v7}, Lorg/json/JSONArray;-><init>()V

    .line 133
    :try_start_0
    new-instance v8, Lorg/json/JSONObject;

    invoke-direct {v8}, Lorg/json/JSONObject;-><init>()V

    .line 134
    const-string v9, "net"

    invoke-virtual {v8, v5, v9}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 135
    const-string v9, "\u7f51\u7edc"

    invoke-virtual {v8, v4, v9}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 136
    const-string v9, "\u9e3d\u5c4b\u6536\u53d1\u6d88\u606f\u3002\u5b89\u88c5\u65f6\u81ea\u52a8\u6388\u4e88\uff0c\u65e0\u6cd5\u62d2\u7edd\u3002"

    invoke-virtual {v8, v3, v9}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 137
    const-string v9, "android.permission.INTERNET"

    invoke-direct {p0, v9}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v9

    invoke-virtual {v8, v2, v9}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    const/4 v9, 0x0

    .line 138
    invoke-virtual {v8, v1, v9}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 139
    invoke-virtual {v7, v8}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    .line 141
    new-instance v8, Lorg/json/JSONObject;

    invoke-direct {v8}, Lorg/json/JSONObject;-><init>()V

    .line 142
    const-string v10, "storage"

    invoke-virtual {v8, v5, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    const/16 v10, 0x21

    if-lt v6, v10, :cond_0

    .line 143
    const-string v10, "\u7167\u7247\u548c\u89c6\u9891"

    goto :goto_0

    :cond_0
    const-string v10, "\u5b58\u50a8"

    :goto_0
    invoke-virtual {v8, v4, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 144
    const-string v10, "\u81ea\u5b9a\u4e49\u5934\u50cf\u4e0e\u80cc\u666f\u677f\u3001\u4ece\u76f8\u518c\u5bfc\u5165\u6587\u4ef6\u3002\u4e0d\u6388\u6743\u4e5f\u80fd\u7528\u7cfb\u7edf\u9009\u56fe\uff0c\u53ea\u662f\u5c11\u4e00\u4e9b\u65b9\u4fbf\u3002"

    invoke-virtual {v8, v3, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 145
    invoke-static {}, Ltt/xinjian/cn/XinJianBridge;->storagePerm()Ljava/lang/String;

    move-result-object v10

    invoke-direct {p0, v10}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v10

    invoke-virtual {v8, v2, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    const/4 v10, 0x1

    .line 146
    invoke-virtual {v8, v1, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 147
    invoke-virtual {v7, v8}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    .line 149
    new-instance v8, Lorg/json/JSONObject;

    invoke-direct {v8}, Lorg/json/JSONObject;-><init>()V

    .line 150
    const-string v11, "camera"

    invoke-virtual {v8, v5, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 151
    const-string v11, "\u76f8\u673a"

    invoke-virtual {v8, v4, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 152
    const-string v11, "\u626b\u4e00\u626b\u3001\u62cd\u7167\u3002\u529f\u80fd\u8fd8\u6ca1\u63a5\u5165\uff0c\u5148\u7559\u4f4d\u7f6e\u3002"

    invoke-virtual {v8, v3, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 153
    const-string v11, "android.permission.CAMERA"

    invoke-direct {p0, v11}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v11

    invoke-virtual {v8, v2, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 154
    invoke-virtual {v8, v1, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 155
    invoke-virtual {v7, v8}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    .line 157
    new-instance v8, Lorg/json/JSONObject;

    invoke-direct {v8}, Lorg/json/JSONObject;-><init>()V

    .line 158
    const-string v11, "loc"

    invoke-virtual {v8, v5, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 159
    const-string v11, "\u5927\u81f4\u4f4d\u7f6e"

    invoke-virtual {v8, v4, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 160
    const-string v11, "\u53d1\u4f4d\u7f6e\u65f6\u7528\u57ce\u5e02\u7ea7\u5b9a\u4f4d\uff0c\u8017\u7535\u5c11\u3002\u62d2\u7edd\u4e5f\u4e0d\u5f71\u54cd\u5176\u5b83\u529f\u80fd\u3002"

    invoke-virtual {v8, v3, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 161
    const-string v11, "android.permission.ACCESS_COARSE_LOCATION"

    invoke-direct {p0, v11}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v11

    invoke-virtual {v8, v2, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 162
    invoke-virtual {v8, v1, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 163
    invoke-virtual {v8, v0, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 164
    invoke-virtual {v7, v8}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    .line 166
    new-instance v8, Lorg/json/JSONObject;

    invoke-direct {v8}, Lorg/json/JSONObject;-><init>()V

    .line 167
    const-string v11, "locFine"

    invoke-virtual {v8, v5, v11}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 168
    const-string v5, "\u7cbe\u786e\u4f4d\u7f6e"

    invoke-virtual {v8, v4, v5}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 169
    const-string v4, "\u53d1\u4f4d\u7f6e\u65f6\u7ed9\u51fa\u8857\u9053\u7ea7\u5750\u6807\u3002\u4e0d\u7ed9\u5c31\u7528\u300c\u5927\u81f4\u4f4d\u7f6e\u300d\u3002"

    invoke-virtual {v8, v3, v4}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 170
    const-string v3, "android.permission.ACCESS_FINE_LOCATION"

    invoke-direct {p0, v3}, Ltt/xinjian/cn/XinJianBridge;->has(Ljava/lang/String;)Z

    move-result v3

    invoke-virtual {v8, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 171
    invoke-virtual {v8, v1, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 172
    invoke-virtual {v8, v0, v10}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 173
    invoke-virtual {v7, v8}, Lorg/json/JSONArray;->put(Ljava/lang/Object;)Lorg/json/JSONArray;

    .line 175
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    .line 176
    const-string v1, "sdk"

    invoke-virtual {v0, v1, v6}, Lorg/json/JSONObject;->put(Ljava/lang/String;I)Lorg/json/JSONObject;

    .line 177
    const-string v1, "items"

    invoke-virtual {v0, v1, v7}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 178
    const-string v1, "demo"

    invoke-virtual {v0, v1, v9}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 179
    invoke-virtual {v0}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object v0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    .line 181
    :catch_0
    const-string v0, "{\"demo\":false,\"items\":[]}"

    return-object v0
.end method

.method public pickFile()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 46
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v1, v0, Ltt/xinjian/cn/MainActivity;

    if-eqz v1, :cond_0

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->pickFile()V

    :cond_0
    return-void
.end method

.method public pickImage()V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 41
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    instance-of v1, v0, Ltt/xinjian/cn/MainActivity;

    if-eqz v1, :cond_0

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->pickImage()V

    :cond_0
    return-void
.end method

.method public read(Ljava/lang/String;)Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 303
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    if-eqz p1, :cond_0

    .line 304
    invoke-virtual {p1}, Ljava/io/File;->isFile()Z

    move-result v0

    if-eqz v0, :cond_0

    .line 305
    invoke-static {p1}, Ltt/xinjian/cn/XinJianBridge;->readText(Ljava/io/File;)Ljava/lang/String;

    move-result-object p1

    return-object p1

    .line 304
    :cond_0
    new-instance p1, Ljava/lang/IllegalStateException;

    const-string v0, "\u6587\u4ef6\u4e0d\u5b58\u5728"

    invoke-direct {p1, v0}, Ljava/lang/IllegalStateException;-><init>(Ljava/lang/String;)V

    throw p1
.end method

.method public remove(Ljava/lang/String;)Ljava/lang/String;
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 325
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    .line 326
    const-string v0, "false"

    if-eqz p1, :cond_1

    invoke-virtual {p1}, Ljava/io/File;->isFile()Z

    move-result v1

    if-nez v1, :cond_0

    goto :goto_0

    .line 327
    :cond_0
    invoke-virtual {p1}, Ljava/io/File;->delete()Z

    move-result p1

    if-eqz p1, :cond_1

    const-string p1, "true"

    return-object p1

    :cond_1
    :goto_0
    return-object v0
.end method

.method public rename(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 332
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    invoke-direct {p0, p2}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p2

    .line 333
    const-string v0, "false"

    if-eqz p1, :cond_1

    if-eqz p2, :cond_1

    invoke-virtual {p1}, Ljava/io/File;->isFile()Z

    move-result v1

    if-eqz v1, :cond_1

    invoke-virtual {p2}, Ljava/io/File;->exists()Z

    move-result v1

    if-eqz v1, :cond_0

    goto :goto_0

    .line 334
    :cond_0
    invoke-virtual {p1, p2}, Ljava/io/File;->renameTo(Ljava/io/File;)Z

    move-result p1

    if-eqz p1, :cond_1

    const-string p1, "true"

    return-object p1

    :cond_1
    :goto_0
    return-object v0
.end method

.method public rootPath()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 397
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->dir:Ljava/io/File;

    invoke-virtual {v0}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method public theme(Ljava/lang/String;)V
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 68
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/XinJianBridge;->ctx:Landroid/content/Context;

    check-cast v0, Ltt/xinjian/cn/MainActivity;

    const-string v1, "1"

    invoke-virtual {v1, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p1

    invoke-virtual {v0, p1}, Ltt/xinjian/cn/MainActivity;->applyTheme(Z)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void
.end method

.method public write(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 318
    invoke-direct {p0, p1}, Ltt/xinjian/cn/XinJianBridge;->resolve(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    .line 319
    const-string v0, "false"

    if-nez p1, :cond_0

    return-object v0

    .line 320
    :cond_0
    invoke-static {p1, p2}, Ltt/xinjian/cn/XinJianBridge;->writeText(Ljava/io/File;Ljava/lang/String;)Z

    move-result p1

    if-eqz p1, :cond_1

    const-string p1, "true"

    return-object p1

    :cond_1
    return-object v0
.end method
