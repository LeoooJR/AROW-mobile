package expo.modules.arowmocklocation

import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.withTimeout

class ArowMockLocationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ArowMockLocation")

    AsyncFunction("checkReadiness") {
      val context = requireContext()
      try {
        MockLocationEngine.readiness(context)
      } catch (exception: Exception) {
        mapOf("ready" to false, "code" to "READINESS_CHECK_FAILED")
      }
    }

    AsyncFunction("getSnapshot") {
      MockLocationEngine.snapshot()
    }

    AsyncFunction("start") Coroutine { latitude: Double, longitude: Double ->
      val context = requireContext()
      val readiness = MockLocationEngine.readiness(context)
      if (readiness["ready"] != true) {
        return@Coroutine mapOf(
          "status" to "error",
          "code" to (readiness["code"] ?: "READINESS_CHECK_FAILED"),
        )
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
        withTimeout(10_000) { completion.await() }
      } catch (exception: Exception) {
        MockLocationEngine.fail(context, "START_FAILED")
        context.stopService(intent)
        MockLocationEngine.snapshot()
      }
    }

    AsyncFunction("stop") {
      val context = requireContext()
      val snapshot = MockLocationEngine.stop(context)
      context.stopService(Intent(context, MockLocationService::class.java))
      snapshot
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("Android application context is unavailable")
}
