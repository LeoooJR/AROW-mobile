import type { LocationDescriptor } from "@/types/location-descriptor";

export type SimulationState =
  | { readonly status: "idle" }
  | { readonly status: "checking" }
  | { readonly status: "resolving" }
  | { readonly status: "starting" }
  | {
      readonly status: "running";
      readonly position: LocationDescriptor;
    }
  | { readonly status: "stopping"; readonly position: LocationDescriptor }
  | {
      readonly status: "error";
      readonly code: string;
      readonly mayBeActive: boolean;
      readonly position?: LocationDescriptor;
    };

type StateWithStatus<Status extends SimulationState["status"]> = Extract<
  SimulationState,
  { readonly status: Status }
>;

export function isSimulationStarted(
  state: SimulationState,
): state is StateWithStatus<"running" | "stopping"> {
  return state.status === "running" || state.status === "stopping";
}

export function isSimulationRunning(
  state: SimulationState,
): state is StateWithStatus<"running"> {
  return state.status === "running";
}

export function isSimulationStopped(
  state: SimulationState,
): state is StateWithStatus<"idle"> {
  return state.status === "idle";
}

export function isSimulationStarting(
  state: SimulationState,
): state is StateWithStatus<"starting"> {
  return state.status === "starting";
}

export function isSimulationError(
  state: SimulationState,
): state is StateWithStatus<"error"> {
  return state.status === "error";
}

export function isSimulationBusy(
  state: SimulationState,
): state is StateWithStatus<
  "checking" | "resolving" | "starting" | "stopping"
> {
  return (
    state.status === "checking" ||
    state.status === "resolving" ||
    state.status === "starting" ||
    state.status === "stopping"
  );
}

export function isSimulationStopRequired(
  state: SimulationState,
): state is
  | StateWithStatus<"running" | "stopping">
  | (StateWithStatus<"error"> & { readonly mayBeActive: true }) {
  return (
    isSimulationStarted(state) ||
    (isSimulationError(state) && state.mayBeActive)
  );
}

export function simulationError(
  code: string,
  mayBeActive = false,
  position?: LocationDescriptor,
): SimulationState {
  return { code, mayBeActive, position, status: "error" };
}
