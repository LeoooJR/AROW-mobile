package expo.modules.arowmocklocation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Test

class SimulationRefreshTest {
  private val running = NativeRunningSnapshot(MockCoordinates(45.74744, 4.85933))

  @Test
  fun healthyMockedReadinessInjectsBeforeScheduling() {
    val events = mutableListOf<String>()
    refreshSimulation(running,
      { events.add("check"); NativeReadiness.Ready },
      { events.add("inject") },
      { error("No failure expected") },
      { events.add("schedule") },
      { error("No interruption expected") },
    )
    assertEquals(listOf("check", "inject", "schedule"), events)
  }

  @Test
  fun mockedPrerequisiteFailuresRequestCleanupWithoutInjectionOrScheduling() {
    for (code in NativeReadinessErrorCode.entries) {
      val events = mutableListOf<String>()
      refreshSimulation(running,
        { NativeReadiness.Failed(code) },
        { error("Must not inject") },
        { assertEquals(code.executionCode, it); events.add("cleanup"); NativeErrorSnapshot(it, false) },
        { error("Must not schedule") },
        { assertEquals(code.executionCode, it.code); assertFalse(it.ownsProviders); events.add("warn") },
      )
      assertEquals(listOf("cleanup", "warn"), events)
    }
  }

  @Test
  fun mockedReadinessExceptionIsNotReportedAsInjectionFailure() {
    refreshSimulation(running,
      { error("check unavailable") },
      { error("Must not inject") },
      { assertEquals(NativeErrorCode.READINESS_CHECK_FAILED, it); NativeErrorSnapshot(it, false) },
      { error("Must not schedule") },
      { assertEquals(NativeErrorCode.READINESS_CHECK_FAILED, it.code) },
    )
  }

  @Test
  fun mockedInjectionExceptionCleansUpAndTerminatesRefreshes() {
    refreshSimulation(running,
      { NativeReadiness.Ready },
      { error("injection failed") },
      { assertEquals(NativeErrorCode.APPLY_FAILED, it); NativeErrorSnapshot(it, false) },
      { error("Must not schedule") },
      { assertEquals(NativeErrorCode.APPLY_FAILED, it.code) },
    )
  }

  @Test
  fun mockedCleanupFailureRetainsActionableOwnershipAndNeverSchedules() {
    val cleanup = NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true)
    refreshSimulation(running,
      { NativeReadiness.Failed(NativeReadinessErrorCode.LOCATION_SERVICES_DISABLED) },
      { error("Must not inject") },
      { cleanup },
      { error("Must not schedule") },
      { assertSame(cleanup, it) },
    )
  }

  @Test
  fun queuedTickAfterInterruptionOrStopDoesNothing() {
    for (state in listOf(NativeStoppedSnapshot, NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true))) {
      refreshSimulation(state,
        { error("Must not check") },
        { error("Must not inject") },
        { error("Must not clean up twice") },
        { error("Must not schedule") },
        { error("Must not warn twice") },
      )
    }
  }
}
