package expo.modules.arowmocklocation

/** One service tick. Only a healthy tick authorizes scheduling another fix. */
internal fun refreshSimulation(
  current: NativeSnapshot,
  readiness: () -> NativeReadiness,
  inject: () -> Unit,
  fail: (NativeErrorCode) -> NativeErrorSnapshot,
  scheduleNext: () -> Unit,
  interrupted: (NativeErrorSnapshot) -> Unit,
) {
  if (current !is NativeRunningSnapshot) return
  val ready = try {
    readiness()
  } catch (exception: Exception) {
    NativeReadiness.Failed(NativeReadinessErrorCode.READINESS_CHECK_FAILED)
  }
  val error = if (ready is NativeReadiness.Failed) {
    ready.code.executionCode
  } else {
    try {
      inject()
      null
    } catch (exception: Exception) {
      NativeErrorCode.APPLY_FAILED
    }
  }
  if (error == null) scheduleNext() else interrupted(fail(error))
}
