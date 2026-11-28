.class public final Ltt/xinjian/cn/CropBridge;
.super Ljava/lang/Object;
.source "CropBridge.java"


# static fields
.field private static web:Landroid/webkit/WebView;


# direct methods
.method public constructor <init>(Landroid/webkit/WebView;)V
    .locals 0

    .line 14
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 15
    sput-object p1, Ltt/xinjian/cn/CropBridge;->web:Landroid/webkit/WebView;

    .line 16
    return-void
.end method

.method static deliver(Ljava/lang/String;)V
    .locals 2

    .line 30
    sget-object v0, Ltt/xinjian/cn/CropBridge;->web:Landroid/webkit/WebView;

    .line 31
    if-nez v0, :cond_0

    return-void

    .line 32
    :cond_0
    new-instance v1, Ltt/xinjian/cn/CropBridge$$ExternalSyntheticLambda0;

    invoke-direct {v1, v0, p0}, Ltt/xinjian/cn/CropBridge$$ExternalSyntheticLambda0;-><init>(Landroid/webkit/WebView;Ljava/lang/String;)V

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 38
    return-void
.end method

.method static synthetic lambda$deliver$0(Landroid/webkit/WebView;Ljava/lang/String;)V
    .locals 2

    .line 34
    :try_start_0
    new-instance v0, Ljava/lang/StringBuilder;

    invoke-direct {v0}, Ljava/lang/StringBuilder;-><init>()V

    const-string v1, "window.__xjCrop&&window.__xjCrop("

    invoke-virtual {v0, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v0

    .line 35
    invoke-static {p1}, Lorg/json/JSONObject;->quote(Ljava/lang/String;)Ljava/lang/String;

    move-result-object p1

    invoke-virtual {v0, p1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    const-string v0, ")"

    invoke-virtual {p1, v0}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object p1

    invoke-virtual {p1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object p1

    .line 34
    const/4 v0, 0x0

    invoke-virtual {p0, p1, v0}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 36
    :catch_0
    move-exception p0

    :goto_0
    nop

    .line 37
    return-void
.end method


# virtual methods
.method public pick()V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    .line 19
    sget-object v0, Ltt/xinjian/cn/CropBridge;->web:Landroid/webkit/WebView;

    .line 20
    if-nez v0, :cond_0

    return-void

    .line 21
    :cond_0
    invoke-virtual {v0}, Landroid/webkit/WebView;->getContext()Landroid/content/Context;

    move-result-object v0

    .line 23
    :try_start_0
    new-instance v1, Landroid/content/Intent;

    const-class v2, Ltt/xinjian/cn/CropActivity;

    invoke-direct {v1, v0, v2}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V

    .line 24
    const/high16 v2, 0x10000000

    invoke-virtual {v1, v2}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    .line 25
    invoke-virtual {v0, v1}, Landroid/content/Context;->startActivity(Landroid/content/Intent;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_0

    .line 26
    :catch_0
    move-exception v0

    :goto_0
    nop

    .line 27
    return-void
.end method
