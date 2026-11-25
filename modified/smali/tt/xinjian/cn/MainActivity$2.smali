.class Ltt/xinjian/cn/MainActivity$2;
.super Ljava/lang/Object;
.source "MainActivity.java"

# interfaces
.implements Landroid/location/LocationListener;


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

.field final synthetic val$f2:Z


# direct methods
.method constructor <init>(Ltt/xinjian/cn/MainActivity;Z)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 310
    iput-object p1, p0, Ltt/xinjian/cn/MainActivity$2;->this$0:Ltt/xinjian/cn/MainActivity;

    iput-boolean p2, p0, Ltt/xinjian/cn/MainActivity$2;->val$f2:Z

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public onLocationChanged(Landroid/location/Location;)V
    .locals 2

    if-eqz p1, :cond_0

    .line 312
    iget-object v0, p0, Ltt/xinjian/cn/MainActivity$2;->this$0:Ltt/xinjian/cn/MainActivity;

    iget-boolean v1, p0, Ltt/xinjian/cn/MainActivity$2;->val$f2:Z

    invoke-static {v0, p1, v1}, Ltt/xinjian/cn/MainActivity;->access$100(Ltt/xinjian/cn/MainActivity;Landroid/location/Location;Z)V

    .line 313
    :cond_0
    iget-object p1, p0, Ltt/xinjian/cn/MainActivity$2;->this$0:Ltt/xinjian/cn/MainActivity;

    invoke-static {p1}, Ltt/xinjian/cn/MainActivity;->access$200(Ltt/xinjian/cn/MainActivity;)V

    return-void
.end method

.method public onProviderDisabled(Ljava/lang/String;)V
    .locals 0

    return-void
.end method

.method public onProviderEnabled(Ljava/lang/String;)V
    .locals 0

    return-void
.end method

.method public onStatusChanged(Ljava/lang/String;ILandroid/os/Bundle;)V
    .locals 0

    return-void
.end method
