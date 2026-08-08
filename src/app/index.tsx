import { View } from "react-native";

import Map from "@/components/adapters/map/map";
import RealLocationBar from "@/components/composites/real-location-bar";
import { useRealLocation } from "@/hooks/platform/use-real-location";

export default function Index() {
  const { openSettings, requestAccess, retry, state } = useRealLocation();
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

  return (
    <View className="flex-1 bg-surface">
      <Map />
      {process.env.EXPO_OS !== "web" ? (
        <RealLocationBar onAction={onLocationAction} state={state} />
      ) : null}
    </View>
  );
}
