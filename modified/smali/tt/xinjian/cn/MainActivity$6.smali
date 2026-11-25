.class Ltt/xinjian/cn/MainActivity$6;
.super Landroid/webkit/WebChromeClient;
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

    .line 538
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V

    return-void
.end method


# virtual methods
.method public onJsAlert(Landroid/webkit/WebView;Ljava/lang/String;Ljava/lang/String;Landroid/webkit/JsResult;)Z
    .locals 0

    .line 576
    new-instance p1, Landroid/app/AlertDialog$Builder;

    iget-object p2, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p1, p2}, Landroid/app/AlertDialog$Builder;-><init>(Landroid/content/Context;)V

    .line 577
    invoke-virtual {p1, p3}, Landroid/app/AlertDialog$Builder;->setMessage(Ljava/lang/CharSequence;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$2;

    invoke-direct {p2, p0, p4}, Ltt/xinjian/cn/MainActivity$6$2;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsResult;)V

    .line 578
    const-string p3, "\u597d"

    invoke-virtual {p1, p3, p2}, Landroid/app/AlertDialog$Builder;->setPositiveButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$1;

    invoke-direct {p2, p0, p4}, Ltt/xinjian/cn/MainActivity$6$1;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsResult;)V

    .line 581
    invoke-virtual {p1, p2}, Landroid/app/AlertDialog$Builder;->setOnCancelListener(Landroid/content/DialogInterface$OnCancelListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    .line 584
    invoke-virtual {p1}, Landroid/app/AlertDialog$Builder;->show()Landroid/app/AlertDialog;

    const/4 p1, 0x1

    return p1
.end method

.method public onJsConfirm(Landroid/webkit/WebView;Ljava/lang/String;Ljava/lang/String;Landroid/webkit/JsResult;)Z
    .locals 0

    .line 590
    new-instance p1, Landroid/app/AlertDialog$Builder;

    iget-object p2, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p1, p2}, Landroid/app/AlertDialog$Builder;-><init>(Landroid/content/Context;)V

    .line 591
    invoke-virtual {p1, p3}, Landroid/app/AlertDialog$Builder;->setMessage(Ljava/lang/CharSequence;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$5;

    invoke-direct {p2, p0, p4}, Ltt/xinjian/cn/MainActivity$6$5;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsResult;)V

    .line 592
    const-string p3, "\u786e\u5b9a"

    invoke-virtual {p1, p3, p2}, Landroid/app/AlertDialog$Builder;->setPositiveButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$4;

    invoke-direct {p2, p0, p4}, Ltt/xinjian/cn/MainActivity$6$4;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsResult;)V

    .line 595
    const-string p3, "\u53d6\u6d88"

    invoke-virtual {p1, p3, p2}, Landroid/app/AlertDialog$Builder;->setNegativeButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$3;

    invoke-direct {p2, p0, p4}, Ltt/xinjian/cn/MainActivity$6$3;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsResult;)V

    .line 598
    invoke-virtual {p1, p2}, Landroid/app/AlertDialog$Builder;->setOnCancelListener(Landroid/content/DialogInterface$OnCancelListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    .line 601
    invoke-virtual {p1}, Landroid/app/AlertDialog$Builder;->show()Landroid/app/AlertDialog;

    const/4 p1, 0x1

    return p1
.end method

.method public onJsPrompt(Landroid/webkit/WebView;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Landroid/webkit/JsPromptResult;)Z
    .locals 0

    .line 608
    new-instance p1, Landroid/widget/EditText;

    iget-object p2, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p1, p2}, Landroid/widget/EditText;-><init>(Landroid/content/Context;)V

    if-nez p4, :cond_0

    .line 609
    const-string p4, ""

    :cond_0
    invoke-virtual {p1, p4}, Landroid/widget/EditText;->setText(Ljava/lang/CharSequence;)V

    .line 610
    new-instance p2, Landroid/app/AlertDialog$Builder;

    iget-object p4, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p2, p4}, Landroid/app/AlertDialog$Builder;-><init>(Landroid/content/Context;)V

    .line 611
    invoke-virtual {p2, p3}, Landroid/app/AlertDialog$Builder;->setMessage(Ljava/lang/CharSequence;)Landroid/app/AlertDialog$Builder;

    move-result-object p2

    .line 612
    invoke-virtual {p2, p1}, Landroid/app/AlertDialog$Builder;->setView(Landroid/view/View;)Landroid/app/AlertDialog$Builder;

    move-result-object p2

    new-instance p3, Ltt/xinjian/cn/MainActivity$6$8;

    invoke-direct {p3, p0, p5, p1}, Ltt/xinjian/cn/MainActivity$6$8;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsPromptResult;Landroid/widget/EditText;)V

    .line 613
    const-string p1, "\u786e\u5b9a"

    invoke-virtual {p2, p1, p3}, Landroid/app/AlertDialog$Builder;->setPositiveButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$7;

    invoke-direct {p2, p0, p5}, Ltt/xinjian/cn/MainActivity$6$7;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsPromptResult;)V

    .line 618
    const-string p3, "\u53d6\u6d88"

    invoke-virtual {p1, p3, p2}, Landroid/app/AlertDialog$Builder;->setNegativeButton(Ljava/lang/CharSequence;Landroid/content/DialogInterface$OnClickListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    new-instance p2, Ltt/xinjian/cn/MainActivity$6$6;

    invoke-direct {p2, p0, p5}, Ltt/xinjian/cn/MainActivity$6$6;-><init>(Ltt/xinjian/cn/MainActivity$6;Landroid/webkit/JsPromptResult;)V

    .line 621
    invoke-virtual {p1, p2}, Landroid/app/AlertDialog$Builder;->setOnCancelListener(Landroid/content/DialogInterface$OnCancelListener;)Landroid/app/AlertDialog$Builder;

    move-result-object p1

    .line 624
    invoke-virtual {p1}, Landroid/app/AlertDialog$Builder;->show()Landroid/app/AlertDialog;

    const/4 p1, 0x1

    return p1
.end method

.method public onShowFileChooser(Landroid/webkit/WebView;Landroid/webkit/ValueCallback;Landroid/webkit/WebChromeClient$FileChooserParams;)Z
    .locals 3
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroid/webkit/WebView;",
            "Landroid/webkit/ValueCallback<",
            "[",
            "Landroid/net/Uri;",
            ">;",
            "Landroid/webkit/WebChromeClient$FileChooserParams;",
            ")Z"
        }
    .end annotation

    .line 545
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p1}, Ltt/xinjian/cn/MainActivity;->access$600(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/ValueCallback;

    move-result-object p1

    const/4 v0, 0x0

    if-eqz p1, :cond_0

    .line 546
    :try_start_0
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p1}, Ltt/xinjian/cn/MainActivity;->access$600(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/ValueCallback;

    move-result-object p1

    invoke-interface {p1, v0}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 547
    :catch_0
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p1, v0}, Ltt/xinjian/cn/MainActivity;->access$602(Ltt/xinjian/cn/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;

    .line 549
    :cond_0
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p1, p2}, Ltt/xinjian/cn/MainActivity;->access$602(Ltt/xinjian/cn/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;

    .line 552
    :try_start_1
    invoke-virtual {p3}, Landroid/webkit/WebChromeClient$FileChooserParams;->createIntent()Landroid/content/Intent;

    move-result-object p1
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_1

    goto :goto_0

    :catch_1
    nop

    move-object p1, v0

    :goto_0
    if-nez p1, :cond_1

    .line 555
    new-instance p1, Landroid/content/Intent;

    const-string v1, "android.intent.action.GET_CONTENT"

    invoke-direct {p1, v1}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 556
    const-string v1, "android.intent.category.OPENABLE"

    invoke-virtual {p1, v1}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    .line 557
    const-string v1, "*/*"

    invoke-virtual {p1, v1}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    .line 559
    :cond_1
    invoke-virtual {p3}, Landroid/webkit/WebChromeClient$FileChooserParams;->getMode()I

    move-result p3

    const/4 v1, 0x1

    if-ne p3, v1, :cond_2

    .line 560
    const-string p3, "android.intent.extra.ALLOW_MULTIPLE"

    invoke-virtual {p1, p3, v1}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 562
    :cond_2
    invoke-virtual {p1, v1}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    .line 565
    :try_start_2
    iget-object p3, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    const/16 v2, 0x7d4

    invoke-virtual {p3, p1, v2}, Ltt/xinjian/cn/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_2

    goto :goto_1

    .line 568
    :catch_2
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$6;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p1, v0}, Ltt/xinjian/cn/MainActivity;->access$602(Ltt/xinjian/cn/MainActivity;Landroid/webkit/ValueCallback;)Landroid/webkit/ValueCallback;

    .line 569
    :try_start_3
    invoke-interface {p2, v0}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_3

    :catch_3
    :goto_1
    return v1
.end method
