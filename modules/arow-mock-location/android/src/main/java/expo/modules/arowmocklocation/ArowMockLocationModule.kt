package expo.modules.arowmocklocation

import android.Manifest
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.withTimeout

class ArowMockLocationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ArowMockLocation")

    AsyncFunction("canShowSimulationNotification") {
      val context = requireContext()
      val notifications = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val permissionGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
      val channelEnabled = Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
        notifications.getNotificationChannel(MockLocationService.CHANNEL_ID)?.importance != NotificationManager.IMPORTANCE_NONE
      permissionGranted && notifications.areNotificationsEnabled() && channelEnabled
    }

    AsyncFunction("checkReadiness") {
      val context = requireContext()
      try {
        MockLocationEngine.readiness(context).toBridge()
      } catch (exception: Exception) {
        NativeReadiness.Failed(NativeReadinessErrorCode.READINESS_CHECK_FAILED).toBridge()
      }
    }

    AsyncFunction("getSnapshot") {
      MockLocationEngine.snapshot().toBridge()
    }

    AsyncFunction("start") Coroutine { latitude: Double, longitude: Double ->
      val context = requireContext()
      val readiness = MockLocationEngine.readiness(context)
      if (readiness is NativeReadiness.Failed) {
        return@Coroutine MockLocationEngine.rejection(readiness.code).toBridge()
      }
      val completion = MockLocationEngine.beginStart(latitude, longitude)
      val intent = Intent(context, MockLocationService::class.java).apply {
        action = MockLocationService.ACTION_START
      }
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(intent)
        } else {
          context.startService(intent)
        }
        withTimeout(10_000) { completion.await() }.toBridge()
      } catch (exception: Exception) {
        val failure = MockLocationEngine.fail(context, NativeErrorCode.START_FAILED)
        context.stopService(intent)
        failure.toBridge()
      }
    }

    AsyncFunction("stop") {
      val context = requireContext()
      val snapshot = MockLocationEngine.stop(context)
      context.stopService(Intent(context, MockLocationService::class.java))
      snapshot.toBridge()
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("Android application context is unavailable")
}
