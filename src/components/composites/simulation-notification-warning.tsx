import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { useToast } from "@/components/adapters/toast";
import ToastMessage from "@/components/composites/toast-message";
import { useSimulation } from "@/features/use-simulation";
import { isAppActive } from "@/utils/app-state";

const TOAST_ID = "simulation-notifications-disabled";

export default function SimulationNotificationWarning() {
  const { notificationWarningId, state } = useSimulation();
  const { show, close } = useToast();
  const latestClose = useRef(close);
  const [appState, setAppState] = useState(AppState.currentState);
  const consumedEvent = useRef(0);

  useEffect(() => {
    latestClose.current = close;
  }, [close]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // An uncertain reconciliation must not erase a warning already on screen.
    if (state.status === "error" && state.mayBeActive) return;
    if (state.status !== "running") {
      consumedEvent.current = notificationWarningId;
      close(TOAST_ID);
      return;
    }
    if (
      !isAppActive(appState) ||
      consumedEvent.current === notificationWarningId
    )
      return;
    consumedEvent.current = notificationWarningId;
    show({
      id: TOAST_ID,
      placement: "top",
      duration: null,
      containerStyle: { marginTop: 80 },
      render: () => (
        <ToastMessage
          severity="warning"
          onDismiss={() => latestClose.current(TOAST_ID)}
          message="Notifications désactivées. La simulation continue sans rappel dans les notifications. Vous pouvez l’arrêter dans AROW ou consulter les applications actives d’Android."
          testID="simulation-notification-warning"
        />
      ),
    });
  }, [appState, close, notificationWarningId, show, state]);

  useEffect(
    () => () => {
      latestClose.current(TOAST_ID);
    },
    [],
  );

  return null;
}
