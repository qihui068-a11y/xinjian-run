.class public final Ltt/xinjian/cn/CropActivity;
.super Landroid/app/Activity;
.source "CropActivity.java"


# static fields
.field private static final CROP:I = 0x2

.field private static final PICK:I = 0x1


# instance fields
.field private output:Landroid/net/Uri;

.field private source:Landroid/net/Uri;


# direct methods
.method public constructor <init>()V
    .locals 0

    .line 19
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V

    return-void
.end method

.method private copyAndFinish(Landroid/net/Uri;)V
    .locals 8

    .line 88
    const/4 v0, 0x0

    if-nez p1, :cond_0

    .line 89
    const-string p1, "empty"

    invoke-direct {p0, v0, p1}, Ltt/xinjian/cn/CropActivity;->finishWith(ZLjava/lang/String;)V

    .line 90
    return-void

    .line 92
    :cond_0
    const-string v1, "image/jpeg"

    .line 94
    :try_start_0
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v2

    invoke-virtual {v2, p1}, Landroid/content/ContentResolver;->getType(Landroid/net/Uri;)Ljava/lang/String;

    move-result-object v2

    .line 95
    if-eqz v2, :cond_1

    const-string v3, "image/"

    invoke-virtual {v2, v3}, Ljava/lang/String;->startsWith(Ljava/lang/String;)Z

    move-result v3
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    if-eqz v3, :cond_1

    move-object v1, v2

    goto :goto_0

    .line 96
    :catch_0
    move-exception v2

    :cond_1
    :goto_0
    nop

    .line 97
    const-string v2, "png"

    invoke-virtual {v1, v2}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v2

    if-eqz v2, :cond_2

    const-string v1, ".png"

    goto :goto_1

    :cond_2
    const-string v2, "webp"

    invoke-virtual {v1, v2}, Ljava/lang/String;->endsWith(Ljava/lang/String;)Z

    move-result v1

    if-eqz v1, :cond_3

    const-string v1, ".webp"

    goto :goto_1

    :cond_3
    const-string v1, ".jpg"

    .line 98
    :goto_1
    const/4 v2, 0x0

    invoke-virtual {p0, v2}, Ltt/xinjian/cn/CropActivity;->getExternalFilesDir(Ljava/lang/String;)Ljava/io/File;

    move-result-object v3

    .line 99
    if-nez v3, :cond_4

    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getFilesDir()Ljava/io/File;

    move-result-object v3

    .line 100
    :cond_4
    new-instance v4, Ljava/io/File;

    const-string v5, "media"

    invoke-direct {v4, v3, v5}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 101
    new-instance v3, Ljava/io/File;

    new-instance v5, Ljava/lang/StringBuilder;

    invoke-direct {v5}, Ljava/lang/StringBuilder;-><init>()V

    const-string v6, "bg_"

    invoke-virtual {v5, v6}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v5

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v6

    invoke-virtual {v5, v6, v7}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    move-result-object v5

    invoke-virtual {v5, v1}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v1

    invoke-virtual {v1}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v1

    invoke-direct {v3, v4, v1}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V

    .line 102
    nop

    .line 103
    nop

    .line 105
    :try_start_1
    invoke-virtual {v4}, Ljava/io/File;->isDirectory()Z

    move-result v1

    if-nez v1, :cond_6

    invoke-virtual {v4}, Ljava/io/File;->mkdirs()Z

    move-result v1

    if-eqz v1, :cond_5

    goto :goto_2

    :cond_5
    new-instance v1, Ljava/lang/Exception;

    const-string v4, "mkdir"

    invoke-direct {v1, v4}, Ljava/lang/Exception;-><init>(Ljava/lang/String;)V

    throw v1

    .line 106
    :cond_6
    :goto_2
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    invoke-virtual {v1, p1}, Landroid/content/ContentResolver;->openInputStream(Landroid/net/Uri;)Ljava/io/InputStream;

    move-result-object v1
    :try_end_1
    .catch Ljava/lang/Exception; {:try_start_1 .. :try_end_1} :catch_6
    .catchall {:try_start_1 .. :try_end_1} :catchall_1

    .line 107
    if-eqz v1, :cond_a

    .line 108
    :try_start_2
    new-instance v4, Ljava/io/FileOutputStream;

    invoke-direct {v4, v3}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    :try_end_2
    .catch Ljava/lang/Exception; {:try_start_2 .. :try_end_2} :catch_5
    .catchall {:try_start_2 .. :try_end_2} :catchall_0

    .line 109
    const/16 v5, 0x2000

    :try_start_3
    new-array v5, v5, [B

    .line 111
    :goto_3
    invoke-virtual {v1, v5}, Ljava/io/InputStream;->read([B)I

    move-result v6

    if-lez v6, :cond_7

    invoke-virtual {v4, v5, v0, v6}, Ljava/io/OutputStream;->write([BII)V

    goto :goto_3

    .line 112
    :cond_7
    invoke-virtual {v4}, Ljava/io/OutputStream;->flush()V
    :try_end_3
    .catch Ljava/lang/Exception; {:try_start_3 .. :try_end_3} :catch_4
    .catchall {:try_start_3 .. :try_end_3} :catchall_2

    .line 118
    if-eqz v1, :cond_8

    :try_start_4
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_4
    .catch Ljava/lang/Exception; {:try_start_4 .. :try_end_4} :catch_1

    goto :goto_4

    :catch_1
    move-exception v0

    .line 119
    :cond_8
    :goto_4
    :try_start_5
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_5
    .catch Ljava/lang/Exception; {:try_start_5 .. :try_end_5} :catch_2

    goto :goto_5

    :catch_2
    move-exception v0

    .line 120
    :goto_5
    iget-object v0, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    if-eqz v0, :cond_9

    iget-object v0, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {v0, p1}, Landroid/net/Uri;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_9

    .line 121
    :try_start_6
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p1

    iget-object v0, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {p1, v0, v2, v2}, Landroid/content/ContentResolver;->delete(Landroid/net/Uri;Ljava/lang/String;[Ljava/lang/String;)I
    :try_end_6
    .catch Ljava/lang/Exception; {:try_start_6 .. :try_end_6} :catch_3

    goto :goto_6

    :catch_3
    move-exception p1

    .line 124
    :cond_9
    :goto_6
    const/4 p1, 0x1

    invoke-virtual {v3}, Ljava/io/File;->getName()Ljava/lang/String;

    move-result-object v0

    invoke-direct {p0, p1, v0}, Ltt/xinjian/cn/CropActivity;->finishWith(ZLjava/lang/String;)V

    .line 125
    return-void

    .line 113
    :catch_4
    move-exception v5

    goto :goto_7

    .line 118
    :catchall_0
    move-exception v0

    move-object v4, v2

    goto :goto_b

    .line 113
    :catch_5
    move-exception v4

    move-object v4, v2

    goto :goto_7

    .line 107
    :cond_a
    :try_start_7
    new-instance v4, Ljava/lang/Exception;

    const-string v5, "open"

    invoke-direct {v4, v5}, Ljava/lang/Exception;-><init>(Ljava/lang/String;)V

    throw v4
    :try_end_7
    .catch Ljava/lang/Exception; {:try_start_7 .. :try_end_7} :catch_5
    .catchall {:try_start_7 .. :try_end_7} :catchall_0

    .line 118
    :catchall_1
    move-exception v0

    move-object v1, v2

    move-object v4, v1

    goto :goto_b

    .line 113
    :catch_6
    move-exception v1

    move-object v1, v2

    move-object v4, v1

    .line 114
    :goto_7
    :try_start_8
    invoke-virtual {v3}, Ljava/io/File;->delete()Z

    .line 115
    const-string v3, "copy"

    invoke-direct {p0, v0, v3}, Ltt/xinjian/cn/CropActivity;->finishWith(ZLjava/lang/String;)V
    :try_end_8
    .catchall {:try_start_8 .. :try_end_8} :catchall_2

    .line 118
    if-eqz v1, :cond_b

    :try_start_9
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_9
    .catch Ljava/lang/Exception; {:try_start_9 .. :try_end_9} :catch_7

    goto :goto_8

    :catch_7
    move-exception v0

    .line 119
    :cond_b
    :goto_8
    if-eqz v4, :cond_c

    :try_start_a
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_a
    .catch Ljava/lang/Exception; {:try_start_a .. :try_end_a} :catch_8

    goto :goto_9

    :catch_8
    move-exception v0

    .line 120
    :cond_c
    :goto_9
    iget-object v0, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    if-eqz v0, :cond_d

    iget-object v0, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {v0, p1}, Landroid/net/Uri;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_d

    .line 121
    :try_start_b
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p1

    iget-object v0, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {p1, v0, v2, v2}, Landroid/content/ContentResolver;->delete(Landroid/net/Uri;Ljava/lang/String;[Ljava/lang/String;)I
    :try_end_b
    .catch Ljava/lang/Exception; {:try_start_b .. :try_end_b} :catch_9

    goto :goto_a

    :catch_9
    move-exception p1

    .line 116
    :cond_d
    :goto_a
    return-void

    .line 118
    :catchall_2
    move-exception v0

    :goto_b
    if-eqz v1, :cond_e

    :try_start_c
    invoke-virtual {v1}, Ljava/io/InputStream;->close()V
    :try_end_c
    .catch Ljava/lang/Exception; {:try_start_c .. :try_end_c} :catch_a

    goto :goto_c

    :catch_a
    move-exception v1

    .line 119
    :cond_e
    :goto_c
    if-eqz v4, :cond_f

    :try_start_d
    invoke-virtual {v4}, Ljava/io/OutputStream;->close()V
    :try_end_d
    .catch Ljava/lang/Exception; {:try_start_d .. :try_end_d} :catch_b

    goto :goto_d

    :catch_b
    move-exception v1

    .line 120
    :cond_f
    :goto_d
    iget-object v1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    if-eqz v1, :cond_10

    iget-object v1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {v1, p1}, Landroid/net/Uri;->equals(Ljava/lang/Object;)Z

    move-result p1

    if-eqz p1, :cond_10

    .line 121
    :try_start_e
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object p1

    iget-object v1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {p1, v1, v2, v2}, Landroid/content/ContentResolver;->delete(Landroid/net/Uri;Ljava/lang/String;[Ljava/lang/String;)I
    :try_end_e
    .catch Ljava/lang/Exception; {:try_start_e .. :try_end_e} :catch_c

    goto :goto_e

    :catch_c
    move-exception p1

    .line 123
    :cond_10
    :goto_e
    throw v0
.end method

.method private finishWith(ZLjava/lang/String;)V
    .locals 2

    .line 129
    :try_start_0
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    .line 130
    const-string v1, "ok"

    invoke-virtual {v0, v1, p1}, Lorg/json/JSONObject;->put(Ljava/lang/String;Z)Lorg/json/JSONObject;

    .line 131
    if-eqz p1, :cond_0

    const-string p1, "name"

    invoke-virtual {v0, p1, p2}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    goto :goto_0

    .line 132
    :cond_0
    const-string p1, "why"

    invoke-virtual {v0, p1, p2}, Lorg/json/JSONObject;->put(Ljava/lang/String;Ljava/lang/Object;)Lorg/json/JSONObject;

    .line 133
    :goto_0
    invoke-virtual {v0}, Lorg/json/JSONObject;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p1}, Ltt/xinjian/cn/CropBridge;->deliver(Ljava/lang/String;)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    goto :goto_1

    .line 134
    :catch_0
    move-exception p1

    :goto_1
    nop

    .line 135
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->finish()V

    .line 136
    return-void
.end method

.method private outputUri()Landroid/net/Uri;
    .locals 5

    .line 78
    :try_start_0
    new-instance v0, Landroid/content/ContentValues;

    invoke-direct {v0}, Landroid/content/ContentValues;-><init>()V

    .line 79
    const-string v1, "_display_name"

    new-instance v2, Ljava/lang/StringBuilder;

    invoke-direct {v2}, Ljava/lang/StringBuilder;-><init>()V

    const-string v3, "xj_crop_"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J

    move-result-wide v3

    invoke-virtual {v2, v3, v4}, Ljava/lang/StringBuilder;->append(J)Ljava/lang/StringBuilder;

    move-result-object v2

    const-string v3, ".jpg"

    invoke-virtual {v2, v3}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;

    move-result-object v2

    invoke-virtual {v2}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;

    move-result-object v2

    invoke-virtual {v0, v1, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 80
    const-string v1, "mime_type"

    const-string v2, "image/jpeg"

    invoke-virtual {v0, v1, v2}, Landroid/content/ContentValues;->put(Ljava/lang/String;Ljava/lang/String;)V

    .line 81
    invoke-virtual {p0}, Ltt/xinjian/cn/CropActivity;->getContentResolver()Landroid/content/ContentResolver;

    move-result-object v1

    sget-object v2, Landroid/provider/MediaStore$Images$Media;->EXTERNAL_CONTENT_URI:Landroid/net/Uri;

    invoke-virtual {v1, v2, v0}, Landroid/content/ContentResolver;->insert(Landroid/net/Uri;Landroid/content/ContentValues;)Landroid/net/Uri;

    move-result-object v0
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    return-object v0

    .line 82
    :catch_0
    move-exception v0

    .line 83
    const/4 v0, 0x0

    return-object v0
.end method


# virtual methods
.method protected onActivityResult(IILandroid/content/Intent;)V
    .locals 5

    .line 39
    const-string v0, "cancel"

    const/4 v1, -0x1

    const/4 v2, 0x0

    const/4 v3, 0x2

    const/4 v4, 0x1

    if-ne p1, v4, :cond_3

    .line 40
    if-ne p2, v1, :cond_2

    if-eqz p3, :cond_2

    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p1

    if-nez p1, :cond_0

    goto :goto_1

    .line 44
    :cond_0
    invoke-virtual {p3}, Landroid/content/Intent;->getData()Landroid/net/Uri;

    move-result-object p1

    iput-object p1, p0, Ltt/xinjian/cn/CropActivity;->source:Landroid/net/Uri;

    .line 45
    invoke-direct {p0}, Ltt/xinjian/cn/CropActivity;->outputUri()Landroid/net/Uri;

    move-result-object p1

    iput-object p1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    .line 46
    iget-object p1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    if-nez p1, :cond_1

    .line 47
    iget-object p1, p0, Ltt/xinjian/cn/CropActivity;->source:Landroid/net/Uri;

    invoke-direct {p0, p1}, Ltt/xinjian/cn/CropActivity;->copyAndFinish(Landroid/net/Uri;)V

    .line 48
    return-void

    .line 50
    :cond_1
    new-instance p1, Landroid/content/Intent;

    const-string p2, "com.android.camera.action.CROP"

    invoke-direct {p1, p2}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 51
    iget-object p2, p0, Ltt/xinjian/cn/CropActivity;->source:Landroid/net/Uri;

    const-string p3, "image/*"

    invoke-virtual {p1, p2, p3}, Landroid/content/Intent;->setDataAndType(Landroid/net/Uri;Ljava/lang/String;)Landroid/content/Intent;

    .line 52
    const-string p2, "crop"

    const-string p3, "true"

    invoke-virtual {p1, p2, p3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Ljava/lang/String;)Landroid/content/Intent;

    .line 53
    const-string p2, "aspectX"

    invoke-virtual {p1, p2, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 54
    const-string p2, "aspectY"

    invoke-virtual {p1, p2, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 55
    const-string p2, "outputX"

    const/16 p3, 0x400

    invoke-virtual {p1, p2, p3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 56
    const-string p2, "outputY"

    invoke-virtual {p1, p2, p3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;I)Landroid/content/Intent;

    .line 57
    const-string p2, "return-data"

    invoke-virtual {p1, p2, v2}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 58
    const-string p2, "noFaceDetection"

    invoke-virtual {p1, p2, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 59
    const-string p2, "scale"

    invoke-virtual {p1, p2, v4}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Z)Landroid/content/Intent;

    .line 60
    const-string p2, "output"

    iget-object p3, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    invoke-virtual {p1, p2, p3}, Landroid/content/Intent;->putExtra(Ljava/lang/String;Landroid/os/Parcelable;)Landroid/content/Intent;

    .line 61
    invoke-virtual {p1, v4}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    .line 62
    invoke-virtual {p1, v3}, Landroid/content/Intent;->addFlags(I)Landroid/content/Intent;

    .line 64
    :try_start_0
    invoke-virtual {p0, p1, v3}, Ltt/xinjian/cn/CropActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 67
    goto :goto_0

    .line 65
    :catch_0
    move-exception p1

    .line 66
    iget-object p1, p0, Ltt/xinjian/cn/CropActivity;->source:Landroid/net/Uri;

    invoke-direct {p0, p1}, Ltt/xinjian/cn/CropActivity;->copyAndFinish(Landroid/net/Uri;)V

    .line 68
    :goto_0
    return-void

    .line 41
    :cond_2
    :goto_1
    invoke-direct {p0, v2, v0}, Ltt/xinjian/cn/CropActivity;->finishWith(ZLjava/lang/String;)V

    .line 42
    return-void

    .line 70
    :cond_3
    if-ne p1, v3, :cond_6

    .line 71
    if-ne p2, v1, :cond_5

    iget-object p1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    if-eqz p1, :cond_4

    iget-object p1, p0, Ltt/xinjian/cn/CropActivity;->output:Landroid/net/Uri;

    goto :goto_2

    :cond_4
    iget-object p1, p0, Ltt/xinjian/cn/CropActivity;->source:Landroid/net/Uri;

    :goto_2
    invoke-direct {p0, p1}, Ltt/xinjian/cn/CropActivity;->copyAndFinish(Landroid/net/Uri;)V

    goto :goto_3

    .line 72
    :cond_5
    invoke-direct {p0, v2, v0}, Ltt/xinjian/cn/CropActivity;->finishWith(ZLjava/lang/String;)V

    .line 74
    :cond_6
    :goto_3
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 1

    .line 27
    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    .line 28
    new-instance p1, Landroid/content/Intent;

    const-string v0, "android.intent.action.GET_CONTENT"

    invoke-direct {p1, v0}, Landroid/content/Intent;-><init>(Ljava/lang/String;)V

    .line 29
    const-string v0, "image/*"

    invoke-virtual {p1, v0}, Landroid/content/Intent;->setType(Ljava/lang/String;)Landroid/content/Intent;

    .line 30
    const-string v0, "android.intent.category.OPENABLE"

    invoke-virtual {p1, v0}, Landroid/content/Intent;->addCategory(Ljava/lang/String;)Landroid/content/Intent;

    .line 32
    :try_start_0
    const-string v0, "\u9009\u62e9\u80cc\u666f\u56fe"

    invoke-static {p1, v0}, Landroid/content/Intent;->createChooser(Landroid/content/Intent;Ljava/lang/CharSequence;)Landroid/content/Intent;

    move-result-object p1

    const/4 v0, 0x1

    invoke-virtual {p0, p1, v0}, Ltt/xinjian/cn/CropActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0

    .line 35
    goto :goto_0

    .line 33
    :catch_0
    move-exception p1

    .line 34
    const/4 p1, 0x0

    const-string v0, "nopicker"

    invoke-direct {p0, p1, v0}, Ltt/xinjian/cn/CropActivity;->finishWith(ZLjava/lang/String;)V

    .line 36
    :goto_0
    return-void
.end method
