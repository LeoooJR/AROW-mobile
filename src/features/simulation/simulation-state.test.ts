import {
  isSimulationBusy,
  isSimulationCanceling,
  isSimulationDismissibleError,
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
  [{ status: "canceling" }, false, false, false, false, true, true],
  [{ status: "running", position }, true, false, false, false, false, true],
  [{ status: "stopping", position }, true, false, false, false, true, true],
  [{ status: "stopping" }, false, false, false, false, true, true],
  [
    { status: "error", code: "FAILED", mayBeActive: false, origin: "start" },
    false,
    false,
    false,
    true,
    false,
    false,
  ],
  [
    {
      status: "error",
      code: "CLEANUP_FAILED",
      mayBeActive: true,
      origin: "cleanup",
    },
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
    expect(isSimulationCanceling(state)).toBe(state.status === "canceling");
    if (isSimulationCanceling(state)) {
      const status: "canceling" = state.status;
      expect(status).toBe("canceling");
    }
    if (isSimulationError(state)) expect(state.code).toBeDefined();
    expect(isSimulationDismissibleError(state)).toBe(
      state.status === "error" &&
        state.origin === "start" &&
        !state.mayBeActive,
    );
    if (isSimulationStopRequired(state) && state.status === "error")
      expect(state.mayBeActive || state.origin === "cleanup").toBe(true);
  },
);

test.each([
  { origin: "start", mayBeActive: true },
  { origin: "cleanup", mayBeActive: false },
  { origin: "reconciliation", mayBeActive: false },
] as const)("keeps %j errors until explicitly handled", (error) => {
  expect(
    isSimulationDismissibleError({ status: "error", code: "FAILED", ...error }),
  ).toBe(false);
});
