import { useCallback, useEffect, useRef, useState } from "react";

import type { Milestone } from "@/features/milestones/domain/milestone";
import {
  isSimulationStopRequired,
  isSimulationStarted,
  isSimulationStopped,
  isSimulationRunning,
  isSimulationError,
  type SimulationState,
} from "@/features/simulation/simulation-state";
import { useSimulation } from "@/features/simulation/use-simulation";
import {
  useRealLocation,
  type UseRealLocationResult,
} from "@/hooks/platform/use-real-location";
import type { LocationState } from "@/hooks/platform/real-location-state";
import type { LocationDescriptor } from "@/types/location-descriptor";

type LocationAction = Pick<
  UseRealLocationResult,
  "openSettings" | "requestAccess" | "retry"
>;

function locationAction(
  state: LocationState,
  simulation: SimulationState,
  actions: LocationAction,
): (() => void) | undefined {
  if (
    isSimulationError(simulation) &&
    simulation.code === "LOCATION_PERMISSION_REQUIRED"
  )
    return actions.requestAccess;
  if (!isSimulationStopped(simulation)) return undefined;
  switch (state.status) {
    case "permissionRequired":
      return actions.requestAccess;
    case "denied":
      return state.canAskAgain ? actions.requestAccess : actions.openSettings;
    case "servicesDisabled":
    case "error":
      return actions.retry;
    default:
      return undefined;
  }
}

function displayedPosition(
  state: LocationState,
  simulation: SimulationState,
): LocationDescriptor | undefined {
  if (isSimulationStarted(simulation)) {
    return simulation.position;
  }
  if (
    state.status === "connected" ||
    state.status === "mocked" ||
    state.status === "locating"
  )
    return state.position;
  return undefined;
}

export interface MapLocationModel {
  readonly currentLocation?: LocationDescriptor;
  readonly onCenter?: () => void;
  readonly onLocationAction?: () => void;
  readonly onSimulationPress: () => void;
  readonly recenterRequest: number;
  readonly showSimulationAction: boolean;
  readonly simulation: SimulationState;
  readonly state: LocationState;
}

export function useMapLocation(
  selectedMilestone?: Milestone,
): MapLocationModel {
  const { openSettings, requestAccess, retry, state } = useRealLocation();
  const { start, state: simulation, stop } = useSimulation();
  const [recenterRequest, setRecenterRequest] = useState(0);
  const simulationWasRunning = useRef(false);
  const stopRequired = isSimulationStopRequired(simulation);
  const hasSimulatedPosition = isSimulationStarted(simulation);
  const running = isSimulationRunning(simulation);
  const stopped = isSimulationStopped(simulation);
  const recenter = useCallback(
    () => setRecenterRequest((request) => request + 1),
    [],
  );
  const onSimulationPress = useCallback(() => {
    if (stopRequired) stop();
    else if (selectedMilestone !== undefined) start(selectedMilestone);
  }, [stopRequired, selectedMilestone, start, stop]);

  useEffect(() => {
    if (running) {
      simulationWasRunning.current = true;
    } else if (stopped && simulationWasRunning.current) {
      simulationWasRunning.current = false;
      retry();
    }
  }, [retry, running, stopped]);

  return {
    currentLocation: displayedPosition(state, simulation),
    onCenter:
      hasSimulatedPosition ||
      state.status === "connected" ||
      state.status === "mocked"
        ? recenter
        : undefined,
    onLocationAction: locationAction(state, simulation, {
      openSettings,
      requestAccess,
      retry,
    }),
    onSimulationPress,
    recenterRequest,
    showSimulationAction: selectedMilestone !== undefined || stopRequired,
    simulation,
    state,
  };
}
