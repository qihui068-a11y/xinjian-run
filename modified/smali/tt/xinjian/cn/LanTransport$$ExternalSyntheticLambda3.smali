.class public final synthetic Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;
.super Ljava/lang/Object;
.source "D8$$SyntheticClass"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field public final synthetic f$0:Ltt/xinjian/cn/LanTransport;

.field public final synthetic f$1:Ljava/net/Socket;


# direct methods
.method public synthetic constructor <init>(Ltt/xinjian/cn/LanTransport;Ljava/net/Socket;)V
    .locals 0

    .line 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;->f$0:Ltt/xinjian/cn/LanTransport;

    iput-object p2, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;->f$1:Ljava/net/Socket;

    return-void
.end method


# virtual methods
.method public final run()V
    .locals 2

    .line 0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;->f$0:Ltt/xinjian/cn/LanTransport;

    iget-object v1, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda3;->f$1:Ljava/net/Socket;

    invoke-virtual {v0, v1}, Ltt/xinjian/cn/LanTransport;->lambda$accept$1$tt-xinjian-cn-LanTransport(Ljava/net/Socket;)V

    return-void
.end method
