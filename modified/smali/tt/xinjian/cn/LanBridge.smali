.class public final Ltt/xinjian/cn/LanBridge;
.super Ljava/lang/Object;
.source "LanBridge.java"


# instance fields
.field private final context:Landroid/content/Context;

.field private disposed:Z

.field private enabledNick:Ljava/lang/String;

.field private foreground:Z

.field private final id:Ljava/lang/String;

.field private final media:Ljava/io/File;

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

    .line 29
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 30
    invoke-virtual {p1}, Landroid/content/Context;->getApplicationContext()Landroid/content/Context;

    move-result-object p1

    iput-object p1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    .line 31
    iput-object p2, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    .line 32
    iget-object p1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    const/4 p2, 0x0

    invoke-virtual {p1, p2}, Landroid/content/Context;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object p1

    .line 34
    if-nez p1, :cond_0

    goto :goto_0

    :cond_0
    new-instance p2, Ljava/io/File;

    const-string v0, "media"

    invoke-direct {p2, p1, v0}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    :goto_0
    iput-object p2, p0, Ltt/xinjian/cn/LanBridge;->media:Ljava/io/File;

    .line 35
    iget-object p1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    const-string p2, "xj-lan"

    const/4 v0, 0x0

    invoke-virtual {p1, p2, v0}, Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;

    move-result-object p1

    .line 36
    const-string p2, "id"

    const-string v1, ""

    invoke-interface {p1, p2, v1}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;

    move-result-object v2

    .line 37
    invoke-static {v2}, Ltt/xinjian/cn/LanTransport;->validId(Ljava/lang/String;)Z

    move-result v3

    if-nez v3, :cond_1

    .line 38
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

    .line 39
    invoke-interface {p1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;

    move-result-object p1

    invoke-interface {p1, p2, v2}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;

    move-result-object p1

    invoke-interface {p1}, Landroid/content/SharedPreferences$Editor;->apply()V

    .line 41
    :cond_1
    iput-object v2, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    .line 42
    return-void
.end method

.method private closeTransport()V
    .locals 2

    .line 152
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    .line 153
    const/4 v1, 0x0

    iput-object v1, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    .line 154
    if-eqz v0, :cond_0

    invoke-virtual {v0}, Ltt/xinjian/cn/LanTransport;->close()V

    .line 155
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    if-eqz v0, :cond_2

    .line 156
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

    .line 157
    :catch_0
    move-exception v0

    :cond_1
    :goto_0
    nop

    .line 158
    iput-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    .line 160
    :cond_2
    return-void
.end method

.method private dispatch(Ljava/lang/String;)V
    .locals 3

    .line 182
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

    .line 183
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

    .line 184
    return-void
.end method

.method private emit(Ltt/xinjian/cn/LanTransport;Lorg/json/JSONObject;)V
    .locals 2

    .line 173
    invoke-virtual {p2}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p2

    .line 174
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda0;

    invoke-direct {v1, p0, p1, p2}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda0;-><init>(Ltt/xinjian/cn/LanBridge;Ltt/xinjian/cn/LanTransport;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 179
    return-void
.end method

.method private open()Z
    .locals 7

    .line 130
    const/4 v0, 0x0

    :try_start_0
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->context:Landroid/content/Context;

    const-string v2, "wifi"

    invoke-virtual {v1, v2}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Landroid/net/wifi/WifiManager;

    .line 131
    if-eqz v1, :cond_0

    .line 132
    const-string v2, "xj-lan"

    invoke-virtual {v1, v2}, Landroid/net/wifi/WifiManager;->createMulticastLock(Ljava/lang/String;)Landroid/net/wifi/WifiManager$MulticastLock;

    move-result-object v1

    iput-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    .line 133
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    invoke-virtual {v1, v0}, Landroid/net/wifi/WifiManager$MulticastLock;->setReferenceCounted(Z)V

    .line 134
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->wifiLock:Landroid/net/wifi/WifiManager$MulticastLock;

    invoke-virtual {v1}, Landroid/net/wifi/WifiManager$MulticastLock;->acquire()V
    :try_end_0
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 136
    :catch_0
    move-exception v1

    :cond_0
    :goto_0
    nop

    .line 139
    const/4 v1, 0x1

    :try_start_1
    new-instance v2, Ltt/xinjian/cn/LanTransport;

    iget-object v3, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    iget-object v4, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    new-instance v5, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda1;

    invoke-direct {v5, p0}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda1;-><init>(Ltt/xinjian/cn/LanBridge;)V

    iget-object v6, p0, Ltt/xinjian/cn/LanBridge;->media:Ljava/io/File;

    invoke-direct {v2, v3, v4, v5, v6}, Ltt/xinjian/cn/LanTransport;-><init>(Ljava/lang/String;Ljava/lang/String;Ltt/xinjian/cn/LanTransport$Events;Ljava/io/File;)V

    iput-object v2, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    .line 140
    invoke-direct {p0, v1, v0}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V

    .line 141
    iget-object v2, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    invoke-virtual {v2}, Ltt/xinjian/cn/LanTransport;->start()V
    :try_end_1
    .catch Ljava/io/IOException; {:try_start_1 .. :try_end_1} :catch_2
    .catch Ljava/lang/RuntimeException; {:try_start_1 .. :try_end_1} :catch_1

    .line 142
    return v1

    .line 143
    :catch_1
    move-exception v2

    goto :goto_1

    :catch_2
    move-exception v2

    .line 144
    :goto_1
    const/4 v2, 0x0

    iput-object v2, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 145
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V

    .line 146
    invoke-direct {p0, v0, v1}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V

    .line 147
    return v0
.end method

.method private declared-synchronized resumeTransport()V
    .locals 1

    monitor-enter p0

    .line 113
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

    .line 114
    :cond_0
    monitor-exit p0

    return-void

    .line 112
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

    .line 163
    iget v0, p0, Ltt/xinjian/cn/LanBridge;->sequence:I

    add-int/lit8 v0, v0, 0x1

    iput v0, p0, Ltt/xinjian/cn/LanBridge;->sequence:I

    .line 164
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

    .line 165
    iget-object p2, p0, Ltt/xinjian/cn/LanBridge;->web:Landroid/webkit/WebView;

    new-instance v1, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda3;

    invoke-direct {v1, p0, v0, p1}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda3;-><init>(Ltt/xinjian/cn/LanBridge;ILjava/lang/String;)V

    invoke-virtual {p2, v1}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 170
    return-void
.end method


# virtual methods
.method public declared-synchronized deleteMedia(Ljava/lang/String;)Z
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 90
    const/4 v0, 0x0

    if-eqz p1, :cond_3

    :try_start_0
    invoke-virtual {p1}, Ljava/lang/String;->isEmpty()Z

    move-result v1

    if-nez v1, :cond_3

    const/16 v1, 0x2f

    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(I)I

    move-result v1

    if-gez v1, :cond_3

    const-string v1, ".."

    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v1

    if-ltz v1, :cond_0

    goto :goto_0

    .line 91
    :cond_0
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->media:Ljava/io/File;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-nez v1, :cond_1

    monitor-exit p0

    return v0

    .line 93
    :cond_1
    :try_start_1
    new-instance v1, Ljava/io/File;

    iget-object v2, p0, Ltt/xinjian/cn/LanBridge;->media:Ljava/io/File;

    invoke-direct {v1, v2, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 94
    invoke-virtual {v1}, Ljava/io/File;->isFile()Z

    move-result p1

    if-eqz p1, :cond_2

    invoke-virtual {v1}, Ljava/io/File;->delete()Z

    move-result p1
    :try_end_1
    .catch Ljava/lang/RuntimeException; {:try_start_1 .. :try_end_1} :catch_0
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    if-eqz p1, :cond_2

    const/4 v0, 0x1

    :cond_2
    monitor-exit p0

    return v0

    .line 95
    :catch_0
    move-exception p1

    .line 96
    monitor-exit p0

    return v0

    .line 89
    :catchall_0
    move-exception p1

    :try_start_2
    monitor-exit p0
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    throw p1

    .line 90
    :cond_3
    :goto_0
    monitor-exit p0

    return v0
.end method

.method public deviceId()Ljava/lang/String;
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 45
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->id:Ljava/lang/String;

    return-object v0
.end method

.method synthetic lambda$emit$1$tt-xinjian-cn-LanBridge(Ltt/xinjian/cn/LanTransport;Ljava/lang/String;)V
    .locals 1

    .line 175
    monitor-enter p0

    .line 176
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-ne v0, p1, :cond_0

    invoke-direct {p0, p2}, Ltt/xinjian/cn/LanBridge;->dispatch(Ljava/lang/String;)V

    .line 177
    :cond_0
    monitor-exit p0

    .line 178
    return-void

    .line 177
    :catchall_0
    move-exception p1

    monitor-exit p0
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    throw p1
.end method

.method synthetic lambda$state$0$tt-xinjian-cn-LanBridge(ILjava/lang/String;)V
    .locals 1

    .line 166
    monitor-enter p0

    .line 167
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    iget v0, p0, Ltt/xinjian/cn/LanBridge;->sequence:I

    if-ne p1, v0, :cond_0

    invoke-direct {p0, p2}, Ltt/xinjian/cn/LanBridge;->dispatch(Ljava/lang/String;)V

    .line 168
    :cond_0
    monitor-exit p0

    .line 169
    return-void

    .line 168
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

    .line 123
    const/4 v0, 0x1

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    .line 124
    const/4 v0, 0x0

    iput-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 125
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 126
    monitor-exit p0

    return-void

    .line 122
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

    .line 106
    const/4 v0, 0x1

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    .line 107
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-nez v0, :cond_0

    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-nez v0, :cond_0

    .line 108
    new-instance v0, Ljava/lang/Thread;

    new-instance v1, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda2;

    invoke-direct {v1, p0}, Ltt/xinjian/cn/LanBridge$$ExternalSyntheticLambda2;-><init>(Ltt/xinjian/cn/LanBridge;)V

    const-string v2, "xj-lan-resume"

    invoke-direct {v0, v1, v2}, Ljava/lang/Thread;-><init>(Ljava/lang/Runnable;Ljava/lang/String;)V

    invoke-virtual {v0}, Ljava/lang/Thread;->start()V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 110
    :cond_0
    monitor-exit p0

    return-void

    .line 105
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

    .line 117
    const/4 v0, 0x0

    :try_start_0
    iput-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    .line 118
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V

    .line 119
    invoke-direct {p0, v0, v0}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 120
    monitor-exit p0

    return-void

    .line 116
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method

.method public readMedia(Ljava/lang/String;)Ljava/lang/String;
    .locals 6
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 68
    const-string v0, ""

    if-eqz p1, :cond_6

    invoke-virtual {p1}, Ljava/lang/String;->isEmpty()Z

    move-result v1

    if-nez v1, :cond_6

    const/16 v1, 0x2f

    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(I)I

    move-result v1

    if-gez v1, :cond_6

    const-string v1, ".."

    invoke-virtual {p1, v1}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result v1

    if-ltz v1, :cond_0

    goto :goto_5

    .line 69
    :cond_0
    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->media:Ljava/io/File;

    if-nez v1, :cond_1

    return-object v0

    .line 71
    :cond_1
    :try_start_0
    new-instance v1, Ljava/io/File;

    iget-object v2, p0, Ltt/xinjian/cn/LanBridge;->media:Ljava/io/File;

    invoke-direct {v1, v2, p1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 72
    invoke-virtual {v1}, Ljava/io/File;->isFile()Z

    move-result p1

    if-eqz p1, :cond_5

    invoke-virtual {v1}, Ljava/io/File;->length()J

    move-result-wide v2

    const-wide/16 v4, 0x1

    cmp-long p1, v2, v4

    if-ltz p1, :cond_5

    invoke-virtual {v1}, Ljava/io/File;->length()J

    move-result-wide v2

    const-wide/32 v4, 0x200000

    cmp-long p1, v2, v4

    if-lez p1, :cond_2

    goto :goto_3

    .line 73
    :cond_2
    invoke-virtual {v1}, Ljava/io/File;->length()J

    move-result-wide v2

    long-to-int p1, v2

    new-array v2, p1, [B

    .line 74
    new-instance v3, Ljava/io/FileInputStream;

    invoke-direct {v3, v1}, Ljava/io/FileInputStream;-><init>(Ljava/io/File;)V
    :try_end_0
    .catch Ljava/io/IOException; {:try_start_0 .. :try_end_0} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_0 .. :try_end_0} :catch_0

    .line 75
    const/4 v1, 0x0

    .line 76
    :goto_0
    if-ge v1, p1, :cond_4

    .line 77
    sub-int v4, p1, v1

    :try_start_1
    invoke-virtual {v3, v2, v1, v4}, Ljava/io/FileInputStream;->read([BII)I

    move-result v4
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    .line 78
    if-gez v4, :cond_3

    goto :goto_2

    .line 79
    :cond_3
    add-int/2addr v1, v4

    .line 80
    goto :goto_0

    .line 74
    :catchall_0
    move-exception p1

    :try_start_2
    invoke-virtual {v3}, Ljava/io/FileInputStream;->close()V
    :try_end_2
    .catchall {:try_start_2 .. :try_end_2} :catchall_1

    goto :goto_1

    :catchall_1
    move-exception v1

    :try_start_3
    invoke-virtual {p1, v1}, Ljava/lang/Throwable;->addSuppressed(Ljava/lang/Throwable;)V

    :goto_1
    throw p1

    .line 81
    :cond_4
    :goto_2
    invoke-virtual {v3}, Ljava/io/FileInputStream;->close()V

    .line 82
    const/4 p1, 0x2

    invoke-static {v2, p1}, Landroid/util/Base64;->encodeToString([BI)Ljava/lang/String;

    move-result-object p1
    :try_end_3
    .catch Ljava/io/IOException; {:try_start_3 .. :try_end_3} :catch_1
    .catch Ljava/lang/RuntimeException; {:try_start_3 .. :try_end_3} :catch_0

    return-object p1

    .line 72
    :cond_5
    :goto_3
    return-object v0

    .line 83
    :catch_0
    move-exception p1

    goto :goto_4

    :catch_1
    move-exception p1

    .line 84
    :goto_4
    return-object v0

    .line 68
    :cond_6
    :goto_5
    return-object v0
.end method

.method public declared-synchronized send(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)Z
    .locals 1
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 63
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

    .line 63
    :catchall_0
    move-exception p1

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw p1
.end method

.method public declared-synchronized sendImage(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;)Z
    .locals 8
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    monitor-enter p0

    .line 102
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    if-eqz v0, :cond_0

    iget-object v1, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;

    move-object v2, p1

    move-object v3, p2

    move-object v4, p3

    move v5, p4

    move v6, p5

    move-object v7, p6

    invoke-virtual/range {v1 .. v7}, Ltt/xinjian/cn/LanTransport;->sendImage(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;)Z

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

    .line 102
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

    .line 49
    :try_start_0
    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->foreground:Z

    const/4 v1, 0x0

    if-eqz v0, :cond_4

    iget-boolean v0, p0, Ltt/xinjian/cn/LanBridge;->disposed:Z

    if-eqz v0, :cond_0

    goto :goto_2

    .line 50
    :cond_0
    if-nez p1, :cond_1

    const-string p1, ""

    goto :goto_0

    :cond_1
    invoke-virtual {p1}, Ljava/lang/String;->trim()Ljava/lang/String;

    move-result-object p1

    .line 51
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

    .line 52
    iget-object p1, p0, Ltt/xinjian/cn/LanBridge;->transport:Ltt/xinjian/cn/LanTransport;
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    if-eqz p1, :cond_3

    monitor-exit p0

    const/4 p1, 0x1

    return p1

    .line 53
    :cond_3
    :try_start_1
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->open()Z

    move-result p1
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    monitor-exit p0

    return p1

    .line 49
    :cond_4
    :goto_2
    monitor-exit p0

    return v1

    .line 48
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

    .line 57
    const/4 v0, 0x0

    :try_start_0
    iput-object v0, p0, Ltt/xinjian/cn/LanBridge;->enabledNick:Ljava/lang/String;

    .line 58
    invoke-direct {p0}, Ltt/xinjian/cn/LanBridge;->closeTransport()V

    .line 59
    const/4 v0, 0x0

    invoke-direct {p0, v0, v0}, Ltt/xinjian/cn/LanBridge;->state(ZZ)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    .line 60
    monitor-exit p0

    return-void

    .line 56
    :catchall_0
    move-exception v0

    :try_start_1
    monitor-exit p0
    :try_end_1
    .catchall {:try_start_1 .. :try_end_1} :catchall_0

    throw v0
.end method
