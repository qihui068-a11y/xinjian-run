.class public final Ltt/xinjian/cn/PythonTerminal;
.super Ljava/lang/Object;
.source "PythonTerminal.java"


# static fields
.field private static final EMPTY:[B

.field private static final PATH:Ljava/lang/String; = "/python-runtime/terminal/"

.field private static final REQUEST:Ljava/util/regex/Pattern;


# instance fields
.field private line:[B

.field private nextLine:I

.field private submitted:Z

.field private token:Ljava/lang/String;

.field private waiting:Z


# direct methods
.method static constructor <clinit>()V
    .locals 1

    .line 17
    const-string v0, "/python-runtime/terminal/([0-9a-f-]{36})/(0|[1-9][0-9]{0,8})"

    invoke-static {v0}, Ljava/util/regex/Pattern;->compile(Ljava/lang/String;)Ljava/util/regex/Pattern;

    move-result-object v0

    sput-object v0, Ltt/xinjian/cn/PythonTerminal;->REQUEST:Ljava/util/regex/Pattern;

    .line 19
    const/4 v0, 0x0

    new-array v0, v0, [B

    sput-object v0, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    return-void
.end method

.method public constructor <init>()V
    .locals 0

    .line 15
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method

.method private static response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;
    .locals 8

    .line 91
    new-instance v5, Ljava/util/HashMap;

    invoke-direct {v5}, Ljava/util/HashMap;-><init>()V

    .line 92
    const-string v0, "Cache-Control"

    const-string v1, "no-store"

    invoke-interface {v5, v0, v1}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 93
    const-string v0, "X-Content-Type-Options"

    const-string v1, "nosniff"

    invoke-interface {v5, v0, v1}, Ljava/util/Map;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 94
    new-instance v7, Landroid/webkit/WebResourceResponse;

    new-instance v6, Ljava/io/ByteArrayInputStream;

    invoke-direct {v6, p2}, Ljava/io/ByteArrayInputStream;-><init>([B)V

    const-string v1, "text/plain"

    const-string v2, "UTF-8"

    move-object v0, v7

    move v3, p0

    move-object v4, p1

    invoke-direct/range {v0 .. v6}, Landroid/webkit/WebResourceResponse;-><init>(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/util/Map;Ljava/io/InputStream;)V

    return-object v7
.end method


# virtual methods
.method public declared-synchronized close(Ljava/lang/String;)V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 48
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_0

    invoke-virtual {p0}, Ltt/xinjian/cn/PythonTerminal;->reset()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 49
    :cond_0
    monitor-exit p0

    return-void

    .line 47
    :catchall_0
    move-exception p1

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw p1
.end method

.method public declared-synchronized open()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 28
    :try_start_0
    invoke-virtual {p0}, Ltt/xinjian/cn/PythonTerminal;->reset()V

    .line 29
    invoke-static {}, Ljava/util/UUID;->randomUUID()Ljava/util/UUID;

    move-result-object v0

    invoke-virtual {v0}, Ljava/util/UUID;->toString()Ljava/lang/String;

    move-result-object v0

    iput-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    .line 30
    const/4 v0, 0x1

    iput v0, p0, Ltt/xinjian/cn/PythonTerminal;->nextLine:I

    .line 31
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    monitor-exit p0

    return-object v0

    .line 27
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public declared-synchronized reset()V
    .locals 2

    monitor-enter p0

    .line 52
    const/4 v0, 0x0

    :try_start_0
    iput-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    .line 53
    const/4 v1, 0x0

    iput-boolean v1, p0, Ltt/xinjian/cn/PythonTerminal;->submitted:Z

    iput-boolean v1, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z

    .line 54
    iput-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->line:[B

    .line 55
    invoke-virtual {p0}, Ljava/lang/Object;->notifyAll()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 56
    monitor-exit p0

    return-void

    .line 51
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public declared-synchronized send(Ljava/lang/String;ILjava/lang/String;Z)Z
    .locals 2
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 36
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    const/4 v1, 0x0

    if-eqz v0, :cond_3

    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v0, p1}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_3

    iget p1, p0, Ltt/xinjian/cn/PythonTerminal;->nextLine:I

    if-ne p2, p1, :cond_3

    iget-boolean p1, p0, Ltt/xinjian/cn/PythonTerminal;->submitted:Z

    if-nez p1, :cond_3

    if-eqz p3, :cond_3

    .line 37
    invoke-virtual {p3}, Ljava/lang/String;->length()I

    move-result p1

    const/high16 p2, 0x10000

    if-le p1, p2, :cond_0

    goto :goto_1

    .line 38
    :cond_0
    if-eqz p4, :cond_1

    const/4 p1, 0x0

    goto :goto_0

    :cond_1
    sget-object p1, Ljava/nio/charset/StandardCharsets;->UTF_8:Ljava/nio/charset/Charset;

    invoke-virtual {p3, p1}, Ljava/lang/String;->getBytes(Ljava/nio/charset/Charset;)[B

    move-result-object p1

    .line 39
    :goto_0
    if-eqz p1, :cond_2

    array-length p3, p1
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-le p3, p2, :cond_2

    monitor-exit p0

    return v1

    .line 40
    :cond_2
    :try_start_1
    iput-object p1, p0, Ltt/xinjian/cn/PythonTerminal;->line:[B

    .line 41
    const/4 p1, 0x1

    iput-boolean p1, p0, Ltt/xinjian/cn/PythonTerminal;->submitted:Z

    .line 42
    invoke-virtual {p0}, Ljava/lang/Object;->notifyAll()V
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 43
    monitor-exit p0

    return p1

    .line 37
    :cond_3
    :goto_1
    monitor-exit p0

    return v1

    .line 35
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1
.end method

.method public declared-synchronized serve(Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;
    .locals 6

    monitor-enter p0

    .line 59
    :try_start_0
    invoke-virtual {p1}, Landroid/net/Uri;->getEncodedPath()Ljava/lang/String;

    move-result-object v0

    .line 60
    const/4 v1, 0x0

    if-eqz v0, :cond_f

    const-string v2, "/python-runtime/terminal/"

    invoke-virtual {v0, v2}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v2

    if-nez v2, :cond_0

    goto/16 :goto_6

    .line 61
    :cond_0
    const-string v2, "https"

    invoke-virtual {p1}, Landroid/net/Uri;->getScheme()Ljava/lang/String;

    move-result-object v3

    invoke-virtual {v2, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    const/16 v3, 0x194

    if-eqz v2, :cond_e

    const-string v2, "app.xinjian.local"

    invoke-virtual {p1}, Landroid/net/Uri;->getAuthority()Ljava/lang/String;

    move-result-object v4

    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-eqz v2, :cond_e

    .line 62
    invoke-virtual {p1}, Landroid/net/Uri;->getEncodedQuery()Ljava/lang/String;

    move-result-object v2

    if-nez v2, :cond_e

    invoke-virtual {p1}, Landroid/net/Uri;->getEncodedFragment()Ljava/lang/String;

    move-result-object p1

    if-eqz p1, :cond_1

    goto/16 :goto_5

    .line 65
    :cond_1
    sget-object p1, Ltt/xinjian/cn/PythonTerminal;->REQUEST:Ljava/util/regex/Pattern;

    invoke-virtual {p1, v0}, Ljava/util/regex/Pattern;->matcher(Ljava/lang/CharSequence;)Ljava/util/regex/Matcher;

    move-result-object p1

    .line 66
    invoke-virtual {p1}, Ljava/util/regex/Matcher;->matches()Z

    move-result v0

    if-eqz v0, :cond_d

    const/4 v0, 0x1

    invoke-virtual {p1, v0}, Ljava/util/regex/Matcher;->group(I)Ljava/lang/String;

    move-result-object v2

    iget-object v4, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v2

    if-nez v2, :cond_2

    goto/16 :goto_4

    .line 67
    :cond_2
    iget-object v2, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    .line 68
    const/4 v3, 0x2

    invoke-virtual {p1, v3}, Ljava/util/regex/Matcher;->group(I)Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Ljava/lang/Integer;->parseInt(Ljava/lang/String;)I

    move-result p1

    .line 69
    const/16 v3, 0xcc

    if-nez p1, :cond_3

    const-string p1, "No Content"

    sget-object v0, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    invoke-static {v3, p1, v0}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_1

    monitor-exit p0

    return-object p1

    .line 70
    :cond_3
    :try_start_1
    iget v4, p0, Ltt/xinjian/cn/PythonTerminal;->nextLine:I

    if-ne p1, v4, :cond_c

    iget-boolean p1, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z

    if-eqz p1, :cond_4

    goto/16 :goto_3

    .line 72
    :cond_4
    iput-boolean v0, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 75
    :goto_0
    const/16 p1, 0x19a

    const/4 v4, 0x0

    :try_start_2
    iget-object v5, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-eqz v5, :cond_5

    iget-boolean v5, p0, Ltt/xinjian/cn/PythonTerminal;->submitted:Z

    if-nez v5, :cond_5

    invoke-virtual {p0}, Ljava/lang/Object;->wait()V

    goto :goto_0

    .line 76
    :cond_5
    iget-object v5, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v5}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v5

    if-nez v5, :cond_7

    const-string v0, "Gone"

    sget-object v1, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    invoke-static {p1, v0, v1}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_2
    .catch Ljava/lang/InterruptedException; {:try_start_2 .. :try_end_2} :catch_0
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 86
    :try_start_3
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_6

    iput-boolean v4, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z
    :try_end_3
    .catchall {:try_start_3 .. :try_end_3} :catchall_1

    .line 76
    :cond_6
    monitor-exit p0

    return-object p1

    .line 77
    :cond_7
    :try_start_4
    iget-object v5, p0, Ltt/xinjian/cn/PythonTerminal;->line:[B

    .line 78
    iput-object v1, p0, Ltt/xinjian/cn/PythonTerminal;->line:[B

    .line 79
    iput-boolean v4, p0, Ltt/xinjian/cn/PythonTerminal;->submitted:Z

    .line 80
    iget v1, p0, Ltt/xinjian/cn/PythonTerminal;->nextLine:I

    add-int/2addr v1, v0

    iput v1, p0, Ltt/xinjian/cn/PythonTerminal;->nextLine:I

    .line 81
    if-nez v5, :cond_8

    const-string v0, "No Content"

    sget-object v1, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    invoke-static {v3, v0, v1}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1

    goto :goto_1

    :cond_8
    const-string v0, "OK"

    const/16 v1, 0xc8

    invoke-static {v1, v0, v5}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_4
    .catch Ljava/lang/InterruptedException; {:try_start_4 .. :try_end_4} :catch_0
    .catchall {:try_start_4 .. :try_end_4} :catchall_0

    .line 86
    :goto_1
    :try_start_5
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_9

    iput-boolean v4, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z
    :try_end_5
    .catchall {:try_start_5 .. :try_end_5} :catchall_1

    .line 81
    :cond_9
    monitor-exit p0

    return-object p1

    .line 86
    :catchall_0
    move-exception p1

    goto :goto_2

    .line 82
    :catch_0
    move-exception v0

    .line 83
    :try_start_6
    invoke-static {}, Ljava/lang/Thread;->currentThread()Ljava/lang/Thread;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/Thread;->interrupt()V

    .line 84
    const-string v0, "Gone"

    sget-object v1, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    invoke-static {p1, v0, v1}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_6
    .catchall {:try_start_6 .. :try_end_6} :catchall_0

    .line 86
    :try_start_7
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_a

    iput-boolean v4, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z
    :try_end_7
    .catchall {:try_start_7 .. :try_end_7} :catchall_1

    .line 84
    :cond_a
    monitor-exit p0

    return-object p1

    .line 86
    :goto_2
    :try_start_8
    iget-object v0, p0, Ltt/xinjian/cn/PythonTerminal;->token:Ljava/lang/String;

    invoke-virtual {v2, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z

    move-result v0

    if-eqz v0, :cond_b

    iput-boolean v4, p0, Ltt/xinjian/cn/PythonTerminal;->waiting:Z

    .line 87
    :cond_b
    throw p1

    .line 70
    :cond_c
    :goto_3
    const-string p1, "Conflict"

    sget-object v0, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    const/16 v1, 0x199

    invoke-static {v1, p1, v0}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_8
    .catchall {:try_start_8 .. :try_end_8} :catchall_1

    monitor-exit p0

    return-object p1

    .line 66
    :cond_d
    :goto_4
    :try_start_9
    const-string p1, "Not Found"

    sget-object v0, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    invoke-static {v3, p1, v0}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_9
    .catchall {:try_start_9 .. :try_end_9} :catchall_1

    monitor-exit p0

    return-object p1

    .line 63
    :cond_e
    :goto_5
    :try_start_a
    const-string p1, "Not Found"

    sget-object v0, Ltt/xinjian/cn/PythonTerminal;->EMPTY:[B

    invoke-static {v3, p1, v0}, Ltt/xinjian/cn/PythonTerminal;->response(ILjava/lang/String;[B)Landroid/webkit/WebResourceResponse;

    move-result-object p1
    :try_end_a
    .catchall {:try_start_a .. :try_end_a} :catchall_1

    monitor-exit p0

    return-object p1

    .line 60
    :cond_f
    :goto_6
    monitor-exit p0

    return-object v1

    .line 58
    :catchall_1
    move-exception p1

    :try_start_b
    monitor-exit p0
    :try_end_b
    .catchall {:try_start_b .. :try_end_b} :catchall_1

    throw p1
.end method
