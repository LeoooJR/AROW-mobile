import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import Map from "@/components/adapters/map/map";
import { Toast, ToastDescription, useToast } from "@/components/adapters/toast";
import RealLocationBar from "@/components/composites/real-location-bar";
import { useRealLocation } from "@/hooks/platform/use-real-location";

const MOCKED_LOCATION_TOAST_ID = "mocked-real-location-unavailable";
const MOCKED_LOCATION_TOAST_DURATION_MS = 1_800;
const LOCATION_BAR_TOAST_OFFSET = 80;

export default function Index() {
  const { openSettings, requestAccess, retry, state } = useRealLocation();
  const toast = useToast();
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recenterRequest, setRecenterRequest] = useState(0);
  const currentLocation =
    state.status === "connected" ||
    state.status === "mocked" ||
    state.status === "locating"
      ? state.position
      : undefined;
  const onLocationAction = (() => {
    switch (state.status) {
      case "permissionRequired":
        return requestAccess;
      case "denied":
        return state.canAskAgain ? requestAccess : openSettings;
      case "servicesDisabled":
      case "error":
        return retry;
      case "checking":
      case "requesting":
      case "locating":
      case "connected":
      case "mocked":
        return undefined;
    }
  })();
  const onCenter = (() => {
    switch (state.status) {
      case "connected":
        return () => {
          setRecenterRequest((request) => request + 1);
        };
      case "mocked":
        return () => {
          if (toastTimerRef.current !== null) {
            clearTimeout(toastTimerRef.current);
          }

          toast.show({
            containerStyle: { marginBottom: LOCATION_BAR_TOAST_OFFSET },
            duration: null,
            id: MOCKED_LOCATION_TOAST_ID,
            placement: "bottom",
            render: () => (
              <Toast
                action="muted"
                className="mx-4 gap-0 rounded-lg border-0 bg-text-primary px-[14px] py-[10px] shadow-none"
                variant="solid"
              >
                <ToastDescription
                  accessibilityLiveRegion="polite"
                  className="text-center text-[13px] font-semibold leading-[18px] text-canvas"
                >
                  La position réelle est indisponible lorsqu’un signal simulé
                  est actif.
                </ToastDescription>
              </Toast>
            ),
          });

          toastTimerRef.current = setTimeout(() => {
            toast.close(MOCKED_LOCATION_TOAST_ID);
            toastTimerRef.current = null;
          }, MOCKED_LOCATION_TOAST_DURATION_MS);
        };
      case "checking":
      case "permissionRequired":
      case "requesting":
      case "locating":
      case "servicesDisabled":
      case "denied":
      case "error":
        return undefined;
    }
  })();

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) {
        clearTimeout(toastTimerRef.current);
        toast.close(MOCKED_LOCATION_TOAST_ID);
        toastTimerRef.current = null;
      }
    },
    [toast],
  );

  return (
    <View className="flex-1 bg-surface">
      <Map location={currentLocation} recenterRequest={recenterRequest} />
      {process.env.EXPO_OS !== "web" ? (
        <RealLocationBar
          onAction={onLocationAction}
          onCenter={onCenter}
          state={state}
        />
      ) : null}
    </View>
  );
}
