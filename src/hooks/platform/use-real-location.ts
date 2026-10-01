import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { RealLocationController } from "./real-location-controller";
import { realLocationSource } from "./real-location-source";
import type { LocationState } from "./real-location-state";

export type {
  LocationState,
  RealLocationState,
  MockedLocationState,
} from "./real-location-state";

export interface UseRealLocationResult {
  readonly openSettings: () => void;
  readonly requestAccess: () => void;
  readonly retry: () => void;
  readonly state: LocationState;
}

export function useRealLocation(): UseRealLocationResult {
  const [controller] = useState(
    () =>
      new RealLocationController(
        realLocationSource,
        process.env.EXPO_OS !== "web",
        AppState.currentState,
      ),
  );
  const [state, setState] = useState<LocationState>(controller.state);
  useEffect(() => {
    const unsubscribe = controller.subscribe(setState);
    const subscription = AppState.addEventListener("change", (next) =>
      controller.onAppStateChange(next),
    );
    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, [controller]);
  return {
    openSettings: controller.openSettings,
    requestAccess: controller.requestAccess,
    retry: controller.retry,
    state,
  };
}
