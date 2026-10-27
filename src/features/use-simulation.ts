import { useContext } from "react";

import {
  SimulationContext,
  type SimulationModel,
} from "@/features/simulation/simulation-context";

export type { SimulationState } from "@/features/simulation/simulation-state";
export type UseSimulationResult = SimulationModel;

export function useSimulation(): UseSimulationResult {
  const simulation = useContext(SimulationContext);
  if (simulation === undefined) {
    throw new Error("useSimulation must be used within SimulationProvider");
  }
  return simulation;
}
