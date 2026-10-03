import { useEffect, useRef, useState } from "react";
import { AppState, useWindowDimensions } from "react-native";

import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from "@/components/adapters/toast";
import { useSimulation } from "@/hooks/features/use-simulation";
import { isAppActive } from "@/utils/app-state";

const TOAST_ID = "simulation-notifications-disabled";

export default function SimulationNotificationWarning() {
  const { notificationWarningId, state } = useSimulation();
  const { show, close } = useToast();
  const { width } = useWindowDimensions();
  const [appState, setAppState] = useState(AppState.currentState);
  const consumedEvent = useRef(0);
  const dismissal = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // An uncertain reconciliation must not erase a warning already on screen.
    if (state.status === "error" && state.mayBeActive) return;
    if (state.status !== "running") {
      consumedEvent.current = notificationWarningId;
      clearTimeout(dismissal.current);
      close(TOAST_ID);
      return;
    }
    if (
      !isAppActive(appState) ||
      consumedEvent.current === notificationWarningId
    )
      return;
    consumedEvent.current = notificationWarningId;
    clearTimeout(dismissal.current);
    show({
      id: TOAST_ID,
      placement: "top",
      // Own the deadline so a previous start cannot dismiss a fresh warning.
      duration: null,
      containerStyle: { marginTop: 80, width: Math.max(0, width - 32) },
      render: () => (
        <Toast
          action="warning"
          accessibilityLiveRegion="polite"
          className="gap-1 rounded-md border border-warning bg-popover p-4"
          testID="simulation-notification-warning"
        >
          <ToastTitle>Notifications désactivées</ToastTitle>
          <ToastDescription>
            La simulation continue sans rappel dans les notifications. Vous
            pouvez l’arrêter dans AROW ou consulter les applications actives
            d’Android.
          </ToastDescription>
        </Toast>
      ),
    });
    dismissal.current = setTimeout(() => close(TOAST_ID), 8_000);
  }, [appState, close, notificationWarningId, show, state, width]);

  useEffect(
    () => () => {
      clearTimeout(dismissal.current);
      close(TOAST_ID);
    },
    [close],
  );

  return null;
}
