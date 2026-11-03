package expo.modules.arowmocklocation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class MockProviderOwnershipTest {
  @Test
  fun processDeathRecoversClaimsWithoutSavingCoordinates() {
    var saved = emptySet<String>()
    val first = MockProviderOwnership(saved) { saved = it }
    first.claim("gps")
    first.claim("network")

    val restarted = MockProviderOwnership(saved) { saved = it }
    val removed = mutableListOf<String>()
    assertTrue(restarted.releaseAll { removed.add(it) })
    assertEquals(setOf("gps", "network"), removed.toSet())
    assertTrue(saved.isEmpty())
  }

  @Test
  fun failedWriteAheadDoesNotAuthorizeInstallation() {
    val ownership = MockProviderOwnership(emptySet()) { error("disk unavailable") }
    assertThrows(IllegalStateException::class.java) { ownership.claim("gps") }
    assertTrue(ownership.providers.isEmpty())
  }

  @Test
  fun recoveredClaimIsClearedWhenRemovalCallbackSucceeds() {
    var saved = emptySet<String>()
    MockProviderOwnership(saved) { saved = it }.claim("gps")
    val restarted = MockProviderOwnership(saved) { saved = it }
    assertTrue(restarted.releaseAll { /* Provider was never installed. */ })
    assertTrue(saved.isEmpty())
  }

  @Test
  fun partialCleanupRetainsOnlyFailedClaimsAcrossRestart() {
    var saved = setOf("gps", "network")
    val ownership = MockProviderOwnership(saved) { saved = it }
    assertFalse(ownership.releaseAll { if (it == "gps") error("authority unavailable") })
    assertEquals(setOf("gps"), saved)

    val restarted = MockProviderOwnership(saved) { saved = it }
    val retried = mutableListOf<String>()
    assertTrue(restarted.releaseAll { retried.add(it) })
    assertEquals(listOf("gps"), retried)
    assertTrue(saved.isEmpty())
  }

  @Test
  fun persistenceFailureAfterRemovalKeepsCleanupRetryable() {
    var writesAvailable = false
    var saved = setOf("gps")
    val ownership = MockProviderOwnership(saved) {
      check(writesAvailable)
      saved = it
    }
    var removals = 0
    assertFalse(ownership.releaseAll { removals++ })
    assertEquals(setOf("gps"), ownership.providers)
    writesAvailable = true
    assertTrue(ownership.releaseAll { removals++ })
    assertEquals(2, removals)
    assertTrue(saved.isEmpty())
  }
}
