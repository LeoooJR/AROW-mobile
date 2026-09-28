import {
  isSimulationBusy,
  isSimulationError,
  isSimulationRunning,
  isSimulationStarted,
  isSimulationStarting,
  isSimulationStopped,
  isSimulationStopRequired,
  type SimulationState,
} from "./simulation-state";

const position = { latitude: 1, longitude: 2, accuracy: null, heading: null };
const cases: readonly [
  SimulationState,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
][] = [
  [{ status: "idle" }, false, true, false, false, false, false],
  [{ status: "checking" }, false, false, false, false, true, false],
  [{ status: "starting" }, false, false, true, false, true, false],
  [{ status: "running", position }, true, false, false, false, false, true],
  [{ status: "stopping", position }, true, false, false, false, true, true],
  [
    { status: "error", code: "FAILED", mayBeActive: false },
    false,
    false,
    false,
    true,
    false,
    false,
  ],
  [
    { status: "error", code: "CLEANUP_FAILED", mayBeActive: true },
    false,
    false,
    false,
    true,
    false,
    true,
  ],
];

test.each(cases)(
  "classifies simulation state %j",
  (state, started, stopped, starting, error, busy, stopRequired) => {
    expect([
      isSimulationStarted(state),
      isSimulationStopped(state),
      isSimulationStarting(state),
      isSimulationError(state),
      isSimulationBusy(state),
      isSimulationStopRequired(state),
    ]).toEqual([started, stopped, starting, error, busy, stopRequired]);
    if (isSimulationStarted(state)) expect(state.position).toEqual(position);
    expect(isSimulationRunning(state)).toBe(state.status === "running");
    if (isSimulationError(state)) expect(state.code).toBeDefined();
    if (isSimulationStopRequired(state) && state.status === "error") {
      const mayBeActive: true = state.mayBeActive;
      expect(mayBeActive).toBe(true);
    }
  },
);
