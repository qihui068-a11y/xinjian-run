.class public final synthetic Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;
.super Ljava/lang/Object;
.source "D8$$SyntheticClass"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field public final synthetic f$0:Ltt/xinjian/cn/UpdateBridge;

.field public final synthetic f$1:Ltt/xinjian/cn/UpdateRelease;


# direct methods
.method public synthetic constructor <init>(Ltt/xinjian/cn/UpdateBridge;Ltt/xinjian/cn/UpdateRelease;)V
    .locals 0

    .line 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;->f$0:Ltt/xinjian/cn/UpdateBridge;

    iput-object p2, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;->f$1:Ltt/xinjian/cn/UpdateRelease;

    return-void
.end method


# virtual methods
.method public final run()V
    .locals 2

    .line 0
    iget-object v0, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;->f$0:Ltt/xinjian/cn/UpdateBridge;

    iget-object v1, p0, Ltt/xinjian/cn/UpdateBridge$$ExternalSyntheticLambda4;->f$1:Ltt/xinjian/cn/UpdateRelease;

    invoke-virtual {v0, v1}, Ltt/xinjian/cn/UpdateBridge;->lambda$install$2$tt-xinjian-cn-UpdateBridge(Ltt/xinjian/cn/UpdateRelease;)V

    return-void
.end method
