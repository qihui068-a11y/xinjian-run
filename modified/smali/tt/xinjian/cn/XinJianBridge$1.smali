.class Ltt/xinjian/cn/XinJianBridge$1;
.super Ljava/lang/Object;
.source "XinJianBridge.java"

# interfaces
.implements Ljava/util/Comparator;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/XinJianBridge;->list()Ljava/lang/String;
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation

.annotation system Ldalvik/annotation/Signature;
    value = {
        "Ljava/lang/Object;",
        "Ljava/util/Comparator<",
        "Ljava/io/File;",
        ">;"
    }
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/XinJianBridge;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/XinJianBridge;)V
    .locals 0

    .line 278
    iput-object p1, p0, Ltt/xinjian/cn/XinJianBridge$1;->this$0:Ltt/xinjian/cn/XinJianBridge;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public compare(Ljava/io/File;Ljava/io/File;)I
    .locals 2

    .line 280
    invoke-virtual {p2}, Ljava/io/File;->lastModified()J

    move-result-wide v0

    invoke-virtual {p1}, Ljava/io/File;->lastModified()J

    move-result-wide p1

    invoke-static {v0, v1, p1, p2}, Ljava/lang/Long;->compare(JJ)I

    move-result p1

    return p1
.end method

.method public bridge synthetic compare(Ljava/lang/Object;Ljava/lang/Object;)I
    .locals 0

    .line 278
    check-cast p1, Ljava/io/File;

    check-cast p2, Ljava/io/File;

    invoke-virtual {p0, p1, p2}, Ltt/xinjian/cn/XinJianBridge$1;->compare(Ljava/io/File;Ljava/io/File;)I

    move-result p1

    return p1
.end method
