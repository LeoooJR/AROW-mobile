package expo.modules.arowmocklocation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CleanupFailureTest {
  @Test
  fun mockedRevocationRetainsOwnershipAndNamesTheMissingMockSelection() {
    assertEquals(NativeErrorSnapshot(NativeErrorCode.MOCK_PROVIDER_NOT_SELECTED, true),
      diagnoseCleanupFailure(true) { false })
  }

  @Test
  fun mockedRestoredOrUnknownSelectionKeepsGenericCleanupFailure() {
    for (selected in listOf(true, null)) {
      assertEquals(NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true),
        diagnoseCleanupFailure(true) { selected })
    }
  }

  @Test
  fun mockedSelectionExceptionDoesNotInventARevocation() {
    assertEquals(NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true),
      diagnoseCleanupFailure(true) { error("AppOps unavailable") })
  }

  @Test
  fun noRetainedClaimDoesNotRunTheMockedDiagnostic() {
    assertEquals(NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, false),
      diagnoseCleanupFailure(false) { error("Must not check selection") })
  }

  @Test
  fun mockedRetriesRecheckSelectionWithoutDiscardingFailedClaims() {
    val ownership = MockProviderOwnership(setOf("gps", "network")) {}
    var selected = false
    repeat(2) {
      assertFalse(ownership.releaseAll { error("Mock authority revoked") })
      assertEquals(NativeErrorCode.MOCK_PROVIDER_NOT_SELECTED,
        diagnoseCleanupFailure(ownership.providers.isNotEmpty()) { selected }.code)
    }
    selected = true
    assertFalse(ownership.releaseAll { error("Other cleanup failure") })
    assertEquals(NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true),
      diagnoseCleanupFailure(ownership.providers.isNotEmpty()) { selected })
    assertTrue(ownership.releaseAll {})
  }

  @Test
  fun recoveredClaimsUseTheSameMockedDiagnosticAndRemainRetryable() {
    var saved = setOf("gps", "network")
    val recovered = MockProviderOwnership(saved) { saved = it }
    assertFalse(recovered.releaseAll { error("Authority still absent after restart") })
    assertEquals(NativeErrorSnapshot(NativeErrorCode.MOCK_PROVIDER_NOT_SELECTED, true),
      diagnoseCleanupFailure(recovered.providers.isNotEmpty()) { false })
    assertEquals(setOf("gps", "network"), saved)
    assertTrue(recovered.releaseAll {})
    assertTrue(saved.isEmpty())
  }
}
