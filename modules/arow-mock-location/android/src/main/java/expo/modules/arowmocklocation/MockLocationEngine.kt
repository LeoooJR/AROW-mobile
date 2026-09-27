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
  private var pendingStart: CompletableDeferred<NativeStartResult>? = null
  private var state: NativeSnapshot = NativeStoppedSnapshot

  @Synchronized
  fun snapshot(): NativeSnapshot = state

  @Synchronized
  fun rejection(code: NativeReadinessErrorCode): NativeErrorSnapshot =
    NativeErrorSnapshot(code.executionCode, ownedProviders.isNotEmpty())

  fun readiness(context: Context): NativeReadiness {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_MOCK_LOCATION,
      android.os.Process.myUid(),
      context.packageName,
    )
    if (mode != AppOpsManager.MODE_ALLOWED) {
      return NativeReadiness.Failed(NativeReadinessErrorCode.MOCK_PROVIDER_NOT_SELECTED)
    }

    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val enabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      manager.isLocationEnabled
    } else {
      manager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
        manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
    if (!enabled) {
      return NativeReadiness.Failed(NativeReadinessErrorCode.LOCATION_SERVICES_DISABLED)
    }
    if (context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
      return NativeReadiness.Failed(NativeReadinessErrorCode.LOCATION_PERMISSION_REQUIRED)
    }
    return NativeReadiness.Ready
  }

  @Synchronized
  fun beginStart(latitude: Double, longitude: Double): CompletableDeferred<NativeStartResult> {
    val coordinates = MockCoordinates(latitude, longitude)
    if ((state !is NativeStoppedSnapshot && state !is NativeErrorSnapshot) || ownedProviders.isNotEmpty()) {
      throw IllegalStateException("Simulation is already active")
    }
    state = NativeStartingSnapshot(coordinates)
    return CompletableDeferred<NativeStartResult>().also { pendingStart = it }
  }

  @Synchronized
  fun activate(context: Context) {
    val starting = state
    if (starting !is NativeStartingSnapshot) return
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
      val running = NativeRunningSnapshot(starting.target)
      state = running
      pendingStart?.complete(running)
      pendingStart = null
    } catch (exception: Exception) {
      fail(context, NativeErrorCode.APPLY_FAILED)
    }
  }

  @Synchronized
  fun inject(context: Context) {
    val current = state
    val coordinates = when (current) {
      is NativeStartingSnapshot -> current.target
      is NativeRunningSnapshot -> current.position
      else -> return
    }
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    for (provider in ownedProviders) {
      val fix = Location(provider).apply {
        this.latitude = coordinates.latitude
        this.longitude = coordinates.longitude
        accuracy = 3f
        time = System.currentTimeMillis()
        elapsedRealtimeNanos = SystemClock.elapsedRealtimeNanos()
      }
      manager.setTestProviderLocation(provider, fix)
    }
  }

  @Synchronized
  fun fail(context: Context, code: NativeErrorCode): NativeErrorSnapshot {
    val cleanupError = removeProviders(context)
    val failure = NativeErrorSnapshot(cleanupError ?: code, ownedProviders.isNotEmpty())
    state = failure
    pendingStart?.complete(failure)
    pendingStart = null
    return failure
  }

  @Synchronized
  fun stop(context: Context): NativeStopResult {
    val cleanupError = removeProviders(context)
    val result: NativeStopResult = if (cleanupError == null) {
      NativeStoppedSnapshot
    } else {
      NativeErrorSnapshot(cleanupError, ownedProviders.isNotEmpty())
    }
    state = result
    pendingStart?.complete(result)
    pendingStart = null
    return result
  }

  private fun removeProviders(context: Context): NativeErrorCode? {
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
    return if (failed) NativeErrorCode.CLEANUP_FAILED else null
  }
}
