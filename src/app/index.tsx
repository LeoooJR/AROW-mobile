import { useAssets } from "expo-asset";
import { useState } from "react";
import { View } from "react-native";

import Map from "@/components/adapters/map/map";
import LocationBar from "@/components/composites/location-bar";
import MapFeatureDetailsCard from "@/components/composites/map-feature-details-card";
import MapToolbar from "@/components/composites/map-toolbar";
import type { MapFeature } from "@/features/map-features/map-feature";
import { useMilestones } from "@/features/milestones/use-milestones";
import { useRealLocation } from "@/hooks/platform/use-real-location";
import railwayLinesAsset from "@/statics/lignes-par-type.geojson";

export default function Index() {
  const [railwayAssets] = useAssets(railwayLinesAsset);
  const { openSettings, requestAccess, retry, state } = useRealLocation();
  const milestoneState = useMilestones();
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<
    MapFeature | undefined
  >();
  const railwayData = railwayAssets?.[0]?.localUri ?? railwayAssets?.[0]?.uri;
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
      case "mocked":
        return () => {
          setRecenterRequest((request) => request + 1);
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

  return (
    <View className="flex-1 bg-surface">
      <Map
        location={currentLocation}
        milestones={
          milestoneState.status === "ready"
            ? milestoneState.milestones
            : undefined
        }
        onFeaturePress={setSelectedFeature}
        railwayData={railwayData}
        recenterRequest={recenterRequest}
        selectedFeature={selectedFeature}
      />
      {process.env.EXPO_OS !== "web" ? <MapToolbar /> : null}
      {process.env.EXPO_OS !== "web" && selectedFeature !== undefined ? (
        <MapFeatureDetailsCard
          feature={selectedFeature}
          key={selectedFeature.kind}
          onClose={() => {
            setSelectedFeature(undefined);
          }}
        />
      ) : null}
      {process.env.EXPO_OS !== "web" ? (
        <LocationBar
          onAction={onLocationAction}
          onCenter={onCenter}
          state={state}
        />
      ) : null}
    </View>
  );
}
