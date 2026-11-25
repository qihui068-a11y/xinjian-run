.class Ltt/xinjian/cn/MainActivity$6$7;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Landroid/content/DialogInterface$OnClickListener;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity$6;->onJsPrompt(Landroid/webkit/WebView;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Landroid/webkit/JsPromptResult;)Z
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$1:Ltt/xinjian/cn/MainActivity$6;

.field final synthetic val$r:Landroid/webkit/JsPromptResult;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsPromptResult;)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 618
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$6$7;->this$1:Ltt/xinjian/cn/MainActivity$6;

    iput-object p2, p0, Ltt/xinjian/cn/MainActivity$6$7;->val$r:Landroid/webkit/JsPromptResult;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onClick(Landroid/content/DialogInterface;I)V
    .locals 0

    .line 619
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6$7;->val$r:Landroid/webkit/JsPromptResult;

    invoke-virtual {p1}, Landroid/webkit/JsPromptResult;->cancel()V

    return-void
.end method
