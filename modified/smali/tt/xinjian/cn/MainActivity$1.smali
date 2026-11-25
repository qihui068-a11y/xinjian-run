.class Ltt/xinjian/cn/MainActivity$1;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity;->toJs(Ljava/lang/String;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/MainActivity;

.field final synthetic val$code:Ljava/lang/String;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity;Ljava/lang/String;)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 90
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$1;->this$0:Ltt/xinjian/cn/MainActivity;

    iput-object p2, p0, Ltt/xinjian/cn/MainActivity$1;->val$code:Ljava/lang/String;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 3

    .line 92
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$1;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$000(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    iget-object v1, p0, Ltt/xinjian/cn/MainActivity$1;->val$code:Ljava/lang/String;

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void
.end method
