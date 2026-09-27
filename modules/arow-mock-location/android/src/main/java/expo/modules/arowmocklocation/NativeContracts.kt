package expo.modules.arowmocklocation

internal enum class NativeReadinessErrorCode(val executionCode: NativeErrorCode) {
  MOCK_PROVIDER_NOT_SELECTED(NativeErrorCode.MOCK_PROVIDER_NOT_SELECTED),
  LOCATION_SERVICES_DISABLED(NativeErrorCode.LOCATION_SERVICES_DISABLED),
  LOCATION_PERMISSION_REQUIRED(NativeErrorCode.LOCATION_PERMISSION_REQUIRED),
  READINESS_CHECK_FAILED(NativeErrorCode.READINESS_CHECK_FAILED),
}

internal enum class NativeErrorCode {
  MOCK_PROVIDER_NOT_SELECTED,
  LOCATION_SERVICES_DISABLED,
  LOCATION_PERMISSION_REQUIRED,
  READINESS_CHECK_FAILED,
  START_FAILED,
  APPLY_FAILED,
  CLEANUP_FAILED,
}

internal sealed interface NativeReadiness {
  data object Ready : NativeReadiness
  data class Failed(val code: NativeReadinessErrorCode) : NativeReadiness
}

internal data class MockCoordinates(val latitude: Double, val longitude: Double) {
  init {
    require(latitude.isFinite() && latitude in -90.0..90.0)
    require(longitude.isFinite() && longitude in -180.0..180.0)
  }
}

internal sealed interface NativeSnapshot
internal sealed interface NativeStartResult : NativeSnapshot
internal sealed interface NativeStopResult : NativeStartResult
internal data object NativeStoppedSnapshot : NativeStopResult
internal data class NativeStartingSnapshot(val target: MockCoordinates) : NativeSnapshot
internal data class NativeRunningSnapshot(val position: MockCoordinates) : NativeStartResult
internal data class NativeErrorSnapshot(
  val code: NativeErrorCode,
  val ownsProviders: Boolean,
) : NativeStopResult

internal fun NativeReadiness.toBridge(): Map<String, Any> = when (this) {
  NativeReadiness.Ready -> mapOf("ready" to true)
  is NativeReadiness.Failed -> mapOf("ready" to false, "code" to code.name)
}

internal fun NativeSnapshot.toBridge(): Map<String, Any> = when (this) {
  NativeStoppedSnapshot -> mapOf("status" to "stopped")
  is NativeStartingSnapshot -> mapOf(
    "status" to "starting", "latitude" to target.latitude, "longitude" to target.longitude,
  )
  is NativeRunningSnapshot -> mapOf(
    "status" to "running", "latitude" to position.latitude, "longitude" to position.longitude,
  )
  is NativeErrorSnapshot -> mapOf(
    "status" to "error", "code" to code.name, "ownsProviders" to ownsProviders,
  )
}
