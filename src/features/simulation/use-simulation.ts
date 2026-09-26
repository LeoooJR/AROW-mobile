import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import type { Milestone } from "@/features/milestones/domain/milestone";
import type { MilestoneSearchModel } from "@/features/milestones/search/contracts";
import { getMockLocationExecutor } from "@/features/simulation/mock-location";
import { SimulationController } from "@/features/simulation/simulation-controller";
import {
  isSimulationRunning,
  type SimulationState,
} from "@/features/simulation/simulation-state";

export type { SimulationState } from "@/features/simulation/simulation-state";

export interface UseSimulationResult {
  readonly start: (milestone: Milestone) => void;
  readonly state: SimulationState;
  readonly stop: () => void;
}

export function useSimulation(
  findMilestone: MilestoneSearchModel["findMilestone"],
): UseSimulationResult {
  const [controller] = useState(
    () => new SimulationController(getMockLocationExecutor),
  );
  const [state, setState] = useState<SimulationState>(controller.state);
  const running = isSimulationRunning(state);

  const start = useCallback(
    (milestone: Milestone) => controller.start(milestone, findMilestone),
    [controller, findMilestone],
  );
  const stop = useCallback(() => controller.stop(), [controller]);

  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    void controller.reconcile();
    const listener = AppState.addEventListener("change", (next) => {
      if (next === "active") void controller.reconcile();
    });
    return () => {
      listener.remove();
      unsubscribe();
    };
  }, [controller]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void controller.reconcile(), 2_000);
    return () => clearInterval(timer);
  }, [controller, running]);

  return { start, state, stop };
}
