.class Ltt/xinjian/cn/MainActivity$7;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity;->notifyPerm(Ljava/lang/String;Z)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/MainActivity;

.field final synthetic val$js:Ljava/lang/String;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity;Ljava/lang/String;)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 647
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$7;->this$0:Ltt/xinjian/cn/MainActivity;

    iput-object p2, p0, Ltt/xinjian/cn/MainActivity$7;->val$js:Ljava/lang/String;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 650
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$7;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$000(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$7;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$000(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    iget-object v1, p0, Ltt/xinjian/cn/MainActivity$7;->val$js:Ljava/lang/String;

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    :cond_0
    return-void
.end method
