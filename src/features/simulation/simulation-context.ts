import { createContext } from "react";

import type { Milestone } from "@/features/milestones/domain/milestone";
import type { SimulationState } from "@/features/simulation/simulation-state";

export interface SimulationModel {
  readonly notificationWarningId: number;
  readonly dismissStartError: (state: SimulationState) => void;
  readonly start: (milestone: Milestone) => void;
  readonly state: SimulationState;
  readonly stop: () => void;
}

export const SimulationContext = createContext<SimulationModel | undefined>(
  undefined,
);
