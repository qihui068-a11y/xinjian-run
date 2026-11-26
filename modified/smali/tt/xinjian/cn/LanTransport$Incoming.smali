.class final Ltt/xinjian/cn/LanTransport$Incoming;
.super Ljava/lang/Object;
.source "LanTransport.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Ltt/xinjian/cn/LanTransport;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "Incoming"
.end annotation


# instance fields
.field final from:Ljava/lang/String;

.field got:I

.field final height:I

.field final name:Ljava/lang/String;

.field final parts:[[B

.field final started:J

.field final total:I

.field final width:I


# direct methods
.method constructor <init>(Ljava/lang/String;Ljava/lang/String;III)V
    .locals 2

    .line 88
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 85
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v0

    iput-wide v0, p0, Ltt/xinjian/cn/LanTransport$Incoming;->started:J

    .line 89
    iput-object p1, p0, Ltt/xinjian/cn/LanTransport$Incoming;->from:Ljava/lang/String;

    .line 90
    iput-object p2, p0, Ltt/xinjian/cn/LanTransport$Incoming;->name:Ljava/lang/String;

    .line 91
    iput p3, p0, Ltt/xinjian/cn/LanTransport$Incoming;->width:I

    .line 92
    iput p4, p0, Ltt/xinjian/cn/LanTransport$Incoming;->height:I

    .line 93
    iput p5, p0, Ltt/xinjian/cn/LanTransport$Incoming;->total:I

    .line 94
    new-array p1, p5, [[B

    iput-object p1, p0, Ltt/xinjian/cn/LanTransport$Incoming;->parts:[[B

    .line 95
    return-void
.end method


# virtual methods
.method assemble()[B
    .locals 8

    .line 100
    nop

    .line 101
    iget-object v0, p0, Ltt/xinjian/cn/LanTransport$Incoming;->parts:[[B

    array-length v1, v0

    const/4 v2, 0x0

    const/4 v3, 0x0

    const/4 v4, 0x0

    :goto_0
    if-ge v3, v1, :cond_1

    aget-object v5, v0, v3

    if-eqz v5, :cond_0

    array-length v5, v5

    add-int/2addr v4, v5

    :cond_0
    add-int/lit8 v3, v3, 0x1

    goto :goto_0

    .line 102
    :cond_1
    new-array v0, v4, [B

    .line 103
    nop

    .line 104
    iget-object v1, p0, Ltt/xinjian/cn/LanTransport$Incoming;->parts:[[B

    array-length v3, v1

    const/4 v4, 0x0

    const/4 v5, 0x0

    :goto_1
    if-ge v4, v3, :cond_3

    aget-object v6, v1, v4

    .line 105
    if-nez v6, :cond_2

    goto :goto_2

    .line 106
    :cond_2
    array-length v7, v6

    invoke-static {v6, v2, v0, v5, v7}, Ljava/lang/System;->arraycopy(Ljava/lang/Object;ILjava/lang/Object;II)V

    .line 107
    array-length v6, v6

    add-int/2addr v5, v6

    .line 104
    :goto_2
    add-int/lit8 v4, v4, 0x1

    goto :goto_1

    .line 109
    :cond_3
    return-object v0
.end method

.method complete()Z
    .locals 2

    .line 97
    iget v0, p0, Ltt/xinjian/cn/LanTransport$Incoming;->got:I

    iget v1, p0, Ltt/xinjian/cn/LanTransport$Incoming;->total:I

    if-lt v0, v1, :cond_0

    const/4 v0, 0x1

    goto :goto_0

    :cond_0
    const/4 v0, 0x0

    :goto_0
    return v0
.end method
