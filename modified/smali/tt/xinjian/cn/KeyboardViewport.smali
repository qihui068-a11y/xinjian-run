.class public final Ltt/xinjian/cn/KeyboardViewport;
.super Ljava/lang/Object;
.source "KeyboardViewport.java"

# interfaces
.implements Landroid/view/View$OnApplyWindowInsetsListener;
.implements Landroid/view/ViewTreeObserver$OnGlobalLayoutListener;
.implements Ljava/lang/Runnable;


# instance fields
.field private final activity:Landroid/app/Activity;

.field private lastOverlap:I

.field private lastVisible:Z

.field private final position:[I

.field private final visibleFrame:Landroid/graphics/Rect;

.field private final web:Landroid/webkit/WebView;


# direct methods
.method public constructor <init>(Landroid/app/Activity;Landroid/webkit/WebView;)V
    .locals 1

    .line 21
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 16
    new-instance v0, Landroid/graphics/Rect;

    invoke-direct {v0}, Landroid/graphics/Rect;-><init>()V

    iput-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->visibleFrame:Landroid/graphics/Rect;

    .line 17
    const/4 v0, 0x2

    new-array v0, v0, [I

    iput-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->position:[I

    .line 18
    const/4 v0, -0x1

    iput v0, p0, Ltt/xinjian/cn/KeyboardViewport;->lastOverlap:I

    .line 22
    iput-object p1, p0, Ltt/xinjian/cn/KeyboardViewport;->activity:Landroid/app/Activity;

    .line 23
    iput-object p2, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    .line 24
    invoke-virtual {p2}, Landroid/webkit/WebView;->getViewTreeObserver()Landroid/view/ViewTreeObserver;

    move-result-object p1

    invoke-virtual {p1, p0}, Landroid/view/ViewTreeObserver;->addOnGlobalLayoutListener(Landroid/view/ViewTreeObserver$OnGlobalLayoutListener;)V

    .line 25
    sget p1, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v0, 0x1e

    if-lt p1, v0, :cond_0

    .line 26
    invoke-virtual {p2, p0}, Landroid/webkit/WebView;->setOnApplyWindowInsetsListener(Landroid/view/View$OnApplyWindowInsetsListener;)V

    .line 27
    invoke-virtual {p2}, Landroid/webkit/WebView;->requestApplyInsets()V

    .line 29
    :cond_0
    return-void
.end method


# virtual methods
.method public close()V
    .locals 2

    .line 72
    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v0, p0}, Landroid/webkit/WebView;->removeCallbacks(Ljava/lang/Runnable;)Z

    .line 73
    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->getViewTreeObserver()Landroid/view/ViewTreeObserver;

    move-result-object v0

    .line 74
    invoke-virtual {v0}, Landroid/view/ViewTreeObserver;->isAlive()Z

    move-result v1

    if-eqz v1, :cond_0

    invoke-virtual {v0, p0}, Landroid/view/ViewTreeObserver;->removeOnGlobalLayoutListener(Landroid/view/ViewTreeObserver$OnGlobalLayoutListener;)V

    .line 75
    :cond_0
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v1, 0x1e

    if-lt v0, v1, :cond_1

    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    const/4 v1, 0x0

    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setOnApplyWindowInsetsListener(Landroid/view/View$OnApplyWindowInsetsListener;)V

    .line 76
    :cond_1
    return-void
.end method

.method public onApplyWindowInsets(Landroid/view/View;Landroid/view/WindowInsets;)Landroid/view/WindowInsets;
    .locals 1

    .line 32
    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v0, p0}, Landroid/webkit/WebView;->removeCallbacks(Ljava/lang/Runnable;)Z

    .line 33
    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v0, p0}, Landroid/webkit/WebView;->post(Ljava/lang/Runnable;)Z

    .line 34
    invoke-virtual {p1, p2}, Landroid/view/View;->onApplyWindowInsets(Landroid/view/WindowInsets;)Landroid/view/WindowInsets;

    move-result-object p1

    return-object p1
.end method

.method public onGlobalLayout()V
    .locals 0

    .line 38
    invoke-virtual {p0}, Ltt/xinjian/cn/KeyboardViewport;->run()V

    .line 39
    return-void
.end method

.method public run()V
    .locals 7

    .line 42
    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v0}, Landroid/webkit/WebView;->getHeight()I

    move-result v0

    .line 43
    if-nez v0, :cond_0

    return-void

    .line 44
    :cond_0
    iget-object v1, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    iget-object v2, p0, Ltt/xinjian/cn/KeyboardViewport;->position:[I

    invoke-virtual {v1, v2}, Landroid/webkit/WebView;->getLocationOnScreen([I)V

    .line 45
    iget-object v1, p0, Ltt/xinjian/cn/KeyboardViewport;->position:[I

    const/4 v2, 0x1

    aget v1, v1, v2

    add-int/2addr v1, v0

    .line 46
    nop

    .line 47
    nop

    .line 48
    sget v3, Landroid/os/Build$VERSION;->SDK_INT:I

    const/16 v4, 0x1e

    const/4 v5, 0x0

    if-lt v3, v4, :cond_3

    .line 49
    iget-object v3, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v3}, Landroid/webkit/WebView;->getRootWindowInsets()Landroid/view/WindowInsets;

    move-result-object v3

    .line 50
    invoke-static {}, Landroid/view/WindowInsets$Type;->ime()I

    move-result v4

    .line 51
    if-eqz v3, :cond_2

    invoke-virtual {v3, v4}, Landroid/view/WindowInsets;->isVisible(I)Z

    move-result v6

    if-eqz v6, :cond_2

    .line 52
    invoke-virtual {v3, v4}, Landroid/view/WindowInsets;->getInsets(I)Landroid/graphics/Insets;

    move-result-object v3

    iget v3, v3, Landroid/graphics/Insets;->bottom:I

    .line 53
    if-lez v3, :cond_1

    goto :goto_0

    :cond_1
    const/4 v2, 0x0

    .line 54
    :goto_0
    iget-object v4, p0, Ltt/xinjian/cn/KeyboardViewport;->activity:Landroid/app/Activity;

    invoke-virtual {v4}, Landroid/app/Activity;->getWindowManager()Landroid/view/WindowManager;

    move-result-object v4

    invoke-interface {v4}, Landroid/view/WindowManager;->getCurrentWindowMetrics()Landroid/view/WindowMetrics;

    move-result-object v4

    invoke-virtual {v4}, Landroid/view/WindowMetrics;->getBounds()Landroid/graphics/Rect;

    move-result-object v4

    iget v4, v4, Landroid/graphics/Rect;->bottom:I

    sub-int/2addr v4, v3

    goto :goto_1

    .line 56
    :cond_2
    move v4, v1

    const/4 v2, 0x0

    :goto_1
    goto :goto_3

    .line 57
    :cond_3
    iget-object v3, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    iget-object v4, p0, Ltt/xinjian/cn/KeyboardViewport;->visibleFrame:Landroid/graphics/Rect;

    invoke-virtual {v3, v4}, Landroid/webkit/WebView;->getWindowVisibleDisplayFrame(Landroid/graphics/Rect;)V

    .line 58
    iget-object v3, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v3}, Landroid/webkit/WebView;->getResources()Landroid/content/res/Resources;

    move-result-object v3

    invoke-virtual {v3}, Landroid/content/res/Resources;->getDisplayMetrics()Landroid/util/DisplayMetrics;

    move-result-object v3

    iget v3, v3, Landroid/util/DisplayMetrics;->heightPixels:I

    invoke-static {v1, v3}, Ljava/lang/Math;->max(II)I

    move-result v3

    .line 59
    iget-object v4, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    invoke-virtual {v4}, Landroid/webkit/WebView;->getResources()Landroid/content/res/Resources;

    move-result-object v4

    invoke-virtual {v4}, Landroid/content/res/Resources;->getDisplayMetrics()Landroid/util/DisplayMetrics;

    move-result-object v4

    iget v4, v4, Landroid/util/DisplayMetrics;->density:F

    const/high16 v6, 0x42a00000    # 80.0f

    mul-float v4, v4, v6

    invoke-static {v4}, Ljava/lang/Math;->round(F)I

    move-result v4

    .line 60
    iget-object v6, p0, Ltt/xinjian/cn/KeyboardViewport;->visibleFrame:Landroid/graphics/Rect;

    iget v6, v6, Landroid/graphics/Rect;->bottom:I

    sub-int/2addr v3, v6

    if-lt v3, v4, :cond_4

    goto :goto_2

    :cond_4
    const/4 v2, 0x0

    .line 61
    :goto_2
    iget-object v3, p0, Ltt/xinjian/cn/KeyboardViewport;->visibleFrame:Landroid/graphics/Rect;

    iget v4, v3, Landroid/graphics/Rect;->bottom:I

    .line 63
    :goto_3
    if-eqz v2, :cond_5

    sub-int/2addr v1, v4

    invoke-static {v5, v1}, Ljava/lang/Math;->max(II)I

    move-result v1

    invoke-static {v0, v1}, Ljava/lang/Math;->min(II)I

    move-result v5

    .line 64
    :cond_5
    iget v0, p0, Ltt/xinjian/cn/KeyboardViewport;->lastOverlap:I

    if-ne v5, v0, :cond_6

    iget-boolean v0, p0, Ltt/xinjian/cn/KeyboardViewport;->lastVisible:Z

    if-ne v2, v0, :cond_6

    return-void

    .line 65
    :cond_6
    iput v5, p0, Ltt/xinjian/cn/KeyboardViewport;->lastOverlap:I

    .line 66
    iput-boolean v2, p0, Ltt/xinjian/cn/KeyboardViewport;->lastVisible:Z

    .line 67
    iget-object v0, p0, Ltt/xinjian/cn/KeyboardViewport;->web:Landroid/webkit/WebView;

    new-instance v1, Ljava/lang/StringBuilder;

    invoke-direct {v1}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "window.__xjKeyboardViewport&&window.__xjKeyboardViewport("

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, v5}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v3, ","

    invoke-virtual {v1, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Z)Ljava/lang/StringBuilder;

    move-result-object v1

    const-string v2, ")"

    invoke-virtual {v1, v2}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    const/4 v2, 0x0

    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V

    .line 69
    return-void
.end method
