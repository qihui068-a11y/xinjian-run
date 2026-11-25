.class Ltt/xinjian/cn/MainActivity$8;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Landroid/webkit/ValueCallback;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity;->onBackPressed()V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Ljava/lang/Object;",
        "Landroid/webkit/ValueCallback<",
        "Ljava/lang/String;",
        ">;"
    }
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/MainActivity;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity;)V
    .locals 0

    .line 754
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$8;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public bridge synthetic onReceiveValue(Ljava/lang/Object;)V
    .locals 0

    .line 754
    check-cast p1, Ljava/lang/String;

    invoke-virtual {p0, p1}, Ltt/xinjian/cn/MainActivity$8;->onReceiveValue(Ljava/lang/String;)V

    return-void
.end method

.method public onReceiveValue(Ljava/lang/String;)V
    .locals 1

    if-eqz p1, :cond_1

    .line 758
    const-string v0, "handled"

    invoke-virtual {p1, v0}, Ljava/lang/String;->indexOf(Ljava/lang/String;)I

    move-result p1

    if-gez p1, :cond_0

    goto :goto_0

    :cond_0
    return-void

    :cond_1
    :goto_0
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$8;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-virtual {p1}, Ltt/xinjian/cn/MainActivity;->finish()V

    return-void
.end method
