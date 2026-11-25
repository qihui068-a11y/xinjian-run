.class Ltt/xinjian/cn/MainActivity$4;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity;->applyTheme(Z)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/MainActivity;

.field final synthetic val$bg:I

.field final synthetic val$dark:Z


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity;IZ)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 432
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    iput p2, p0, Ltt/xinjian/cn/MainActivity$4;->val$bg:I

    iput-boolean p3, p0, Ltt/xinjian/cn/MainActivity$4;->val$dark:Z

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 4

    .line 436
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    const/high16 v1, -0x80000000

    invoke-virtual {v0, v1}, Landroid/view/Window;->addFlags(I)V

    .line 437
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    new-instance v1, Landroid/graphics/drawable/ColorDrawable;

    iget v2, p0, Ltt/xinjian/cn/MainActivity$4;->val$bg:I

    invoke-direct {v1, v2}, Landroid/graphics/drawable/ColorDrawable;-><init>(I)V

    invoke-virtual {v0, v1}, Landroid/view/Window;->setBackgroundDrawable(Landroid/graphics/drawable/Drawable;)V

    .line 438
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$000(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$000(Ltt/xinjian/cn/MainActivity;)Landroid/webkit/WebView;

    move-result-object v0

    iget v1, p0, Ltt/xinjian/cn/MainActivity$4;->val$bg:I

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    .line 441
    :cond_0
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Landroid/view/Window;->setStatusBarColor(I)V

    .line 442
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    iget v1, p0, Ltt/xinjian/cn/MainActivity$4;->val$bg:I

    invoke-virtual {v0, v1}, Landroid/view/Window;->setNavigationBarColor(I)V

    .line 447
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$4;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-virtual {v0}, Ltt/xinjian/cn/MainActivity;->getWindow()Landroid/view/Window;

    move-result-object v0

    invoke-virtual {v0}, Landroid/view/Window;->getDecorView()Landroid/view/View;

    move-result-object v0

    .line 448
    invoke-virtual {v0}, Landroid/view/View;->getSystemUiVisibility()I

    move-result v1

    .line 449
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x17

    if-lt v2, v3, :cond_2

    .line 450
    iget-boolean v2, p0, Ltt/xinjian/cn/MainActivity$4;->val$dark:Z

    if-eqz v2, :cond_1

    and-int/lit16 v1, v1, -0x2001

    goto :goto_0

    :cond_1
    or-int/lit16 v1, v1, 0x2000

    .line 452
    :cond_2
    :goto_0
    sget v2, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v3, 0x1a

    if-lt v2, v3, :cond_4

    .line 453
    iget-boolean v2, p0, Ltt/xinjian/cn/MainActivity$4;->val$dark:Z

    if-eqz v2, :cond_3

    and-int/lit8 v1, v1, -0x11

    goto :goto_1

    :cond_3
    or-int/lit8 v1, v1, 0x10

    .line 455
    :cond_4
    :goto_1
    invoke-virtual {v0, v1}, Landroid/view/View;->setSystemUiVisibility(I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    :catch_0
    return-void
.end method
