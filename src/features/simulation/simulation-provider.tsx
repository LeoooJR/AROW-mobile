import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { isAppActive } from "@/utils/app-state";

import type { Milestone } from "@/features/milestones/domain/milestone";
import {
  SimulationContext,
  type SimulationModel,
} from "@/features/simulation/simulation-context";
import { SimulationController } from "@/features/simulation/simulation-controller";
import { getMockLocationExecutor } from "@/features/simulation/mock-location";
import { prepareSimulationNotifications } from "@/features/simulation/simulation-notifications";
import {
  isSimulationDismissibleError,
  isSimulationRunning,
  type SimulationState,
} from "@/features/simulation/simulation-state";

export interface SimulationProviderProps {
  readonly children: ReactNode;
}

export default function SimulationProvider({
  children,
}: SimulationProviderProps): ReactElement {
  const [notificationWarningId, setNotificationWarningId] = useState(0);
  const notificationAttempt = useRef(0);
  const mounted = useRef(false);
  const invalidateNotificationAttempt = useCallback(
    () => ++notificationAttempt.current,
    [],
  );
  const [controller] = useState(
    () => new SimulationController(getMockLocationExecutor),
  );
  const [state, setState] = useState<SimulationState>(controller.state);
  const running = isSimulationRunning(state);
  const start = useCallback(
    (milestone: Milestone): void => {
      const completion = controller.start(milestone);
      if (completion === undefined) return;
      const attempt = invalidateNotificationAttempt();
      const isCurrent = () =>
        mounted.current &&
        attempt === notificationAttempt.current &&
        isSimulationRunning(controller.state);
      void completion.then(async (started) => {
        if (!started || !isCurrent()) return;
        let notificationVisible = false;
        try {
          ({ notificationVisible } =
            await prepareSimulationNotifications(isCurrent));
        } catch {
          // Notification availability cannot change the simulation result.
        }
        if (isCurrent() && !notificationVisible) {
          setNotificationWarningId((id) => id + 1);
        }
      });
    },
    [controller, invalidateNotificationAttempt],
  );
  const stop = useCallback(() => {
    invalidateNotificationAttempt();
    controller.stop();
  }, [controller, invalidateNotificationAttempt]);
  const dismissStartError = useCallback(
    (expectedState: SimulationState) =>
      controller.dismissStartError(expectedState),
    [controller],
  );

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = controller.subscribe(setState);
    void controller.reconcile();
    const listener = AppState.addEventListener("change", (next) => {
      if (isAppActive(next)) void controller.reconcile();
    });
    return () => {
      mounted.current = false;
      invalidateNotificationAttempt();
      listener.remove();
      unsubscribe();
    };
  }, [controller, invalidateNotificationAttempt]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void controller.reconcile(), 2_000);
    return () => clearInterval(timer);
  }, [controller, running]);

  useEffect(() => {
    if (!isSimulationDismissibleError(state)) return;
    const timer = setTimeout(() => controller.dismissStartError(state), 5_000);
    return () => clearTimeout(timer);
  }, [controller, state]);

  const value = useMemo<SimulationModel>(
    () => ({ dismissStartError, notificationWarningId, start, state, stop }),
    [dismissStartError, notificationWarningId, start, state, stop],
  );

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
