package expo.modules.arowmocklocation

import android.Manifest
import android.app.AppOpsManager
import android.content.Context
import android.content.pm.PackageManager
import android.location.Criteria
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.SystemClock
import kotlinx.coroutines.CompletableDeferred

internal object MockLocationEngine {
  private val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
  private val ownedProviders = mutableSetOf<String>()
  private var pendingStart: CompletableDeferred<Map<String, Any?>>? = null
  private var status = "stopped"
  private var latitude: Double? = null
  private var longitude: Double? = null
  private var errorCode: String? = null

  @Synchronized
  fun snapshot(): Map<String, Any?> = buildMap {
    put("status", status)
    latitude?.let { put("latitude", it) }
    longitude?.let { put("longitude", it) }
    errorCode?.let { put("code", it) }
  }

  fun readiness(context: Context): Map<String, Any?> {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_MOCK_LOCATION,
      android.os.Process.myUid(),
      context.packageName,
    )
    if (mode != AppOpsManager.MODE_ALLOWED) {
      return mapOf("ready" to false, "code" to "MOCK_PROVIDER_NOT_SELECTED")
    }

    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val enabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      manager.isLocationEnabled
    } else {
      manager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
        manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
    if (!enabled) {
      return mapOf("ready" to false, "code" to "LOCATION_SERVICES_DISABLED")
    }
    if (context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      return mapOf("ready" to false, "code" to "LOCATION_PERMISSION_REQUIRED")
    }
    return mapOf("ready" to true)
  }

  @Synchronized
  fun beginStart(latitude: Double, longitude: Double): CompletableDeferred<Map<String, Any?>> {
    require(latitude.isFinite() && latitude in -90.0..90.0)
    require(longitude.isFinite() && longitude in -180.0..180.0)
    if ((status != "stopped" && status != "error") || ownedProviders.isNotEmpty()) {
      throw IllegalStateException("Simulation is already active")
    }
    status = "starting"
    this.latitude = latitude
    this.longitude = longitude
    errorCode = null
    return CompletableDeferred<Map<String, Any?>>().also { pendingStart = it }
  }

  @Synchronized
  fun activate(context: Context) {
    if (status != "starting") return
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    try {
      for (provider in providers) {
        @Suppress("DEPRECATION")
        manager.addTestProvider(
          provider,
          false,
          provider == LocationManager.GPS_PROVIDER,
          false,
          false,
          false,
          false,
          false,
          Criteria.POWER_LOW,
          if (provider == LocationManager.GPS_PROVIDER) Criteria.ACCURACY_FINE else Criteria.ACCURACY_COARSE,
        )
        ownedProviders.add(provider)
        @Suppress("DEPRECATION")
        manager.setTestProviderEnabled(provider, true)
      }
      inject(context)
      status = "running"
      pendingStart?.complete(snapshot())
      pendingStart = null
    } catch (exception: Exception) {
      fail(context, "APPLY_FAILED")
    }
  }

  @Synchronized
  fun inject(context: Context) {
    if (status != "starting" && status != "running") return
    val lat = latitude ?: return
    val lon = longitude ?: return
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    for (provider in ownedProviders) {
      val fix = Location(provider).apply {
        this.latitude = lat
        this.longitude = lon
        accuracy = 3f
        time = System.currentTimeMillis()
        elapsedRealtimeNanos = SystemClock.elapsedRealtimeNanos()
      }
      manager.setTestProviderLocation(provider, fix)
    }
  }

  @Synchronized
  fun fail(context: Context, code: String) {
    val cleanupError = removeProviders(context)
    status = "error"
    errorCode = cleanupError ?: code
    pendingStart?.complete(snapshot())
    pendingStart = null
  }

  @Synchronized
  fun stop(context: Context): Map<String, Any?> {
    val cleanupError = removeProviders(context)
    if (cleanupError == null) {
      status = "stopped"
      latitude = null
      longitude = null
      errorCode = null
    } else {
      status = "error"
      errorCode = cleanupError
    }
    pendingStart?.complete(snapshot())
    pendingStart = null
    return snapshot()
  }

  private fun removeProviders(context: Context): String? {
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    var failed = false
    for (provider in ownedProviders.toList()) {
      try {
        manager.removeTestProvider(provider)
        ownedProviders.remove(provider)
      } catch (exception: Exception) {
        failed = true
      }
    }
    return if (failed) "CLEANUP_FAILED" else null
  }
}
