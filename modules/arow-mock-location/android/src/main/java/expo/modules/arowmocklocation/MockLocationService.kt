package expo.modules.arowmocklocation

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.content.res.Configuration
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log

class MockLocationService : Service() {
  companion object {
    const val ACTION_START = "expo.modules.arowmocklocation.START"
    internal const val CHANNEL_ID = "arow_simulation"
    private const val NOTIFICATION_ID = 8051
    private const val REFRESH_INTERVAL_MS = 1_000L
  }

  private val handler = Handler(Looper.getMainLooper())
  private var notificationStartedAt = 0L
  private val refresh = object : Runnable {
    override fun run() {
      if (MockLocationEngine.snapshot() !is NativeRunningSnapshot) return
      try {
        MockLocationEngine.inject(this@MockLocationService)
        handler.postDelayed(this, REFRESH_INTERVAL_MS)
      } catch (exception: Exception) {
        MockLocationEngine.fail(this@MockLocationService, NativeErrorCode.APPLY_FAILED)
        stopSelf()
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    if (MockLocationEngine.snapshot() !is NativeRunningSnapshot) return
    try {
      val notifications = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      notifications.notify(
        NOTIFICATION_ID,
        ActiveSimulationNotification.build(this, CHANNEL_ID, NOTIFICATION_ID, notificationStartedAt),
      )
    } catch (exception: Exception) {
      Log.w("AROWNotification", "Could not refresh simulation notification", exception)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action != ACTION_START) {
      stopSelf()
      return START_NOT_STICKY
    }

    try {
      promoteToForeground()
      MockLocationEngine.activate(this)
      if (MockLocationEngine.snapshot() is NativeRunningSnapshot) {
        handler.removeCallbacks(refresh)
        handler.postDelayed(refresh, REFRESH_INTERVAL_MS)
      } else {
        stopSelf()
      }
    } catch (exception: Exception) {
      MockLocationEngine.fail(this, NativeErrorCode.START_FAILED)
      stopSelf()
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(refresh)
    try {
      if (MockLocationEngine.snapshot() is NativeRunningSnapshot ||
        MockLocationEngine.snapshot() is NativeStartingSnapshot) {
        MockLocationEngine.stop(this)
      }
    } finally {
      try {
        stopForeground(STOP_FOREGROUND_REMOVE)
      } finally {
        super.onDestroy()
      }
    }
  }

  private fun promoteToForeground() {
    val notifications = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notifications.createNotificationChannel(
        NotificationChannel(
          CHANNEL_ID,
          "Simulation de position AROW",
          NotificationManager.IMPORTANCE_LOW,
        ),
      )
    }

    if (notificationStartedAt == 0L) {
      notificationStartedAt = System.currentTimeMillis()
    }
    val notification = ActiveSimulationNotification.build(
      this,
      CHANNEL_ID,
      NOTIFICATION_ID,
      notificationStartedAt,
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }
}
