package expo.modules.arowmocklocation

import android.Manifest
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log

internal object SimulationInterruptionNotification {
  private const val NOTIFICATION_ID = 8052
  @Volatile var foreground = false

  fun clear(context: Context) {
    try {
      (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel(NOTIFICATION_ID)
    } catch (exception: Exception) {
      Log.w("AROWNotification", "Could not clear interruption notification", exception)
    }
  }

  fun postIfBackground(context: Context, failure: NativeErrorSnapshot) {
    if (foreground) return
    post(context, failure)
  }

  fun post(context: Context, failure: NativeErrorSnapshot) {
    try {
      val notifications = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (!notifications.areNotificationsEnabled()) return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        notifications.getNotificationChannel(MockLocationService.CHANNEL_ID)?.importance == NotificationManager.IMPORTANCE_NONE) return

      val title = if (failure.ownsProviders || failure.code == NativeErrorCode.CLEANUP_FAILED) {
        "Arrêt de simulation incomplet"
      } else "Simulation arrêtée"
      val detail = when (failure.code) {
        NativeErrorCode.MOCK_PROVIDER_NOT_SELECTED -> "Sélectionnez AROW comme application de position fictive, puis redémarrez la simulation."
        NativeErrorCode.LOCATION_SERVICES_DISABLED -> "Activez les services de localisation, puis redémarrez la simulation."
        NativeErrorCode.LOCATION_PERMISSION_REQUIRED -> "Autorisez l’accès à la position, puis redémarrez la simulation."
        NativeErrorCode.CLEANUP_FAILED -> "Rétablissez les conditions de localisation dans Android, puis réessayez l’arrêt dans AROW."
        else -> "Impossible de poursuivre la simulation. Vérifiez les conditions de localisation dans AROW."
      }
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      val contentIntent = launch?.let {
        PendingIntent.getActivity(context, NOTIFICATION_ID, it,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      }
      val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Notification.Builder(context, MockLocationService.CHANNEL_ID)
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(context)
      }
      notifications.notify(NOTIFICATION_ID, builder
        .setSmallIcon(R.drawable.arow_notification_icon)
        .setContentTitle(title)
        .setContentText(detail)
        .setStyle(Notification.BigTextStyle().bigText(detail))
        .setContentIntent(contentIntent)
        .setOngoing(false)
        .setAutoCancel(true)
        .setOnlyAlertOnce(true)
        .build())
    } catch (exception: Exception) {
      Log.w("AROWNotification", "Could not show interruption notification", exception)
    }
  }
}
