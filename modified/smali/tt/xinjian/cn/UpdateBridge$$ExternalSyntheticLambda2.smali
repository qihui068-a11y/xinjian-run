.class public final synthetic Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;
.super Ljava/lang/Object;
.source "D8$$SyntheticClass"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field public final synthetic f$0:Ltt/xinjian/cn/UpdateBridge;

.field public final synthetic f$1:Ljava/lang/String;


# direct methods
.method public synthetic constructor <init>(Ltt/xinjian/cn/UpdateBridge;Ljava/lang/String;)V
    .locals 0

    .line 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;->f$0:Ltt/xinjian/cn/UpdateBridge;

    iput-object p2, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;->f$1:Ljava/lang/String;

    return-void
.end method


# virtual methods
.method public final run()V
    .locals 2

    .line 0
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;->f$0:Ltt/xinjian/cn/UpdateBridge;

    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda2;->f$1:Ljava/lang/String;

    invoke-virtual {v0, v1}, Ltt/xinjian/cn/UpdateBridge;->lambda$publish$4$tt-xinjian-cn-UpdateBridge(Ljava/lang/String;)V

    return-void
.end method
