import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";

import type { Milestone } from "@/features/milestones/domain/milestone";
import {
  SimulationContext,
  type SimulationModel,
} from "@/features/simulation/simulation-context";
import { SimulationController } from "@/features/simulation/simulation-controller";
import { getMockLocationExecutor } from "@/features/simulation/mock-location";
import {
  isSimulationRunning,
  type SimulationState,
} from "@/features/simulation/simulation-state";

export interface SimulationProviderProps {
  readonly children: ReactNode;
}

export default function SimulationProvider({
  children,
}: SimulationProviderProps): ReactElement {
  const [controller] = useState(
    () => new SimulationController(getMockLocationExecutor),
  );
  const [state, setState] = useState<SimulationState>(controller.state);
  const running = isSimulationRunning(state);
  const start = useCallback(
    (milestone: Milestone) => controller.start(milestone),
    [controller],
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

  const value = useMemo<SimulationModel>(
    () => ({ start, state, stop }),
    [start, state, stop],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
