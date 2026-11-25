.class public final Ltt/xinjian/cn/LanBridge;
.super Ljava/lang/Object;
.source "LanBridge.java"


# instance fields
.field private final context:Landroid/content/Context;

.field private disposed:Z

.field private enabledNick:Ljava/lang/String;

.field private foreground:Z

.field private final id:Ljava/lang/String;

.field private sequence:I

.field private transport:Ltt/xinjian/cn/LanTransport;

.field private final web:Landroid/webkit/WebView;

.field private wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;


# direct methods
.method public static synthetic $r8$lambda$IuPLGJEhzwGIxlo4dgG693SG6HU(Ltt/xinjian/cn/LanBridge;)V
    .locals 0

    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->resumeTransport()V

    return-void
.end method

.method public static synthetic $r8$lambda$zuHAHaF9fVhFvzCHr7a2YRWokgw(Ltt/xinjian/cn/LanBridge;Ltt/xinjian/cn/LanTransport;Lorg/json/JSONObject;)V
    .locals 0

    invoke-direct {p0, p1, p2}, Ltt/xinjian/cn/LanBridge;->emit(Ltt/xinjian/cn/LanTransport;Lorg/json/JSONObject;)V

    return-void
.end method

.method public constructor <init>(Landroid/content/Context;Landroid/webkit/WebView;)V
    .locals 5

    .line 26
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 27
    invoke-virtual {p1}, Landroid/content/Context;->getApplicationContext()Landroid/content/Context;

    move-result-object p1

    iput-object p1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    .line 28
    iput-object p2, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    .line 29
    iget-object p1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    const-string p2, "xj-lan"

    const/4 v0, 0x0

    invoke-virtual {p1, p2, v0}, Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object p1

    .line 30
    const-string p2, "id"

    const-string v1, ""

    invoke-interface {p1, p2, v1}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    .line 31
    invoke-static {v2}, Ltt/xinjian/cn/LanTransport;->validId(Ljava/lang/String;)Z

    move-result v3

    if-nez v3, :cond_0

    .line 32
    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "xj-"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-static {}, Ljava/util/UUID;->randomUUID()Ljava/util/UUID;

    move-result-object v3

    invoke-virtual {v3}, Ljava/util/UUID;->toString()Ljava/lang/String;

    move-result-object v3

    const-string v4, "-"

    invoke-virtual {v3, v4, v1}, Ljava/lang/String;->replace(Ljava/lang/CharSequence;Ljava/lang/CharSequence;)Ljava/lang/String;

    move-result-object v1

    const/16 v3, 0xc

    invoke-virtual {v1, v0, v3}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object v0

    invoke-virtual {v2, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    invoke-virtual {v0}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    .line 33
    invoke-interface {p1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object p1

    invoke-interface {p1, p2, v2}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object p1

    invoke-interface {p1}, Landroid/content/SharedPreferences$Editor;->apply()V

    .line 35
    :cond_0
    iput-object v2, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    .line 36
    return-void
.end method

.method private closeTransport()V
    .locals 2

    .line 107
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    .line 108
    const/4 v1, 0x0

    iput-object v1, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    .line 109
    if-eqz v0, :cond_0

    invoke-virtual {v0}, Ltt/xinjian/cn/LanTransport;->close()V

    .line 110
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    if-eqz v0, :cond_2

    .line 111
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    invoke-virtual {v0}, Landroid/net/wifi/WifiManager$MulticastLock;->isHeld()Z

    move-result v0

    if-eqz v0, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    invoke-virtual {v0}, Landroid/net/wifi/WifiManager$MulticastLock;->release()V
    :try_end_0
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 112
    :catch_0
    move-exception v0

    :cond_1
    :goto_0
    nop

    .line 113
    iput-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    .line 115
    :cond_2
    return-void
.end method

.method private dispatch(Ljava/lang/String;)V
    .locals 3

    .line 137
    invoke-static {p1}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    const-string v0, "\u2028"

    const-string v1, "\\u2028"

    invoke-virtual {p1, v0, v1}, Ljava/lang/String;->replace(Ljava/lang/CharSequence;Ljava/lang/CharSequence;)Ljava/lang/String;

    move-result-object p1

    const-string v0, "\u2029"

    const-string v1, "\\u2029"

    invoke-virtual {p1, v0, v1}, Ljava/lang/String;->replace(Ljava/lang/CharSequence;Ljava/lang/CharSequence;)Ljava/lang/String;

    move-result-object p1

    .line 138
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "window.__xjLan&&window.__xjLan("

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v1, ")"

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    const/4 v1, 0x0

    invoke-virtual {v0, p1, v1}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    .line 139
    return-void
.end method

.method private emit(Ltt/xinjian/cn/LanTransport;Lorg/json/JSONObject;)V
    .locals 2

    .line 128
    invoke-virtual {p2}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p2

    .line 129
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda0;

    invoke-direct {v1, p0, p1, p2}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda0;-><init>(Ltt/xinjian/cn/LanBridge;Ltt/xinjian/cn/LanTransport;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 134
    return-void
.end method

.method private open()Z
    .locals 6

    .line 85
    const/4 v0, 0x0

    :try_start_0
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    const-string v2, "wifi"

    invoke-virtual {v1, v2}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Landroid/net/wifi/WifiManager;

    .line 86
    if-eqz v1, :cond_0

    .line 87
    const-string v2, "xj-lan"

    invoke-virtual {v1, v2}, Landroid/net/wifi/WifiManager;->createMulticastLock(Ljava/lang/String;)Landroid/net/wifi/WifiManager$MulticastLock;

    move-result-object v1

    iput-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    .line 88
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    invoke-virtual {v1, v0}, Landroid/net/wifi/WifiManager$MulticastLock;->setReferenceCounted(Z)V

    .line 89
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    invoke-virtual {v1}, Landroid/net/wifi/WifiManager$MulticastLock;->acquire()V
    :try_end_0
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 91
    :catch_0
    move-exception v1

    :cond_0
    :goto_0
    nop

    .line 94
    const/4 v1, 0x1

    :try_start_1
    new-instance v2, Ltt/xinjian/cn/LanTransport;

    iget-object v3, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    iget-object v4, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    new-instance v5, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda1;

    invoke-direct {v5, p0}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda1;-><init>(Ltt/xinjian/cn/LanBridge;)V

    invoke-direct {v2, v3, v4, v5}, Ltt/xinjian/cn/LanTransport;-><init>(Ljava/lang/String;Ljava/lang/String;Ltt/xinjian/cn/LanTransport$Events;)V

    iput-object v2, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    .line 95
    invoke-direct {p0, v1, v0}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V

    .line 96
    iget-object v2, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    invoke-virtual {v2}, Ltt/xinjian/cn/LanTransport;->start()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/RuntimeException; {:try_start_1 .. :try_end_1} :catch_1

    .line 97
    return v1

    .line 98
    :catch_1
    move-exception v2

    goto :goto_1

    :catch_2
    move-exception v2

    .line 99
    :goto_1
    const/4 v2, 0x0

    iput-object v2, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 100
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V

    .line 101
    invoke-direct {p0, v0, v1}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V

    .line 102
    return v0
.end method

.method private declared-synchronized resumeTransport()V
    .locals 1

    monitor-enter p0

    .line 68
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-nez v0, :cond_0

    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->open()Z
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 69
    :cond_0
    monitor-exit p0

    return-void

    .line 67
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method private state(ZZ)V
    .locals 3

    .line 118
    iget v0, p0, Ltt/xinjian/cn/LanBridge;->sequence:I

    add-int/lit8 v0, v0, 0x1

    iput v0, p0, Ltt/xinjian/cn/LanBridge;->sequence:I

    .line 119
    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v2, "{\"t\":\"state\",\"on\":"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, p1}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v1, ",\"failed\":"

    invoke-virtual {p1, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string p2, "}"

    invoke-virtual {p1, p2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    .line 120
    iget-object p2, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda3;

    invoke-direct {v1, p0, v0, p1}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda3;-><init>(Ltt/xinjian/cn/LanBridge;ILjava/lang/String;)V

    invoke-virtual {p2, v1}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 125
    return-void
.end method


# virtual methods
.method public deviceId()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 39
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    return-object v0
.end method

.method synthetic lambda$emit$1$tt-xinjian-cn-LanBridge(Ltt/xinjian/cn/LanTransport;Ljava/lang/String;)V
    .locals 1

    .line 130
    monitor-enter p0

    .line 131
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-ne v0, p1, :cond_0

    invoke-direct {p0, p2}, Ltt/xinjian/cn/LanBridge;->dispatch(Ljava/lang/String;)V

    .line 132
    :cond_0
    monitor-exit p0

    .line 133
    return-void

    .line 132
    :catchall_0
    move-exception p1

    monitor-exit p0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    throw p1
.end method

.method synthetic lambda$state$0$tt-xinjian-cn-LanBridge(ILjava/lang/String;)V
    .locals 1

    .line 121
    monitor-enter p0

    .line 122
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    iget v0, p0, Ltt/xinjian/cn/LanBridge;->sequence:I

    if-ne p1, v0, :cond_0

    invoke-direct {p0, p2}, Ltt/xinjian/cn/LanBridge;->dispatch(Ljava/lang/String;)V

    .line 123
    :cond_0
    monitor-exit p0

    .line 124
    return-void

    .line 123
    :catchall_0
    move-exception p1

    monitor-exit p0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    throw p1
.end method

.method public declared-synchronized onDestroy()V
    .locals 1

    monitor-enter p0

    .line 78
    const/4 v0, 0x1

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    .line 79
    const/4 v0, 0x0

    iput-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 80
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 81
    monitor-exit p0

    return-void

    .line 77
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public declared-synchronized onResume()V
    .locals 3

    monitor-enter p0

    .line 61
    const/4 v0, 0x1

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    .line 62
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-nez v0, :cond_0

    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    .line 63
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda2;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda2;-><init>(Ltt/xinjian/cn/LanBridge;)V

    const-string v2, "xj-lan-resume"

    invoke-direct {v0, v1, v2}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 65
    :cond_0
    monitor-exit p0

    return-void

    .line 60
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public declared-synchronized onStop()V
    .locals 1

    monitor-enter p0

    .line 72
    const/4 v0, 0x0

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    .line 73
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V

    .line 74
    invoke-direct {p0, v0, v0}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 75
    monitor-exit p0

    return-void

    .line 71
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public declared-synchronized send(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 57
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    invoke-virtual {v0, p1, p2, p3}, Ltt/xinjian/cn/LanTransport;->send(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z

    move-result p1
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-eqz p1, :cond_0

    const/4 p1, 0x1

    goto :goto_0

    :cond_0
    const/4 p1, 0x0

    :goto_0
    monitor-exit p0

    return p1

    .line 57
    :catchall_0
    move-exception p1

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw p1
.end method

.method public declared-synchronized start(Ljava/lang/String;)Z
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 43
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    const/4 v1, 0x0

    if-eqz v0, :cond_4

    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-eqz v0, :cond_0

    goto :goto_2

    .line 44
    :cond_0
    if-nez p1, :cond_1

    const-string p1, ""

    goto :goto_0

    :cond_1
    invoke-virtual {p1}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p1

    .line 45
    :goto_0
    invoke-virtual {p1}, Ljava/lang/String;->isEmpty()Z

    move-result v0

    if-eqz v0, :cond_2

    iget-object p1, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    goto :goto_1

    :cond_2
    invoke-virtual {p1}, Ljava/lang/String;->length()I

    move-result v0

    const/16 v2, 0x30

    invoke-static {v0, v2}, Ljava/lang/Math;->min(II)I

    move-result v0

    invoke-virtual {p1, v1, v0}, Ljava/lang/String;->substring(II)Ljava/lang/String;

    move-result-object p1

    :goto_1
    iput-object p1, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 46
    iget-object p1, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-eqz p1, :cond_3

    monitor-exit p0

    const/4 p1, 0x1

    return p1

    .line 47
    :cond_3
    :try_start_1
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->open()Z

    move-result p1
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    monitor-exit p0

    return p1

    .line 43
    :cond_4
    :goto_2
    monitor-exit p0

    return v1

    .line 42
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1
.end method

.method public declared-synchronized stop()V
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 51
    const/4 v0, 0x0

    :try_start_0
    iput-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 52
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V

    .line 53
    const/4 v0, 0x0

    invoke-direct {p0, v0, v0}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 54
    monitor-exit p0

    return-void

    .line 50
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method
