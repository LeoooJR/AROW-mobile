import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";

export interface RealLocationPosition {
  readonly accuracy: number | null;
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export type RealLocationState =
  | { readonly status: "checking" }
  | { readonly status: "permissionRequired" }
  | { readonly status: "requesting" }
  | {
      readonly position?: RealLocationPosition;
      readonly status: "locating";
    }
  | {
      readonly position: RealLocationPosition;
      readonly status: "connected";
    }
  | {
      readonly position: RealLocationPosition;
      readonly status: "mocked";
    }
  | { readonly status: "servicesDisabled" }
  | { readonly canAskAgain: boolean; readonly status: "denied" }
  | { readonly status: "error" };

export interface UseRealLocationResult {
  readonly openSettings: () => void;
  readonly requestAccess: () => void;
  readonly retry: () => void;
  readonly state: RealLocationState;
}

const LOCATION_OPTIONS = {
  accuracy: Location.Accuracy.High,
  distanceInterval: 5,
  timeInterval: 5_000,
} satisfies Location.LocationOptions;

function normalizeHeading(heading: number | null): number | null {
  if (heading === null || !Number.isFinite(heading) || heading < 0) {
    return null;
  }

  return heading % 360;
}

function toRealLocationPosition(
  location: Location.LocationObject,
): RealLocationPosition {
  return {
    accuracy: location.coords.accuracy,
    heading: normalizeHeading(location.coords.heading),
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

function getRetainedPosition(
  state: RealLocationState,
): RealLocationPosition | undefined {
  switch (state.status) {
    case "connected":
    case "mocked":
      return state.position;
    case "locating":
      return state.position;
    case "checking":
    case "permissionRequired":
    case "requesting":
    case "servicesDisabled":
    case "denied":
    case "error":
      return undefined;
  }
}

export function useRealLocation(): UseRealLocationResult {
  const [state, setState] = useState<RealLocationState>({
    status: "checking",
  });
  const mountedRef = useRef(false);
  const operationRef = useRef(0);
  const requestingRef = useRef(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const stopWatching = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  const invalidateOperation = useCallback(() => {
    ++operationRef.current;
  }, []);

  const isCurrentOperation = useCallback(
    (operation: number) =>
      mountedRef.current && operationRef.current === operation,
    [],
  );

  const startWatching = useCallback(
    async (operation: number) => {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!isCurrentOperation(operation)) {
        return;
      }

      if (!servicesEnabled) {
        setState({ status: "servicesDisabled" });
        return;
      }

      setState((previousState) => {
        const retainedPosition = getRetainedPosition(previousState);

        return retainedPosition === undefined
          ? { status: "locating" }
          : { position: retainedPosition, status: "locating" };
      });

      const subscription = await Location.watchPositionAsync(
        LOCATION_OPTIONS,
        (location) => {
          if (!isCurrentOperation(operation)) {
            return;
          }

          setState({
            position: toRealLocationPosition(location),
            status: location.mocked === true ? "mocked" : "connected",
          });
        },
        () => {
          if (isCurrentOperation(operation)) {
            setState({ status: "error" });
          }
        },
      );

      if (!isCurrentOperation(operation)) {
        subscription.remove();
        return;
      }

      stopWatching();
      subscriptionRef.current = subscription;
    },
    [isCurrentOperation, stopWatching],
  );

  const synchronize = useCallback(() => {
    if (process.env.EXPO_OS === "web") {
      return;
    }

    const operation = ++operationRef.current;
    stopWatching();

    void (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();

        if (!isCurrentOperation(operation)) {
          return;
        }

        if (!permission.granted) {
          setState(
            permission.status === Location.PermissionStatus.UNDETERMINED
              ? { status: "permissionRequired" }
              : {
                  canAskAgain: permission.canAskAgain,
                  status: "denied",
                },
          );
          return;
        }

        await startWatching(operation);
      } catch {
        if (isCurrentOperation(operation)) {
          setState({ status: "error" });
        }
      }
    })();
  }, [isCurrentOperation, startWatching, stopWatching]);

  const requestAccess = useCallback(() => {
    if (process.env.EXPO_OS === "web" || requestingRef.current) {
      return;
    }

    const operation = ++operationRef.current;
    requestingRef.current = true;
    stopWatching();
    setState({ status: "requesting" });

    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isCurrentOperation(operation)) {
          return;
        }

        if (!permission.granted) {
          setState({
            canAskAgain: permission.canAskAgain,
            status: "denied",
          });
          return;
        }

        await startWatching(operation);
      } catch {
        if (isCurrentOperation(operation)) {
          setState({ status: "error" });
        }
      } finally {
        requestingRef.current = false;
      }
    })();
  }, [isCurrentOperation, startWatching, stopWatching]);

  const openSettings = useCallback(() => {
    void Linking.openSettings().catch(() => {
      if (mountedRef.current) {
        setState({ status: "error" });
      }
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    synchronize();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          if (!requestingRef.current) {
            synchronize();
          }
          return;
        }

        if (requestingRef.current) {
          return;
        }

        invalidateOperation();
        stopWatching();
      },
    );

    return () => {
      mountedRef.current = false;
      invalidateOperation();
      appStateSubscription.remove();
      stopWatching();
    };
  }, [invalidateOperation, stopWatching, synchronize]);

  return {
    openSettings,
    requestAccess,
    retry: synchronize,
    state,
  };
}
