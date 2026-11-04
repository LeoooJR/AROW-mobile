package expo.modules.arowmocklocation

/** Handles notification Stop without entering the service's activation path. */
internal fun handleSimulationStopCommand(
  action: String?,
  cancelRefreshes: () -> Unit,
  stop: () -> NativeStopResult,
  clearInterruption: () -> Unit,
  reportFailure: (NativeErrorSnapshot) -> Unit,
  terminateService: () -> Unit,
): Boolean {
  if (action != MockLocationService.ACTION_STOP) return false
  try {
    cancelRefreshes()
    when (val result = stop()) {
      is NativeStoppedSnapshot -> clearInterruption()
      is NativeErrorSnapshot -> reportFailure(result)
    }
  } finally {
    terminateService()
  }
  return true
}
