.class Ltt/xinjian/cn/LogBridge$1;
.super Ljava/lang/Object;
.source "LogBridge.java"

# interfaces
.implements Ljava/lang/Thread$UncaughtExceptionHandler;


# annotations
.annotation system Ldalvik/annotation/EnclosingMethod;
    value = Ltt/xinjian/cn/LogBridge;-><init>(Landroid/content/Context;)V
.end annotation

.annotation system Ldalvik/annotation/InnerClass;
    accessFlags = 0x0
    name = null
.end annotation


# instance fields
.field final synthetic this$0:Ltt/xinjian/cn/LogBridge;

.field final synthetic val$previous:Ljava/lang/Thread$UncaughtExceptionHandler;


# direct methods
.method constructor <init>(Ltt/xinjian/cn/LogBridge;Ljava/lang/Thread$UncaughtExceptionHandler;)V
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "()V"
        }
    .end annotation

    .line 61
    iput-object p1, p0, Ltt/xinjian/cn/LogBridge$1;->this$0:Ltt/xinjian/cn/LogBridge;

    iput-object p2, p0, Ltt/xinjian/cn/LogBridge$1;->val$previous:Ljava/lang/Thread$UncaughtExceptionHandler;

    invoke-direct {p0}, Ljava/lang/Object;-><init>()V

    return-void
.end method


# virtual methods
.method public uncaughtException(Ljava/lang/Thread;Ljava/lang/Throwable;)V
    .locals 1

    .line 63
    :try_start_0
    iget-object v0, p0, Ltt/xinjian/cn/LogBridge$1;->this$0:Ltt/xinjian/cn/LogBridge;

    invoke-static {v0, p1, p2}, Ltt/xinjian/cn/LogBridge;->access$000(Ltt/xinjian/cn/LogBridge;Ljava/lang/Thread;Ljava/lang/Throwable;)V
    :try_end_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    goto :goto_0

    :catchall_0
    move-exception v0

    .line 64
    :goto_0
    iget-object v0, p0, Ltt/xinjian/cn/LogBridge$1;->val$previous:Ljava/lang/Thread$UncaughtExceptionHandler;

    if-eqz v0, :cond_0

    .line 65
    iget-object v0, p0, Ltt/xinjian/cn/LogBridge$1;->val$previous:Ljava/lang/Thread$UncaughtExceptionHandler;

    invoke-interface {v0, p1, p2}, Ljava/lang/Thread$UncaughtExceptionHandler;->uncaughtException(Ljava/lang/Thread;Ljava/lang/Throwable;)V

    goto :goto_1

    .line 67
    :cond_0
    invoke-static {}, Landroid/os/Process;->myPid()I

    move-result p1

    invoke-static {p1}, Landroid/os/Process;->killProcess(I)V

    .line 68
    const/16 p1, 0xa

    invoke-static {p1}, Ljava/lang/System;->exit(I)V

    .line 70
    :goto_1
    return-void
.end method
