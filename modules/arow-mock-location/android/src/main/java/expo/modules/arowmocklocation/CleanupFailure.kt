package expo.modules.arowmocklocation

/** Identify a confirmed remedy without weakening the retained cleanup claim. */
internal fun diagnoseCleanupFailure(
  ownsProviders: Boolean,
  mockProviderSelected: () -> Boolean?,
): NativeErrorSnapshot {
  val selected = if (ownsProviders) {
    try {
      mockProviderSelected()
    } catch (exception: Exception) {
      null
    }
  } else null
  val code = if (selected == false) NativeErrorCode.MOCK_PROVIDER_NOT_SELECTED
    else NativeErrorCode.CLEANUP_FAILED
  return NativeErrorSnapshot(code, ownsProviders)
}
