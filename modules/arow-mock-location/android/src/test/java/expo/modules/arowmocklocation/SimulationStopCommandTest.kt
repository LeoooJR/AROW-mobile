package expo.modules.arowmocklocation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertSame
import org.junit.Assert.assertTrue
import org.junit.Test

class SimulationStopCommandTest {
  @Test
  fun mockedSuccessfulStopCancelsRefreshesBeforeCleanupAndTermination() {
    val events = mutableListOf<String>()
    val handled = handleSimulationStopCommand(MockLocationService.ACTION_STOP,
      { events.add("cancel") },
      { events.add("cleanup"); NativeStoppedSnapshot },
      { events.add("clear") },
      { error("No failure expected") },
      { events.add("terminate") },
    )
    assertTrue(handled)
    assertEquals(listOf("cancel", "cleanup", "clear", "terminate"), events)
  }

  @Test
  fun mockedCleanupFailureIsReportedWithOwnershipInsteadOfClaimingSuccess() {
    val failure = NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true)
    val events = mutableListOf<String>()
    assertTrue(handleSimulationStopCommand(MockLocationService.ACTION_STOP,
      { events.add("cancel") },
      { failure },
      { error("Must not clear failure feedback") },
      { assertSame(failure, it); events.add("warn") },
      { events.add("terminate") },
    ))
    assertEquals(listOf("cancel", "warn", "terminate"), events)
  }

  @Test
  fun repeatedMockedStopsAndStaleRequestsNeverFallThroughToActivation() {
    var cleanups = 0
    var terminations = 0
    repeat(3) {
      val handled = handleSimulationStopCommand(MockLocationService.ACTION_STOP,
        {}, { cleanups++; NativeStoppedSnapshot }, {},
        { error("No failure expected") }, { terminations++ },
      )
      if (!handled) error("Stop must not enter the activation branch")
    }
    assertEquals(3, cleanups)
    assertEquals(3, terminations)
  }

  @Test
  fun unrelatedCommandsDoNotRunMockedStopOperations() {
    for (action in listOf(null, MockLocationService.ACTION_START, "unknown")) {
      assertFalse(handleSimulationStopCommand(action,
        { error("Must not cancel") }, { error("Must not stop") },
        { error("Must not clear") }, { error("Must not warn") },
        { error("Must not terminate") },
      ))
    }
  }

  @Test
  fun mockedFeedbackFailureStillTerminatesTheService() {
    var terminated = false
    try {
      handleSimulationStopCommand(MockLocationService.ACTION_STOP,
        {}, { NativeErrorSnapshot(NativeErrorCode.CLEANUP_FAILED, true) }, {},
        { throw IllegalStateException("Notification unavailable") },
        { terminated = true },
      )
      error("Expected mocked failure")
    } catch (exception: IllegalStateException) {
      assertTrue(terminated)
    }
  }
}
