.class Ltt/xinjian/cn/MainActivity$5;
.super Landroid/webkit/WebViewClient;
.source "MainActivity.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity;->onCreate(Landroid/os/Bundle;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/MainActivity;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity;)V
    .locals 0

    .line 520
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$5;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p0}, Landroid/webkit/WebViewClient;-><init>()V

    return-void
.end method


# virtual methods
.method public shouldInterceptRequest(Landroid/webkit/WebView;Landroid/webkit/WebResourceRequest;)Landroid/webkit/WebResourceResponse;
    .locals 0

    .line 523
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$5;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-interface {p2}, Landroid/webkit/WebResourceRequest;->getUrl()Landroid/net/Uri;

    move-result-object p2

    invoke-static {p1, p2}, Ltt/xinjian/cn/MainActivity;->access$500(Ltt/xinjian/cn/MainActivity;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;

    move-result-object p1

    return-object p1
.end method

.method public shouldInterceptRequest(Landroid/webkit/WebView;Ljava/lang/String;)Landroid/webkit/WebResourceResponse;
    .locals 0

    .line 529
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$5;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p2}, Landroid/net/Uri;->parse(Ljava/lang/String;)Landroid/net/Uri;

    move-result-object p2

    invoke-static {p1, p2}, Ltt/xinjian/cn/MainActivity;->access$500(Ltt/xinjian/cn/MainActivity;Landroid/net/Uri;)Landroid/webkit/WebResourceResponse;

    move-result-object p1

    return-object p1
.end method

.method public shouldOverrideUrlLoading(Landroid/webkit/WebView;Ljava/lang/String;)Z
    .locals 0

    .line 534
    const-string p1, "https://app.xinjian.local/"

    invoke-virtual {p2, p1}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result p1

    xor-int/lit8 p1, p1, 0x1

    return p1
.end method
