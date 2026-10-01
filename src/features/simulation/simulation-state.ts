import type { LocationDescriptor } from "@/types/location-descriptor";

export type SimulationState =
  | { readonly status: "idle" }
  | { readonly status: "checking" }
  | { readonly status: "starting" }
  | { readonly status: "canceling" }
  | {
      readonly status: "running";
      readonly position: LocationDescriptor;
    }
  | { readonly status: "stopping"; readonly position?: LocationDescriptor }
  | {
      readonly status: "error";
      readonly code: string;
      readonly mayBeActive: boolean;
      readonly origin: "start" | "cleanup" | "reconciliation";
      readonly position?: LocationDescriptor;
    };

type StateWithStatus<Status extends SimulationState["status"]> = Extract<
  SimulationState,
  { readonly status: Status }
>;

export function isSimulationStarted(
  state: SimulationState,
): state is
  | StateWithStatus<"running">
  | (StateWithStatus<"stopping"> & { readonly position: LocationDescriptor }) {
  return (
    state.status === "running" ||
    (state.status === "stopping" && state.position !== undefined)
  );
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

export function isSimulationCanceling(
  state: SimulationState,
): state is StateWithStatus<"canceling"> {
  return state.status === "canceling";
}

export function isSimulationError(
  state: SimulationState,
): state is StateWithStatus<"error"> {
  return state.status === "error";
}

export function isSimulationDismissibleError(
  state: SimulationState,
): state is StateWithStatus<"error"> & {
  readonly origin: "start";
  readonly mayBeActive: false;
} {
  return (
    isSimulationError(state) && state.origin === "start" && !state.mayBeActive
  );
}

export function isSimulationBusy(
  state: SimulationState,
): state is StateWithStatus<
  "checking" | "starting" | "canceling" | "stopping"
> {
  return (
    state.status === "checking" ||
    isSimulationStarting(state) ||
    isSimulationCanceling(state) ||
    state.status === "stopping"
  );
}

export function isSimulationStopRequired(state: SimulationState): state is
  | StateWithStatus<"canceling" | "running" | "stopping">
  | (StateWithStatus<"error"> & {
      readonly mayBeActive: true;
    })
  | (StateWithStatus<"error"> & { readonly origin: "cleanup" }) {
  return (
    isSimulationCanceling(state) ||
    isSimulationRunning(state) ||
    state.status === "stopping" ||
    (isSimulationError(state) &&
      (state.mayBeActive || state.origin === "cleanup"))
  );
}

export function simulationError(
  code: string,
  origin: StateWithStatus<"error">["origin"],
  mayBeActive: boolean,
  position?: LocationDescriptor,
): StateWithStatus<"error"> {
  return { code, mayBeActive, origin, position, status: "error" };
}
