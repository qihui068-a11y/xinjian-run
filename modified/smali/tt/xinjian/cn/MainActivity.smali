.class public Ltt/xinjian/cn/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"


# static fields
.field static final BG_DARK:I = -0xe1e1e2

.field static final BG_LIGHT:I = -0x1

.field private static final HOST:Ljava/lang/String; = "app.xinjian.local"

.field private static final MIME:Ljava/util/Map;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Ljava/util/Map<",
            "Ljava/lang/String;",
            "Ljava/lang/String;",
            ">;"
        }
    .end annotation
.end field

.field static final REQ_CAPTURE:I = 0x7d3

.field static final REQ_FILE_CHOOSER:I = 0x7d4

.field static final REQ_PICK_FILE:I = 0x7d2

.field static final REQ_PICK_IMAGE:I = 0x7d1

.field private static final START:Ljava/lang/String; = "https://app.xinjian.local/index.html"


# instance fields
.field private captureUri:Landroid/net/Uri;

.field private darkApplied:Ljava/lang/Boolean;

.field private filePathCallback:Landroid/webkit/ValueCallback;
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "Landroid/webkit/ValueCallback<",
            "[",
            "Landroid/net/Uri;",
            ">;"
        }
    .end annotation
.end field

.field private locListener:Landroid/location/LocationListener;

.field private lan:Ltt/xinjian/cn/LanBridge;

.field private keyboardViewport:Ltt/xinjian/cn/KeyboardViewport;

.field private pythonTerminal:Ltt/xinjian/cn/PythonTerminal;

.field private update:Ltt/xinjian/cn/UpdateBridge;

.field private web:Landroid/webkit/WebView;


# direct methods
.method static constructor <clinit>()V
    .locals 3

    .line 675
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    sput-object v0, Ltt/xinjian/cn/MainActivity;->MIME:Ljava/util/Map;

    .line 677
    const-string v1, "html"

    const-string v2, "text/html"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 678
    const-string v1, "htm"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 679
    const-string v1, "js"

    const-string v2, "application/javascript"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    const-string v1, "wasm"

    const-string v2, "application/wasm"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 680
    const-string v1, "css"

    const-string v2, "text/css"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 681
    const-string v1, "json"

    const-string v2, "application/json"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 682
    const-string v1, "svg"

    const-string v2, "image/svg+xml"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 683
    const-string v1, "png"

    const-string v2, "image/png"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 684
    const-string v1, "jpg"

    const-string v2, "image/jpeg"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 685
    const-string v1, "jpeg"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 686
    const-string v1, "webp"

    const-string v2, "image/webp"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 687
    const-string v1, "ico"

    const-string v2, "image/x-icon"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 688
    const-string v1, "woff"

    const-string v2, "font/woff"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 689
    const-string v1, "woff2"

    const-string v2, "font/woff2"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 690
    const-string v1, "ttf"

    const-string v2, "font/ttf"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 691
    const-string v1, "txt"

    const-string v2, "text/plain"

    invoke-interface {v0, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    return-void
.end method

.method public constructor <init>()V
    .locals 1

    .line 57
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    const/4 v0, 0x0

    .line 73
    iput-object v0, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    .line 77
    iput-object v0, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    .line 78
    iput-object v0, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    .line 387
    iput-object v0, p0, Ltt/xinjian/cn/MainActivity;->darkApplied:Ljava/lang/Boolean;

    return-void
.end method

.method static synthetic access$000(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/WebView;
    .locals 0

    .line 57
    iget-object p0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    return-object p0
.end method

.method static synthetic access$100(Ltt/xinjian/cn/MainActivity;Landroid/location/Location;Z)V
    .locals 0

    .line 57
    invoke-direct {p0, p1, p2}, Ltt/xinjian/cn/MainActivity;->locOk(Landroid/location/Location;Z)V

    return-void
.end method

.method static synthetic access$200(Ltt/xinjian/cn/MainActivity;)V
    .locals 0

    .line 57
    invoke-direct {p0}, Ltt/xinjian/cn/MainActivity;->stopLoc()V

    return-void
.end method

.method static synthetic access$300(Ltt/xinjian/cn/MainActivity;)Landroid/location/LocationListener;
    .locals 0

    .line 57
    iget-object p0, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    return-object p0
.end method

.method static synthetic access$400(Ltt/xinjian/cn/MainActivity;Ljava/lang/String;)V
    .locals 0

    .line 57
    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->locFail(Ljava/lang/String;)V

    return-void
.end method

.method static synthetic access$500(Ltt/xinjian/cn/MainActivity;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    .locals 0

    .line 57
    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->serve(Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;

    move-result-object p0

    return-object p0
.end method

.method static synthetic access$600(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/ValueCallback;
    .locals 0

    .line 57
    iget-object p0, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    return-object p0
.end method

.method static synthetic access$602(Ltt/xinjian/cn/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;
    .locals 0

    .line 57
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    return-object p1
.end method

.method private askExportPermission()V
    .locals 2

    .line 669
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x17

    if-lt v0, v1, :cond_2

    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1d

    if-lt v0, v1, :cond_0

    goto :goto_0

    .line 670
    :cond_0
    const-string v0, "android.permission.WRITE_EXTERNAL_STORAGE"

    invoke-virtual {p0, v0}, Ltt/xinjian/cn/MainActivity;->checkSelfPermission(Ljava/lang/String;)I

    move-result v1

    if-nez v1, :cond_1

    goto :goto_0

    .line 672
    :cond_1
    filled-new-array {v0}, [Ljava/lang/String;

    move-result-object v0

    const/16 v1, 0x3e9

    invoke-virtual {p0, v0, v1}, Ltt/xinjian/cn/MainActivity;->requestPermissions([Ljava/lang/String;I)V

    :cond_2
    :goto_0
    return-void
.end method

.method private copyToMedia(Landroid/net/Uri;Ljava/lang/String;)Ljava/io/File;
    .locals 10

    const/4 v1, 0x0

    .line 222
    :try_start_0
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v2
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_9
    .catchall {:try_start_0 .. :try_end_0} :catchall_4

    const/4 v6, 0x0

    const/4 v7, 0x0

    const/4 v4, 0x0

    const/4 v5, 0x0

    move-object v3, p1

    .line 226
    :try_start_1
    invoke-virtual/range {v2 .. v7}, Landroid/content/ContentResolver;->query(Landroid/net/Uri;[Ljava/lang/String;Ljava/lang/String;[Ljava/lang/String;Ljava/lang/String;)Landroid/database/Cursor;

    move-result-object p1
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    if-eqz p1, :cond_0

    .line 227
    :try_start_2
    invoke-interface {p1}, Landroid/database/Cursor;->moveToFirst()Z

    move-result v0

    if-eqz v0, :cond_0

    .line 228
    const-string v0, "_display_name"

    invoke-interface {p1, v0}, Landroid/database/Cursor;->getColumnIndex(Ljava/lang/String;)I

    move-result v0

    if-ltz v0, :cond_0

    .line 229
    invoke-interface {p1, v0}, Landroid/database/Cursor;->getString(I)Ljava/lang/String;

    move-result-object v0
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    goto :goto_0

    :catchall_0
    move-exception v0

    move-object p2, v0

    goto :goto_1

    :catch_0
    nop

    goto :goto_2

    :cond_0
    move-object v0, v1

    :goto_0
    if-eqz p1, :cond_3

    .line 232
    :try_start_3
    invoke-interface {p1}, Landroid/database/Cursor;->close()V

    goto :goto_3

    :catchall_1
    move-exception v0

    move-object p2, v0

    move-object p1, v1

    :goto_1
    if-eqz p1, :cond_1

    invoke-interface {p1}, Landroid/database/Cursor;->close()V

    :cond_1
    throw p2

    :catch_1
    nop

    move-object p1, v1

    :goto_2
    if-eqz p1, :cond_2

    invoke-interface {p1}, Landroid/database/Cursor;->close()V
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_9
    .catchall {:try_start_3 .. :try_end_3} :catchall_4

    :cond_2
    move-object v0, v1

    .line 234
    :cond_3
    :goto_3
    const-string p1, "_"

    if-eqz v0, :cond_4

    :try_start_4
    invoke-virtual {v0}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v4}, Ljava/lang/String;->length()I

    move-result v4

    if-nez v4, :cond_6

    .line 235
    :cond_4
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v4

    invoke-virtual {v0, v4, v5}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v4, "image"

    invoke-virtual {v4, p2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p2

    if-eqz p2, :cond_5

    const-string p2, ".jpg"

    goto :goto_4

    :cond_5
    const-string p2, ".bin"

    :goto_4
    invoke-virtual {v0, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 237
    :cond_6
    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->safeName(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p2

    .line 239
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->mediaDir()Ljava/io/File;

    move-result-object v0

    .line 240
    new-instance v4, Ljava/io/File;

    invoke-direct {v4, v0, p2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    const/4 v5, 0x1

    .line 242
    :goto_5
    invoke-virtual {v4}, Ljava/io/File;->exists()Z

    move-result v6

    const/4 v7, 0x0

    if-eqz v6, :cond_9

    const/16 v4, 0x2e

    .line 243
    invoke-virtual {p2, v4}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v4

    if-lez v4, :cond_7

    .line 244
    invoke-virtual {p2, v7, v4}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v6

    goto :goto_6

    :cond_7
    move-object v6, p2

    :goto_6
    if-lez v4, :cond_8

    .line 245
    invoke-virtual {p2, v4}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v4

    goto :goto_7

    :cond_8
    const-string v4, ""

    .line 246
    :goto_7
    new-instance v7, Ljava/io/File;

    new-instance v8, Ljava/lang/StringBuilder;

    invoke-direct {v8}, Ljava/lang/StringBuilder;-><init>()V

    invoke-virtual {v8, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v8, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    add-int/lit8 v6, v5, 0x1

    invoke-virtual {v8, v5}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    invoke-virtual {v8, v4}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v8}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v4

    invoke-direct {v7, v0, v4}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    move v5, v6

    move-object v4, v7

    goto :goto_5

    .line 249
    :cond_9
    invoke-virtual {v2, v3}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object p1
    :try_end_4
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4} :catch_9
    .catchall {:try_start_4 .. :try_end_4} :catchall_4

    if-nez p1, :cond_b

    if-eqz p1, :cond_a

    .line 261
    :try_start_5
    invoke-virtual {p1}, Ljava/io/InputStream;->close()V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_5} :catch_2

    :catch_2
    :cond_a
    return-object v1

    .line 251
    :cond_b
    :try_start_6
    new-instance p2, Ljava/io/FileOutputStream;

    invoke-direct {p2, v4}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_3

    const/16 v0, 0x2000

    .line 252
    :try_start_7
    new-array v0, v0, [B

    .line 254
    :goto_8
    invoke-virtual {p1, v0}, Ljava/io/InputStream;->read([B)I

    move-result v2

    if-lez v2, :cond_c

    invoke-virtual {p2, v0, v7, v2}, Ljava/io/FileOutputStream;->write([BII)V

    goto :goto_8

    .line 255
    :cond_c
    invoke-virtual {p2}, Ljava/io/FileOutputStream;->flush()V
    :try_end_7
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_7} :catch_5
    .catchall {:try_start_7 .. :try_end_7} :catchall_2

    .line 260
    :try_start_8
    invoke-virtual {p2}, Ljava/io/FileOutputStream;->close()V
    :try_end_8
    .catch Ljava/lang/Exception; {:try_start_8 .. :try_end_8} :catch_3

    goto :goto_9

    :catch_3
    nop

    :goto_9
    if-eqz p1, :cond_d

    .line 261
    :try_start_9
    invoke-virtual {p1}, Ljava/io/InputStream;->close()V
    :try_end_9
    .catch Ljava/lang/Exception; {:try_start_9 .. :try_end_9} :catch_4

    :catch_4
    :cond_d
    return-object v4

    :catchall_2
    move-exception v0

    move-object v1, p2

    move-object p2, p1

    move-object p1, v0

    goto :goto_a

    :catch_5
    nop

    goto :goto_c

    :catchall_3
    move-exception v0

    move-object p2, v0

    move-object v9, p2

    move-object p2, p1

    move-object p1, v9

    goto :goto_a

    :catch_6
    nop

    move-object p2, v1

    goto :goto_c

    :catchall_4
    move-exception v0

    move-object p1, v0

    move-object p2, v1

    :goto_a
    if-eqz v1, :cond_e

    .line 260
    :try_start_a
    invoke-virtual {v1}, Ljava/io/FileOutputStream;->close()V
    :try_end_a
    .catch Ljava/lang/Exception; {:try_start_a .. :try_end_a} :catch_7

    goto :goto_b

    :catch_7
    nop

    :cond_e
    :goto_b
    if-eqz p2, :cond_f

    .line 261
    :try_start_b
    invoke-virtual {p2}, Ljava/io/InputStream;->close()V
    :try_end_b
    .catch Ljava/lang/Exception; {:try_start_b .. :try_end_b} :catch_8

    .line 262
    :catch_8
    :cond_f
    throw p1

    :catch_9
    nop

    move-object p1, v1

    move-object p2, p1

    :goto_c
    if-eqz p2, :cond_10

    .line 260
    :try_start_c
    invoke-virtual {p2}, Ljava/io/FileOutputStream;->close()V
    :try_end_c
    .catch Ljava/lang/Exception; {:try_start_c .. :try_end_c} :catch_a

    goto :goto_d

    :catch_a
    nop

    :cond_10
    :goto_d
    if-eqz p1, :cond_11

    .line 261
    :try_start_d
    invoke-virtual {p1}, Ljava/io/InputStream;->close()V
    :try_end_d
    .catch Ljava/lang/Exception; {:try_start_d .. :try_end_d} :catch_b

    :catch_b
    :cond_11
    return-object v1
.end method

.method private locFail(Ljava/lang/String;)V
    .locals 4

    const-string v0, "window.__xjLoc&&window.__xjLoc("

    .line 358
    :try_start_0
    new-instance v1, Lorg/json/JSONObject;

    invoke-direct {v1}, Lorg/json/JSONObject;-><init>()V

    .line 359
    const-string v2, "ok"

    const/4 v3, 0x0

    invoke-virtual {v1, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 360
    const-string v2, "why"

    invoke-virtual {v1, v2, p1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 361
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ")"

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p0, p1}, Ltt/xinjian/cn/MainActivity;->toJs(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void
.end method

.method private locOk(Landroid/location/Location;Z)V
    .locals 5

    const-string v0, "window.__xjLoc&&window.__xjLoc("

    .line 343
    :try_start_0
    new-instance v1, Lorg/json/JSONObject;

    invoke-direct {v1}, Lorg/json/JSONObject;-><init>()V

    .line 344
    const-string v2, "ok"

    const/4 v3, 0x1

    invoke-virtual {v1, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 345
    const-string v2, "lat"

    invoke-virtual {p1}, Landroid/location/Location;->getLatitude()D

    move-result-wide v3

    invoke-virtual {v1, v2, v3, v4}, Lorg/json/JSONObject;->put(Ljava/lang/String;D)Lorg/json/JSONObject;

    .line 346
    const-string v2, "lon"

    invoke-virtual {p1}, Landroid/location/Location;->getLongitude()D

    move-result-wide v3

    invoke-virtual {v1, v2, v3, v4}, Lorg/json/JSONObject;->put(Ljava/lang/String;D)Lorg/json/JSONObject;

    .line 347
    const-string v2, "acc"

    invoke-virtual {p1}, Landroid/location/Location;->getAccuracy()F

    move-result v3

    invoke-static {v3}, Ljava/lang/Math;->round(F)I

    move-result v3

    invoke-virtual {v1, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;I)Lorg/json/JSONObject;

    .line 348
    const-string v2, "fine"

    invoke-virtual {v1, v2, p2}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 349
    const-string p2, "t"

    invoke-virtual {p1}, Landroid/location/Location;->getTime()J

    move-result-wide v2

    invoke-virtual {v1, p2, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 350
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-static {p2}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p2, ")"

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p0, p1}, Ltt/xinjian/cn/MainActivity;->toJs(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    .line 352
    :catch_0
    const-string p1, "json"

    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->locFail(Ljava/lang/String;)V

    return-void
.end method

.method private static mimeOf(Ljava/lang/String;)Ljava/lang/String;
    .locals 2

    const/16 v0, 0x2e

    .line 695
    invoke-virtual {p0, v0}, Ljava/lang/String;->lastIndexOf(I)I

    move-result v0

    if-ltz v0, :cond_0

    .line 696
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v1

    add-int/lit8 v1, v1, -0x1

    if-ge v0, v1, :cond_0

    add-int/lit8 v0, v0, 0x1

    .line 697
    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    sget-object v0, Ljava/util/Locale;->ROOT:Ljava/util/Locale;

    invoke-virtual {p0, v0}, Ljava/lang/String;->toLowerCase(Ljava/util/Locale;)Ljava/lang/String;

    move-result-object p0

    goto :goto_0

    :cond_0
    const-string p0, ""

    .line 698
    :goto_0
    sget-object v0, Ltt/xinjian/cn/MainActivity;->MIME:Ljava/util/Map;

    invoke-interface {v0, p0}, Ljava/util/Map;->get(Ljava/lang/Object;)Ljava/lang/Object;

    move-result-object p0

    check-cast p0, Ljava/lang/String;

    if-nez p0, :cond_1

    .line 699
    const-string p0, "application/octet-stream"

    :cond_1
    return-object p0
.end method

.method private pickFail(Ljava/lang/String;)V
    .locals 4

    const-string v0, "window.__xjPick&&window.__xjPick("

    .line 99
    :try_start_0
    new-instance v1, Lorg/json/JSONObject;

    invoke-direct {v1}, Lorg/json/JSONObject;-><init>()V

    .line 100
    const-string v2, "ok"

    const/4 v3, 0x0

    invoke-virtual {v1, v2, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 101
    const-string v2, "why"

    invoke-virtual {v1, v2, p1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 102
    new-instance p1, Ljava/lang/StringBuilder;

    invoke-direct {p1, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string v0, ")"

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p0, p1}, Ltt/xinjian/cn/MainActivity;->toJs(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void
.end method

.method private static safeName(Ljava/lang/String;)Ljava/lang/String;
    .locals 4

    const/16 v0, 0x5c

    const/16 v1, 0x5f

    .line 267
    invoke-virtual {p0, v0, v1}, Ljava/lang/String;->replace(CC)Ljava/lang/String;

    move-result-object p0

    const/16 v0, 0x2f

    invoke-virtual {p0, v0, v1}, Ljava/lang/String;->replace(CC)Ljava/lang/String;

    move-result-object p0

    const-string v0, ".."

    const-string v1, "_"

    invoke-virtual {p0, v0, v1}, Ljava/lang/String;->replace(Ljava/lang/CharSequence;Ljava/lang/CharSequence;)Ljava/lang/String;

    move-result-object p0

    .line 268
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const/4 v1, 0x0

    .line 269
    :goto_0
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v2

    if-ge v1, v2, :cond_1

    .line 270
    invoke-virtual {p0, v1}, Ljava/lang/String;->charAt(I)C

    move-result v2

    const/16 v3, 0x20

    if-ge v2, v3, :cond_0

    goto :goto_1

    .line 272
    :cond_0
    invoke-virtual {v0, v2}, Ljava/lang/StringBuilder;->append(C)Ljava/lang/StringBuilder;

    :goto_1
    add-int/lit8 v1, v1, 0x1

    goto :goto_0

    .line 274
    :cond_1
    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p0

    invoke-virtual {p0}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p0

    .line 275
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v0

    if-nez v0, :cond_2

    const-string p0, "file"

    .line 276
    :cond_2
    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v0

    const/16 v1, 0x50

    if-le v0, v1, :cond_3

    invoke-virtual {p0}, Ljava/lang/String;->length()I

    move-result v0

    sub-int/2addr v0, v1

    invoke-virtual {p0, v0}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p0

    :cond_3
    return-object p0
.end method

.method private serve(Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    .locals 12

    const/4 v0, 0x0

    if-eqz p1, :cond_6

    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->pythonTerminal:Ltt/xinjian/cn/PythonTerminal;

    if-eqz v1, :serve_asset

    invoke-virtual {v1, p1}, Ltt/xinjian/cn/PythonTerminal;->serve(Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;

    move-result-object v1

    if-eqz v1, :serve_asset

    return-object v1

    :serve_asset
    .line 704
    const-string v1, "app.xinjian.local"

    invoke-virtual {p1}, Landroid/net/Uri;->getHost()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v1, v2}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-nez v1, :cond_0

    goto/16 :goto_0

    .line 705
    :cond_0
    invoke-virtual {p1}, Landroid/net/Uri;->getPath()Ljava/lang/String;

    move-result-object p1

    if-eqz p1, :cond_1

    .line 706
    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v1

    if-eqz v1, :cond_1

    const-string v1, "/"

    invoke-virtual {v1, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v1

    if-eqz v1, :cond_2

    :cond_1
    const-string p1, "/index.html"

    .line 708
    :cond_2
    const-string v1, "/media/"

    invoke-virtual {p1, v1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v1

    const-string v2, "no-cache"

    const-string v3, "Cache-Control"

    const-string v4, "404"

    if-eqz v1, :cond_5

    const/4 v1, 0x7

    .line 710
    :try_start_0
    invoke-virtual {p1, v1}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object p1

    const/16 v1, 0x2f

    .line 711
    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(I)I

    move-result v1

    if-gez v1, :cond_4

    const-string v1, ".."

    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v1

    if-gez v1, :cond_4

    .line 712
    new-instance v1, Ljava/io/File;

    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->mediaDir()Ljava/io/File;

    move-result-object v5

    invoke-direct {v1, v5, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 713
    invoke-virtual {v1}, Ljava/io/File;->isFile()Z

    move-result v5

    if-eqz v5, :cond_3

    .line 714
    new-instance v5, Landroid/webkit/WebResourceResponse;

    invoke-static {p1}, Ltt/xinjian/cn/MainActivity;->mimeOf(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    new-instance v6, Ljava/io/FileInputStream;

    invoke-direct {v6, v1}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    invoke-direct {v5, p1, v0, v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V

    .line 715
    new-instance p1, Ljava/util/HashMap;

    invoke-direct {p1}, Ljava/util/HashMap;-><init>()V

    .line 716
    invoke-interface {p1, v3, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 717
    invoke-virtual {v5, p1}, Landroid/webkit/WebResourceResponse;->setResponseHeaders(Ljava/util/Map;)V

    return-object v5

    .line 713
    :cond_3
    new-instance p1, Ljava/io/IOException;

    const-string v0, "not a file"

    invoke-direct {p1, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1

    .line 711
    :cond_4
    new-instance p1, Ljava/io/IOException;

    const-string v0, "bad name"

    invoke-direct {p1, v0}, Ljava/io/IOException;-><init>(Ljava/lang/String;)V

    throw p1
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 720
    :catch_0
    new-instance v5, Landroid/webkit/WebResourceResponse;

    new-instance v10, Ljava/util/HashMap;

    invoke-direct {v10}, Ljava/util/HashMap;-><init>()V

    new-instance v11, Ljava/io/ByteArrayInputStream;

    .line 722
    invoke-virtual {v4}, Ljava/lang/String;->getBytes()[B

    move-result-object p1

    invoke-direct {v11, p1}, Ljava/io/ByteArrayInputStream;-><init>([B)V

    const-string v6, "text/plain"

    const-string v7, "UTF-8"

    const/16 v8, 0x194

    const-string v9, "Not Found"

    invoke-direct/range {v5 .. v11}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V

    return-object v5

    .line 725
    :cond_5
    move-object v6, p1

    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->serveDev(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;

    move-result-object v5

    if-eqz v5, :serve_asset_only

    return-object v5

    :serve_asset_only
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v1, "www"

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 727
    :try_start_1
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getAssets()Landroid/content/res/AssetManager;

    move-result-object v1

    invoke-virtual {v1, v0}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;

    move-result-object v0

    .line 728
    new-instance v1, Landroid/webkit/WebResourceResponse;

    invoke-static {p1}, Ltt/xinjian/cn/MainActivity;->mimeOf(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    const-string v5, "UTF-8"

    invoke-direct {v1, p1, v5, v0}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V

    .line 729
    new-instance p1, Ljava/util/HashMap;

    invoke-direct {p1}, Ljava/util/HashMap;-><init>()V

    .line 730
    invoke-interface {p1, v3, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    invoke-static {v6, p1}, Ltt/xinjian/cn/MainActivity;->pythonRunnerHeaders(Ljava/lang/String;Ljava/util/Map;)V

    .line 731
    invoke-virtual {v1, p1}, Landroid/webkit/WebResourceResponse;->setResponseHeaders(Ljava/util/Map;)V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_1

    return-object v1

    .line 734
    :catch_1
    new-instance v5, Landroid/webkit/WebResourceResponse;

    new-instance v10, Ljava/util/HashMap;

    invoke-direct {v10}, Ljava/util/HashMap;-><init>()V

    new-instance v11, Ljava/io/ByteArrayInputStream;

    .line 736
    invoke-virtual {v4}, Ljava/lang/String;->getBytes()[B

    move-result-object p1

    invoke-direct {v11, p1}, Ljava/io/ByteArrayInputStream;-><init>([B)V

    const-string v6, "text/plain"

    const-string v7, "UTF-8"

    const/16 v8, 0x194

    const-string v9, "Not Found"

    invoke-direct/range {v5 .. v11}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V

    return-object v5

    :cond_6
    :goto_0
    return-object v0
.end method

.method private devEnabled()Z
    .locals 4

    const/4 v0, 0x0

    :try_start_dev_enabled
    const/4 v1, 0x0

    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v1

    if-eqz v1, :dev_enabled_end

    new-instance v2, Ljava/io/File;

    const-string v3, "dev.flag"

    invoke-direct {v2, v1, v3}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-virtual {v2}, Ljava/io/File;->isFile()Z

    move-result v3

    move v0, v3

    :dev_enabled_end
    :try_end_dev_enabled
    .catch Ljava/lang/Exception; {:try_start_dev_enabled .. :try_end_dev_enabled} :dev_enabled_catch

    return v0

    :dev_enabled_catch
    const/4 v0, 0x0

    return v0
.end method

.method private serveDev(Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 7

    const/4 v0, 0x0

    invoke-direct {p0}, Ltt/xinjian/cn/MainActivity;->devEnabled()Z

    move-result v1

    if-eqz v1, :dev_null

    :try_start_dev_serve
    const/4 v2, 0x0

    invoke-virtual {p0, v2}, Ltt/xinjian/cn/MainActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v1

    if-eqz v1, :dev_null

    new-instance v2, Ljava/io/File;

    const-string v3, "www"

    invoke-direct {v2, v1, v3}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    new-instance v1, Ljava/io/File;

    const/4 v3, 0x1

    invoke-virtual {p1, v3}, Ljava/lang/String;->substring(I)Ljava/lang/String;

    move-result-object v3

    invoke-direct {v1, v2, v3}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    invoke-virtual {v1}, Ljava/io/File;->isFile()Z

    move-result v2

    if-eqz v2, :dev_null

    new-instance v2, Landroid/webkit/WebResourceResponse;

    invoke-static {p1}, Ltt/xinjian/cn/MainActivity;->mimeOf(Ljava/lang/String;)Ljava/lang/String;

    move-result-object v3

    new-instance v4, Ljava/io/FileInputStream;

    invoke-direct {v4, v1}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V

    const-string v5, "UTF-8"

    invoke-direct {v2, v3, v5, v4}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/io/InputStream;)V

    new-instance v3, Ljava/util/HashMap;

    invoke-direct {v3}, Ljava/util/HashMap;-><init>()V

    const-string v4, "Cache-Control"

    const-string v5, "no-cache"

    invoke-interface {v3, v4, v5}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    # 本地 Python 要求 /python-worker.js 带 CSP、/index.html 带 COOP+COEP，
    # 否则页面拿不到 SharedArrayBuffer，input() 只能退回预填输入。
    invoke-static {p1, v3}, Ltt/xinjian/cn/MainActivity;->pythonRunnerHeaders(Ljava/lang/String;Ljava/util/Map;)V

    invoke-virtual {v2, v3}, Landroid/webkit/WebResourceResponse;->setResponseHeaders(Ljava/util/Map;)V

    move-object v0, v2
    :dev_null
    :try_end_dev_serve
    .catch Ljava/lang/Exception; {:try_start_dev_serve .. :try_end_dev_serve} :dev_serve_catch

    return-object v0

    :dev_serve_catch
    const/4 v0, 0x0

    return-object v0
.end method

.method private static pythonRunnerHeaders(Ljava/lang/String;Ljava/util/Map;)V
    .locals 3

    const-string v0, "/python-worker.js"

    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :index

    const-string v1, "Content-Security-Policy"

    const-string v2, "default-src 'none'; script-src 'wasm-unsafe-eval' https://app.xinjian.local/python-runtime/; connect-src https://app.xinjian.local/python-runtime/; worker-src 'none'"

    invoke-interface {p1, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    goto :coep

    :index
    const-string v0, "/index.html"

    invoke-virtual {v0, p0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :done

    const-string v1, "Cross-Origin-Opener-Policy"

    const-string v2, "same-origin"

    invoke-interface {p1, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    :coep
    const-string v1, "Cross-Origin-Embedder-Policy"

    const-string v2, "require-corp"

    invoke-interface {p1, v1, v2}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    :done
    return-void
.end method

.method private stopLoc()V
    .locals 2

    .line 334
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    if-eqz v0, :cond_0

    .line 335
    const-string v0, "location"

    invoke-virtual {p0, v0}, Ltt/xinjian/cn/MainActivity;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/location/LocationManager;

    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    invoke-virtual {v0, v1}, Landroid/location/LocationManager;->removeUpdates(Landroid/location/LocationListener;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    :cond_0
    const/4 v0, 0x0

    .line 338
    iput-object v0, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    return-void
.end method


# virtual methods
.method applyTheme(Z)V
    .locals 3

    if-eqz p1, :cond_0

    const v0, -0xe1e1e2

    goto :goto_0

    :cond_0
    const/4 v0, -0x1

    .line 425
    :goto_0
    :try_start_0
    const-string v1, "xj"

    const/4 v2, 0x0

    invoke-virtual {p0, v1, v2}, Ltt/xinjian/cn/MainActivity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object v1

    invoke-interface {v1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object v1

    const-string v2, "xj_dark"

    invoke-interface {v1, v2, p1}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;

    move-result-object v1

    invoke-interface {v1}, Landroid/content/SharedPreferences$Editor;->apply()V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    :catch_0
    nop

    .line 430
    :goto_1
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->darkApplied:Ljava/lang/Boolean;

    if-eqz v1, :cond_1

    invoke-virtual {v1}, Ljava/lang/Boolean;->booleanValue()Z

    move-result v1

    if-ne v1, p1, :cond_1

    return-void

    .line 431
    :cond_1
    invoke-static {p1}, Ljava/lang/Boolean;->valueOf(Z)Ljava/lang/Boolean;

    move-result-object v1

    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->darkApplied:Ljava/lang/Boolean;

    .line 432
    new-instance v1, Ltt/xinjian/cn/MainActivity$4;

    invoke-direct {v1, p0, v0, p1}, Ltt/xinjian/cn/MainActivity$4;-><init>(Ltt/xinjian/cn/MainActivity;IZ)V

    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method

.method capture()V
    .locals 4

    const-string v0, "cam_"

    .line 139
    :try_start_0
    sget v1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v2, 0x17

    if-lt v1, v2, :cond_0

    const-string v1, "android.permission.CAMERA"

    .line 140
    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->checkSelfPermission(Ljava/lang/String;)I

    move-result v1

    if-eqz v1, :cond_0

    .line 141
    const-string v0, "perm"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void

    .line 144
    :cond_0
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v2

    invoke-virtual {v1, v2, v3}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    const-string v0, ".jpg"

    invoke-virtual {v1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    .line 145
    new-instance v1, Landroid/content/ContentValues;

    invoke-direct {v1}, Landroid/content/ContentValues;-><init>()V

    .line 146
    const-string v2, "_display_name"

    invoke-virtual {v1, v2, v0}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 147
    const-string v0, "mime_type"

    const-string v2, "image/jpeg"

    invoke-virtual {v1, v0, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 148
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v0

    sget-object v2, Landroid/provider/MediaStore$Images$Media;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    invoke-virtual {v0, v2, v1}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    if-nez v0, :cond_1

    .line 149
    const-string v0, "nopicker"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void

    .line 150
    :cond_1
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.media.action.IMAGE_CAPTURE"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 151
    const-string v1, "output"

    iget-object v2, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    invoke-virtual {v0, v1, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    const/4 v1, 0x3

    .line 152
    invoke-virtual {v0, v1}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    const/16 v1, 0x7d3

    .line 153
    invoke-virtual {p0, v0, v1}, Ltt/xinjian/cn/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    .line 155
    :catch_0
    const-string v0, "nocamera"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void
.end method

.method insetsJson()Ljava/lang/String;
    .locals 4

    const/4 v0, 0x0

    .line 395
    :try_start_0
    sget v1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v2, 0x1e

    if-lt v1, v2, :cond_0

    .line 397
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v1

    invoke-virtual {v1}, Landroid/view/Window;->getDecorView()Landroid/view/View;

    move-result-object v1

    invoke-virtual {v1}, Landroid/view/View;->getRootWindowInsets()Landroid/view/WindowInsets;

    move-result-object v1

    if-eqz v1, :cond_1

    .line 400
    invoke-static {}, Landroid/view/WindowInsets$Type;->systemBars()I

    move-result v2

    invoke-virtual {v1, v2}, Landroid/view/WindowInsets;->getInsets(I)Landroid/graphics/Insets;

    move-result-object v1

    .line 401
    iget v2, v1, Landroid/graphics/Insets;->top:I
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 402
    :try_start_1
    iget v0, v1, Landroid/graphics/Insets;->bottom:I
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1

    :goto_0
    move v1, v0

    move v0, v2

    goto :goto_1

    .line 406
    :cond_0
    :try_start_2
    new-instance v1, Landroid/graphics/Rect;

    invoke-direct {v1}, Landroid/graphics/Rect;-><init>()V

    .line 407
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v2

    invoke-virtual {v2}, Landroid/view/Window;->getDecorView()Landroid/view/View;

    move-result-object v2

    invoke-virtual {v2, v1}, Landroid/view/View;->getWindowVisibleDisplayFrame(Landroid/graphics/Rect;)V

    .line 408
    iget v2, v1, Landroid/graphics/Rect;->top:I
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_0

    .line 409
    :try_start_3
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getResources()Landroid/content/res/Resources;

    move-result-object v3

    invoke-virtual {v3}, Landroid/content/res/Resources;->getDisplayMetrics()Landroid/util/DisplayMetrics;

    move-result-object v3

    iget v3, v3, Landroid/util/DisplayMetrics;->heightPixels:I

    .line 410
    iget v1, v1, Landroid/graphics/Rect;->bottom:I

    sub-int/2addr v3, v1

    invoke-static {v0, v3}, Ljava/lang/Math;->max(II)I

    move-result v0
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_1

    goto :goto_0

    :catch_0
    const/4 v2, 0x0

    :catch_1
    move v0, v2

    :cond_1
    const/4 v1, 0x0

    .line 413
    :goto_1
    new-instance v2, Ljava/lang/StringBuilder;

    const-string v3, "{\"top\":"

    invoke-direct {v2, v3}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v0, ",\"bottom\":"

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2, v1}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    const-string v0, "}"

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    return-object v0
.end method

.method locate()V
    .locals 12

    .line 284
    :try_start_0
    const-string v0, "location"

    invoke-virtual {p0, v0}, Ltt/xinjian/cn/MainActivity;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v0

    check-cast v0, Landroid/location/LocationManager;

    if-nez v0, :cond_0

    .line 285
    const-string v0, "noservice"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->locFail(Ljava/lang/String;)V

    return-void

    .line 287
    :cond_0
    sget v1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v2, 0x17

    const/4 v3, 0x0

    const/4 v4, 0x1

    if-lt v1, v2, :cond_2

    const-string v1, "android.permission.ACCESS_FINE_LOCATION"

    .line 288
    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->checkSelfPermission(Ljava/lang/String;)I

    move-result v1

    if-nez v1, :cond_1

    goto :goto_0

    :cond_1
    const/4 v1, 0x0

    goto :goto_1

    :cond_2
    :goto_0
    const/4 v1, 0x1

    .line 289
    :goto_1
    sget v5, Landroid/os/Build$VERSION;->SDK_INT:I

    if-lt v5, v2, :cond_4

    const-string v2, "android.permission.ACCESS_COARSE_LOCATION"

    .line 290
    invoke-virtual {p0, v2}, Ltt/xinjian/cn/MainActivity;->checkSelfPermission(Ljava/lang/String;)I

    move-result v2

    if-nez v2, :cond_3

    goto :goto_2

    :cond_3
    const/4 v2, 0x0

    goto :goto_3

    :cond_4
    :goto_2
    const/4 v2, 0x1

    :goto_3
    if-nez v1, :cond_5

    if-nez v2, :cond_5

    .line 291
    const-string v0, "perm"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->locFail(Ljava/lang/String;)V

    return-void

    .line 295
    :cond_5
    const-string v2, "gps"

    const-string v5, "network"

    const-string v6, "passive"

    filled-new-array {v2, v5, v6}, [Ljava/lang/String;

    move-result-object v2
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_1

    const/4 v5, 0x0

    :goto_4
    const/4 v6, 0x3

    if-ge v3, v6, :cond_9

    .line 301
    :try_start_1
    aget-object v6, v2, v3

    invoke-virtual {v0, v6}, Landroid/location/LocationManager;->isProviderEnabled(Ljava/lang/String;)Z

    move-result v6

    if-nez v6, :cond_6

    goto :goto_5

    .line 302
    :cond_6
    aget-object v6, v2, v3

    invoke-virtual {v0, v6}, Landroid/location/LocationManager;->getLastKnownLocation(Ljava/lang/String;)Landroid/location/Location;

    move-result-object v6

    if-eqz v6, :cond_8

    if-eqz v5, :cond_7

    .line 303
    invoke-virtual {v6}, Landroid/location/Location;->getTime()J

    move-result-wide v7

    invoke-virtual {v5}, Landroid/location/Location;->getTime()J

    move-result-wide v9
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_0

    cmp-long v11, v7, v9

    if-lez v11, :cond_8

    :cond_7
    move-object v5, v6

    :catch_0
    :cond_8
    :goto_5
    add-int/lit8 v3, v3, 0x1

    goto :goto_4

    :cond_9
    if-eqz v5, :cond_a

    .line 306
    :try_start_2
    invoke-direct {p0, v5, v1}, Ltt/xinjian/cn/MainActivity;->locOk(Landroid/location/Location;Z)V

    goto :goto_7

    .line 310
    :cond_a
    new-instance v2, Ltt/xinjian/cn/MainActivity$2;

    invoke-direct {v2, p0, v1}, Ltt/xinjian/cn/MainActivity$2;-><init>(Ltt/xinjian/cn/MainActivity;Z)V

    iput-object v2, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    .line 319
    new-instance v2, Landroid/location/Criteria;

    invoke-direct {v2}, Landroid/location/Criteria;-><init>()V

    if-eqz v1, :cond_b

    goto :goto_6

    :cond_b
    const/4 v4, 0x2

    .line 320
    :goto_6
    invoke-virtual {v2, v4}, Landroid/location/Criteria;->setAccuracy(I)V

    .line 321
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->locListener:Landroid/location/LocationListener;

    invoke-static {}, Landroid/os/Looper;->getMainLooper()Landroid/os/Looper;

    move-result-object v3

    invoke-virtual {v0, v2, v1, v3}, Landroid/location/LocationManager;->requestSingleUpdate(Landroid/location/Criteria;Landroid/location/LocationListener;Landroid/os/Looper;)V

    .line 322
    new-instance v0, Landroid/os/Handler;

    invoke-static {}, Landroid/os/Looper;->getMainLooper()Landroid/os/Looper;

    move-result-object v1

    invoke-direct {v0, v1}, Landroid/os/Handler;-><init>(Landroid/os/Looper;)V

    new-instance v1, Ltt/xinjian/cn/MainActivity$3;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/MainActivity$3;-><init>(Ltt/xinjian/cn/MainActivity;)V

    const-wide/16 v2, 0x1f40

    invoke-virtual {v0, v1, v2, v3}, Landroid/os/Handler;->postDelayed(Ljava/lang/Runnable;J)Z
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_1

    goto :goto_7

    .line 328
    :catch_1
    const-string v0, "error"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->locFail(Ljava/lang/String;)V

    :goto_7
    return-void
.end method

.method mediaDir()Ljava/io/File;
    .locals 3

    .line 82
    new-instance v0, Ljava/io/File;

    const/4 v1, 0x0

    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v1

    const-string v2, "media"

    invoke-direct {v0, v1, v2}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 83
    invoke-virtual {v0}, Ljava/io/File;->exists()Z

    move-result v1

    if-nez v1, :cond_0

    invoke-virtual {v0}, Ljava/io/File;->mkdirs()Z

    :cond_0
    return-object v0
.end method

.method notifyPerm(Ljava/lang/String;Z)V
    .locals 2

    .line 645
    new-instance v0, Ljava/lang/StringBuilder;

    const-string v1, "window.__xjPerm&&window.__xjPerm("

    invoke-direct {v0, v1}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-static {p1}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, ","

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    if-eqz p2, :cond_0

    .line 646
    const-string p1, "true"

    goto :goto_0

    :cond_0
    const-string p1, "false"

    :goto_0
    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, ")"

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    .line 647
    new-instance p2, Ltt/xinjian/cn/MainActivity$7;

    invoke-direct {p2, p0, p1}, Ltt/xinjian/cn/MainActivity$7;-><init>(Ltt/xinjian/cn/MainActivity;Ljava/lang/String;)V

    invoke-virtual {p0, p2}, Ltt/xinjian/cn/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method

.method protected onActivityResult(IILandroid/content/Intent;)V
    .locals 7

    const-string v0, "window.__xjPick&&window.__xjPick("

    .line 161
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onActivityResult(IILandroid/content/Intent;)V

    const/16 v1, 0x7d4

    const/4 v2, -0x1

    const/4 v3, 0x1

    const/4 v4, 0x0

    if-ne p1, v1, :cond_3

    .line 167
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    .line 168
    iput-object v4, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    if-nez p1, :cond_0

    goto :goto_1

    :cond_0
    if-ne p2, v2, :cond_2

    if-eqz p3, :cond_2

    .line 172
    invoke-virtual {p3}, Landroid/content/Intent;->getClipData()Landroid/content/ClipData;

    move-result-object p2

    const/4 v0, 0x0

    if-eqz p2, :cond_1

    .line 173
    invoke-virtual {p2}, Landroid/content/ClipData;->getItemCount()I

    move-result v1

    if-lez v1, :cond_1

    .line 174
    invoke-virtual {p2}, Landroid/content/ClipData;->getItemCount()I

    move-result p3

    new-array v4, p3, [Landroid/net/Uri;

    .line 175
    :goto_0
    invoke-virtual {p2}, Landroid/content/ClipData;->getItemCount()I

    move-result p3

    if-ge v0, p3, :cond_2

    .line 176
    invoke-virtual {p2, v0}, Landroid/content/ClipData;->getItemAt(I)Landroid/content/ClipData$Item;

    move-result-object p3

    invoke-virtual {p3}, Landroid/content/ClipData$Item;->getUri()Landroid/net/Uri;

    move-result-object p3

    aput-object p3, v4, v0

    add-int/lit8 v0, v0, 0x1

    goto :goto_0

    .line 178
    :cond_1
    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p2

    if-eqz p2, :cond_2

    .line 179
    new-array v4, v3, [Landroid/net/Uri;

    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p2

    aput-object p2, v4, v0

    .line 182
    :cond_2
    :try_start_0
    invoke-interface {p1, v4}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void

    :cond_3
    const/16 v1, 0x7d1

    const/16 v5, 0x7d3

    if-eq p1, v1, :cond_4

    const/16 v6, 0x7d2

    if-eq p1, v6, :cond_4

    if-eq p1, v5, :cond_4

    :goto_1
    return-void

    :cond_4
    if-eq p2, v2, :cond_6

    if-ne p1, v5, :cond_5

    .line 190
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    if-eqz p1, :cond_5

    .line 191
    :try_start_1
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p1

    iget-object p2, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    invoke-virtual {p1, p2, v4, v4}, Landroid/content/ContentResolver;->delete(Landroid/net/Uri;Ljava/lang/String;[Ljava/lang/String;)I
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1

    .line 192
    :catch_1
    iput-object v4, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    .line 194
    :cond_5
    const-string p1, "cancel"

    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void

    :cond_6
    if-ne p1, v5, :cond_7

    .line 198
    iget-object p2, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    goto :goto_2

    :cond_7
    if-nez p3, :cond_8

    move-object p2, v4

    goto :goto_2

    :cond_8
    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p2

    :goto_2
    if-nez p2, :cond_9

    .line 199
    const-string p1, "empty"

    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void

    :cond_9
    if-eq p1, v1, :cond_b

    if-ne p1, v5, :cond_a

    goto :goto_3

    .line 201
    :cond_a
    const-string p3, "file"

    goto :goto_4

    :cond_b
    :goto_3
    const-string p3, "image"

    .line 202
    :goto_4
    invoke-direct {p0, p2, p3}, Ltt/xinjian/cn/MainActivity;->copyToMedia(Landroid/net/Uri;Ljava/lang/String;)Ljava/io/File;

    move-result-object p2

    if-ne p1, v5, :cond_c

    .line 203
    iput-object v4, p0, Ltt/xinjian/cn/MainActivity;->captureUri:Landroid/net/Uri;

    :cond_c
    if-nez p2, :cond_d

    .line 204
    const-string p1, "copy"

    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void

    .line 206
    :cond_d
    :try_start_2
    new-instance p1, Lorg/json/JSONObject;

    invoke-direct {p1}, Lorg/json/JSONObject;-><init>()V

    .line 207
    const-string v1, "ok"

    invoke-virtual {p1, v1, v3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 208
    const-string v1, "kind"

    invoke-virtual {p1, v1, p3}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 209
    const-string p3, "name"

    invoke-virtual {p2}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v1

    invoke-virtual {p1, p3, v1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 210
    const-string p3, "size"

    invoke-virtual {p2}, Ljava/io/File;->length()J

    move-result-wide v1

    invoke-virtual {p1, p3, v1, v2}, Lorg/json/JSONObject;->put(Ljava/lang/String;J)Lorg/json/JSONObject;

    .line 211
    new-instance p2, Ljava/lang/StringBuilder;

    invoke-direct {p2, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p1}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    const-string p1, ")"

    invoke-virtual {p2, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {p2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-virtual {p0, p1}, Ltt/xinjian/cn/MainActivity;->toJs(Ljava/lang/String;)V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_2

    return-void

    .line 213
    :catch_2
    const-string p1, "json"

    invoke-direct {p0, p1}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void
.end method

.method public onBackPressed()V
    .locals 3

    .line 750
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    if-nez v0, :cond_0

    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->finish()V

    return-void

    .line 751
    :cond_0
    new-instance v1, Ltt/xinjian/cn/MainActivity$8;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/MainActivity$8;-><init>(Ltt/xinjian/cn/MainActivity;)V

    const-string v2, "(function(){try{return (window.__xjBack&&window.__xjBack())||\'pass\';}catch(e){return \'pass\';}})()"

    invoke-virtual {v0, v2, v1}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 5

    .line 464
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    const/4 v0, 0x0

    .line 468
    :try_start_0
    const-string v1, "xj"

    invoke-virtual {p0, v1, v0}, Ltt/xinjian/cn/MainActivity;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object v1

    const-string v2, "xj_dark"

    invoke-interface {v1, v2, v0}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z

    move-result v1
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    :catch_0
    nop

    const/4 v1, 0x0

    .line 470
    :goto_0
    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->applyTheme(Z)V

    .line 472
    new-instance v2, Landroid/webkit/WebView;

    invoke-direct {v2, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V

    iput-object v2, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-direct {p0}, Ltt/xinjian/cn/MainActivity;->devEnabled()Z

    move-result v3

    if-eqz v3, :no_webview_debug

    const/4 v3, 0x1

    invoke-static {v3}, Landroid/webkit/WebView;->setWebContentsDebuggingEnabled(Z)V

    :no_webview_debug
    .line 473
    new-instance v3, Landroid/view/ViewGroup$LayoutParams;

    const/4 v4, -0x1

    invoke-direct {v3, v4, v4}, Landroid/view/ViewGroup$LayoutParams;-><init>(II)V

    invoke-virtual {v2, v3}, Landroid/webkit/WebView;->setLayoutParams(Landroid/view/ViewGroup$LayoutParams;)V

    .line 475
    iget-object v2, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v1, :cond_0

    const v4, -0xe1e1e2

    :cond_0
    invoke-virtual {v2, v4}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    .line 476
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->setContentView(Landroid/view/View;)V

    .line 482
    :try_start_1
    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v1

    const/high16 v2, -0x80000000

    .line 483
    invoke-virtual {v1, v2}, Landroid/view/Window;->addFlags(I)V

    .line 484
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x1e

    if-lt v2, v3, :cond_1

    .line 485
    invoke-virtual {v1, v0}, Landroid/view/Window;->setDecorFitsSystemWindows(Z)V

    goto :goto_1

    .line 487
    :cond_1
    invoke-virtual {v1}, Landroid/view/Window;->getDecorView()Landroid/view/View;

    move-result-object v2

    const/16 v3, 0x500

    invoke-virtual {v2, v3}, Landroid/view/View;->setSystemUiVisibility(I)V

    .line 490
    :goto_1
    invoke-virtual {v1, v0}, Landroid/view/Window;->setStatusBarColor(I)V
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1

    goto :goto_2

    :catch_1
    nop

    .line 493
    :goto_2
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v1}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;

    move-result-object v1

    const/4 v2, 0x1

    .line 494
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V

    .line 495
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V

    .line 496
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setDatabaseEnabled(Z)V

    .line 497
    invoke-virtual {v1, v0}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V

    .line 498
    invoke-virtual {v1, v0}, Landroid/webkit/WebSettings;->setAllowContentAccess(Z)V

    .line 499
    invoke-virtual {v1, v0}, Landroid/webkit/WebSettings;->setSupportZoom(Z)V

    .line 500
    invoke-virtual {v1, v0}, Landroid/webkit/WebSettings;->setBuiltInZoomControls(Z)V

    .line 501
    const-string v3, "UTF-8"

    invoke-virtual {v1, v3}, Landroid/webkit/WebSettings;->setDefaultTextEncodingName(Ljava/lang/String;)V

    .line 502
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V

    const/4 v2, 0x2

    .line 503
    invoke-virtual {v1, v2}, Landroid/webkit/WebSettings;->setCacheMode(I)V

    .line 511
    invoke-virtual {v1, v0}, Landroid/webkit/WebSettings;->setDisplayZoomControls(Z)V

    const/16 v3, 0x64

    .line 512
    invoke-virtual {v1, v3}, Landroid/webkit/WebSettings;->setTextZoom(I)V

    .line 513
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v1, v2}, Landroid/webkit/WebView;->setOverScrollMode(I)V

    .line 514
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v1, v0}, Landroid/webkit/WebView;->setVerticalScrollBarEnabled(Z)V

    .line 515
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v1, v0}, Landroid/webkit/WebView;->setHorizontalScrollBarEnabled(Z)V

    .line 516
    iget-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v1, v0}, Landroid/webkit/WebView;->setHapticFeedbackEnabled(Z)V

    .line 518
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/XinJianBridge;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/XinJianBridge;-><init>(Landroid/content/Context;)V

    const-string v2, "XinJianBridge"

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    new-instance v1, Ltt/xinjian/cn/PythonTerminal;

    invoke-direct {v1}, Ltt/xinjian/cn/PythonTerminal;-><init>()V

    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->pythonTerminal:Ltt/xinjian/cn/PythonTerminal;

    const-string v2, "XinJianPythonTerminal"

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    new-instance v1, Ltt/xinjian/cn/LanBridge;

    invoke-direct {v1, p0, v0}, Ltt/xinjian/cn/LanBridge;-><init>(Landroid/content/Context;Landroid/webkit/WebView;)V

    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->lan:Ltt/xinjian/cn/LanBridge;

    const-string v2, "XinJianLan"

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    new-instance v1, Ltt/xinjian/cn/KeyboardViewport;

    invoke-direct {v1, p0, v0}, Ltt/xinjian/cn/KeyboardViewport;-><init>(Landroid/app/Activity;Landroid/webkit/WebView;)V

    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->keyboardViewport:Ltt/xinjian/cn/KeyboardViewport;

    new-instance v1, Ltt/xinjian/cn/UpdateBridge;

    invoke-direct {v1, p0, v0}, Ltt/xinjian/cn/UpdateBridge;-><init>(Landroid/app/Activity;Landroid/webkit/WebView;)V

    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->update:Ltt/xinjian/cn/UpdateBridge;

    const-string v2, "XinJianUpdate"

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    .line 520
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/MainActivity$5;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/MainActivity$5;-><init>(Ltt/xinjian/cn/MainActivity;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    .line 538
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/MainActivity$6;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/MainActivity$6;-><init>(Ltt/xinjian/cn/MainActivity;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    .line 632
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz p1, :cond_2

    .line 630
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->restoreState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;

    goto :goto_3

    .line 632
    :cond_2
    const-string p1, "https://app.xinjian.local/index.html"

    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    .line 635
    :goto_3
    invoke-direct {p0}, Ltt/xinjian/cn/MainActivity;->askExportPermission()V

    return-void
.end method

.method protected onDestroy()V
    .locals 2

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->pythonTerminal:Ltt/xinjian/cn/PythonTerminal;

    if-eqz v0, :python_terminal_closed

    invoke-virtual {v0}, Ltt/xinjian/cn/PythonTerminal;->reset()V

    :python_terminal_closed
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->lan:Ltt/xinjian/cn/LanBridge;

    if-eqz v0, :lan_destroyed

    invoke-virtual {v0}, Ltt/xinjian/cn/LanBridge;->onDestroy()V

    :lan_destroyed
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->keyboardViewport:Ltt/xinjian/cn/KeyboardViewport;

    if-eqz v0, :keyboard_viewport_closed

    invoke-virtual {v0}, Ltt/xinjian/cn/KeyboardViewport;->close()V

    :keyboard_viewport_closed
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->update:Ltt/xinjian/cn/UpdateBridge;

    if-eqz v0, :update_closed

    invoke-virtual {v0}, Ltt/xinjian/cn/UpdateBridge;->close()V

    :update_closed
    .line 765
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v0, :cond_1

    .line 766
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    const/4 v1, 0x0

    if-eqz v0, :cond_0

    .line 767
    :try_start_0
    invoke-interface {v0, v1}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 768
    :catch_0
    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->filePathCallback:Landroid/webkit/ValueCallback;

    .line 770
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    .line 771
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->destroy()V

    .line 772
    iput-object v1, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    .line 774
    :cond_1
    invoke-super {p0}, Landroid/app/Activity;->onDestroy()V

    return-void
.end method

.method public onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    .locals 1

    .line 657
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onRequestPermissionsResult(I[Ljava/lang/String;[I)V

    const/16 p2, 0x3ea

    if-lt p1, p2, :cond_5

    const/16 v0, 0x3ed

    if-le p1, v0, :cond_0

    goto :goto_1

    :cond_0
    if-ne p1, p2, :cond_1

    .line 659
    const-string p1, "camera"

    goto :goto_0

    :cond_1
    const/16 p2, 0x3eb

    if-ne p1, p2, :cond_2

    .line 660
    const-string p1, "storage"

    goto :goto_0

    :cond_2
    const/16 p2, 0x3ec

    if-ne p1, p2, :cond_3

    .line 661
    const-string p1, "loc"

    goto :goto_0

    :cond_3
    const-string p1, "locFine"

    :goto_0
    const/4 p2, 0x0

    if-eqz p3, :cond_4

    .line 662
    array-length v0, p3

    if-lez v0, :cond_4

    aget p3, p3, p2

    if-nez p3, :cond_4

    const/4 p2, 0x1

    .line 665
    :cond_4
    invoke-virtual {p0, p1, p2}, Ltt/xinjian/cn/MainActivity;->notifyPerm(Ljava/lang/String;Z)V

    :cond_5
    :goto_1
    return-void
.end method

.method protected onResume()V
    .locals 1

    .line 378
    invoke-super {p0}, Landroid/app/Activity;->onResume()V

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->lan:Ltt/xinjian/cn/LanBridge;

    if-eqz v0, :lan_resumed

    invoke-virtual {v0}, Ltt/xinjian/cn/LanBridge;->onResume()V

    :lan_resumed
    .line 380
    const-string v0, "window.__xjPermRefresh&&window.__xjPermRefresh()"

    invoke-virtual {p0, v0}, Ltt/xinjian/cn/MainActivity;->toJs(Ljava/lang/String;)V

    return-void
.end method

.method protected onStop()V
    .locals 1

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->lan:Ltt/xinjian/cn/LanBridge;

    if-eqz v0, :lan_stopped

    invoke-virtual {v0}, Ltt/xinjian/cn/LanBridge;->onStop()V

    :lan_stopped
    invoke-super {p0}, Landroid/app/Activity;->onStop()V

    return-void
.end method

.method protected onSaveInstanceState(Landroid/os/Bundle;)V
    .locals 1

    .line 743
    invoke-super {p0, p1}, Landroid/app/Activity;->onSaveInstanceState(Landroid/os/Bundle;)V

    .line 744
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    if-eqz v0, :cond_0

    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->saveState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;

    :cond_0
    return-void
.end method

.method openAppSettings()V
    .locals 3

    const-string v0, "package:"

    .line 370
    :try_start_0
    new-instance v1, Landroid/content/Intent;

    const-string v2, "android.settings.APPLICATION_DETAILS_SETTINGS"

    invoke-direct {v1, v2}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 371
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2, v0}, Ljava/lang/StringBuilder;-><init>(Ljava/lang/String;)V

    invoke-virtual {p0}, Ltt/xinjian/cn/MainActivity;->getPackageName()Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v0

    invoke-static {v0}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object v0

    invoke-virtual {v1, v0}, Landroid/content/Intent;->setData(Landroid/net/Uri;)Landroid/content/Intent;

    .line 372
    invoke-virtual {p0, v1}, Ltt/xinjian/cn/MainActivity;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void
.end method

.method pickFile()V
    .locals 2

    .line 126
    :try_start_0
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.OPEN_DOCUMENT"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 127
    const-string v1, "android.intent.category.OPENABLE"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    .line 128
    const-string v1, "*/*"

    invoke-virtual {v0, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    const/16 v1, 0x7d2

    .line 129
    invoke-virtual {p0, v0, v1}, Ltt/xinjian/cn/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-void

    .line 131
    :catch_0
    const-string v0, "nopicker"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void
.end method

.method pickImage()V
    .locals 3

    .line 110
    :try_start_0
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    const/16 v1, 0x21

    const-string v2, "image/*"

    if-lt v0, v1, :cond_0

    .line 111
    :try_start_1
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.provider.action.PICK_IMAGES"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 112
    invoke-virtual {v0, v2}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    goto :goto_0

    .line 114
    :cond_0
    new-instance v0, Landroid/content/Intent;

    const-string v1, "android.intent.action.GET_CONTENT"

    invoke-direct {v0, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 115
    invoke-virtual {v0, v2}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    :goto_0
    const/16 v1, 0x7d1

    .line 117
    invoke-virtual {p0, v0, v1}, Ltt/xinjian/cn/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_0

    return-void

    .line 119
    :catch_0
    const-string v0, "nopicker"

    invoke-direct {p0, v0}, Ltt/xinjian/cn/MainActivity;->pickFail(Ljava/lang/String;)V

    return-void
.end method

.method toJs(Ljava/lang/String;)V
    .locals 1

    .line 89
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity;->web:Landroid/webkit/WebView;

    if-nez v0, :cond_0

    return-void

    .line 90
    :cond_0
    new-instance v0, Ltt/xinjian/cn/MainActivity$1;

    invoke-direct {v0, p0, p1}, Ltt/xinjian/cn/MainActivity$1;-><init>(Ltt/xinjian/cn/MainActivity;Ljava/lang/String;)V

    invoke-virtual {p0, v0}, Ltt/xinjian/cn/MainActivity;->runOnUiThread(Ljava/lang/Runnable;)V

    return-void
.end method
