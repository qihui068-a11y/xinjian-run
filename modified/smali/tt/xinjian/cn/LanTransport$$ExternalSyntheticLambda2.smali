.class public final synthetic Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;
.super Ljava/lang/Object;
.source "D8$$SyntheticClass"

# interfaces
.implements Ljava/lang/Runnable;


# instance fields
.field public final synthetic f$0:Ltt/xinjian/cn/LanTransport;

.field public final synthetic f$1:Ltt/xinjian/cn/LanTransport$Peer;

.field public final synthetic f$2:Ljava/lang/String;

.field public final synthetic f$3:Ljava/lang/String;

.field public final synthetic f$4:Ljava/lang/String;

.field public final synthetic f$5:I

.field public final synthetic f$6:I

.field public final synthetic f$7:Ljava/lang/String;

.field public final synthetic f$8:I


# direct methods
.method public synthetic constructor <init>(Ltt/xinjian/cn/LanTransport;Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;I)V
    .locals 0

    .line 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    iput-object p1, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$0:Ltt/xinjian/cn/LanTransport;

    iput-object p2, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$1:Ltt/xinjian/cn/LanTransport$Peer;

    iput-object p3, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$2:Ljava/lang/String;

    iput-object p4, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$3:Ljava/lang/String;

    iput-object p5, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$4:Ljava/lang/String;

    iput p6, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$5:I

    iput p7, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$6:I

    iput-object p8, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$7:Ljava/lang/String;

    iput p9, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$8:I

    return-void
.end method


# virtual methods
.method public final run()V
    .locals 9

    .line 0
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$0:Ltt/xinjian/cn/LanTransport;

    iget-object v1, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$1:Ltt/xinjian/cn/LanTransport$Peer;

    iget-object v2, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$2:Ljava/lang/String;

    iget-object v3, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$3:Ljava/lang/String;

    iget-object v4, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$4:Ljava/lang/String;

    iget v5, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$5:I

    iget v6, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$6:I

    iget-object v7, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$7:Ljava/lang/String;

    iget v8, p0, Ltt/xinjian/cn/LanTransport$$ExternalSyntheticLambda2;->f$8:I

    invoke-virtual/range {v0 .. v8}, Ltt/xinjian/cn/LanTransport;->lambda$sendImage$2$tt-xinjian-cn-LanTransport(Ltt/xinjian/cn/LanTransport$Peer;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;I)V

    return-void
.end method
