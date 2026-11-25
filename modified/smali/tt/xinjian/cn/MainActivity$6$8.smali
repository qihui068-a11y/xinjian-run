.class Ltt/xinjian/cn/MainActivity$6$8;
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

.field final synthetic val$et:Landroid/widget/EditText;

.field final synthetic val$r:Landroid/webkit/JsPromptResult;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsPromptResult;Landroid/widget/EditText;)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 613
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$6$8;->this$1:Ltt/xinjian/cn/MainActivity$6;

    iput-object p2, p0, Ltt/xinjian/cn/MainActivity$6$8;->val$r:Landroid/webkit/JsPromptResult;

    iput-object p3, p0, Ltt/xinjian/cn/MainActivity$6$8;->val$et:Landroid/widget/EditText;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onClick(Landroid/content/DialogInterface;I)V
    .locals 0

    .line 615
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6$8;->val$r:Landroid/webkit/JsPromptResult;

    iget-object p2, p0, Ltt/xinjian/cn/MainActivity$6$8;->val$et:Landroid/widget/EditText;

    invoke-virtual {p2}, Landroid/widget/EditText;->getText()Landroid/text/Editable;

    move-result-object p2

    invoke-virtual {p2}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object p2

    invoke-virtual {p1, p2}, Landroid/webkit/JsPromptResult;->confirm(Ljava/lang/String;)V

    return-void
.end method
