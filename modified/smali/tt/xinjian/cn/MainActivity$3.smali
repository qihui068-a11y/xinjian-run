.class Ltt/xinjian/cn/MainActivity$3;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Ljava/lang/Runnable;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/MainActivity;->locate()V
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

    .line 322
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$3;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public run()V
    .locals 2

    .line 324
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$3;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$300(Ltt/xinjian/cn/MainActivity;)Landroid/location/LocationListener;

    move-result-object v0

    if-eqz v0, :cond_0

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$3;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {v0}, Ltt/xinjian/cn/MainActivity;->access$200(Ltt/xinjian/cn/MainActivity;)V

    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$3;->this$0:Ltt/xinjian/cn/MainActivity;

    const-string v1, "timeout"

    invoke-static {v0, v1}, Ltt/xinjian/cn/MainActivity;->access$400(Ltt/xinjian/cn/MainActivity;Ljava/lang/String;)V

    :cond_0
    return-void
.end method
