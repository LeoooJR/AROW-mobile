package expo.modules.arowmocklocation

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import android.view.View
import android.widget.RemoteViews

internal object ActiveSimulationNotification {
  fun build(
    context: Context,
    channelId: String,
    notificationId: Int,
    startedAt: Long,
  ): Notification {
    val compact = RemoteViews(context.packageName, R.layout.arow_notification_compact)
    if (context.resources.configuration.fontScale > 1f) {
      compact.setViewVisibility(R.id.arow_notification_summary, View.GONE)
    }
    val expanded = RemoteViews(context.packageName, R.layout.arow_notification_expanded)
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
    val contentIntent = launchIntent?.let {
      PendingIntent.getActivity(
        context,
        notificationId,
        it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, channelId)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(context)
    }
    return builder
      .setSmallIcon(R.drawable.arow_notification_icon)
      .setContentTitle(context.getString(R.string.arow_notification_title))
      .setContentText(context.getString(R.string.arow_notification_summary))
      .setCustomContentView(compact)
      .setCustomBigContentView(expanded)
      .setStyle(Notification.DecoratedCustomViewStyle())
      .setContentIntent(contentIntent)
      .setWhen(startedAt)
      .setShowWhen(true)
      .setOnlyAlertOnce(true)
      .setOngoing(true)
      .setAutoCancel(false)
      .build()
  }
}
