.class final Ltt/xinjian/cn/LanTransport$Peer;
.super Ljava/lang/Object;
.source "LanTransport.java"


# annotations
.annotation system Ldalvik/annotation/EnclosingClass;
    value = Ltt/xinjian/cn/LanTransport;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x1a
    name = "Peer"
.end annotation


# instance fields
.field final address:Ljava/net/InetAddress;

.field final nick:Ljava/lang/String;

.field final seen:J


# direct methods
.method constructor <init>(Ljava/net/InetAddress;Ljava/lang/String;)V
    .locals 2

    .line 64
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    .line 62
    invoke-static {}, Ljava/lang/System;->nanoTime()J

    move-result-wide v0

    iput-wide v0, p0, Ltt/xinjian/cn/LanTransport$Peer;->seen:J

    .line 65
    iput-object p1, p0, Ltt/xinjian/cn/LanTransport$Peer;->address:Ljava/net/InetAddress;

    .line 66
    iput-object p2, p0, Ltt/xinjian/cn/LanTransport$Peer;->nick:Ljava/lang/String;

    .line 67
    return-void
.end method
