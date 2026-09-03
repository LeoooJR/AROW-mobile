import { useAssets } from "expo-asset";
import { useMemo, useState } from "react";
import { View } from "react-native";

import Map from "@/components/adapters/map/map";
import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  type MapLayerVisibility,
  type ToggleableMapLayer,
} from "@/components/adapters/map/map-layer-visibility";
import LocationBar from "@/components/composites/location-bar";
import MapFeatureDetailsCard from "@/components/composites/map-feature-details-card";
import MapToolbar from "@/components/composites/map-toolbar";
import type { MapFeature } from "@/features/map-features/map-feature";
import type { Milestone } from "@/features/milestones/milestone";
import { createMilestoneSearchState } from "@/features/milestones/milestone-search";
import { useMilestones } from "@/features/milestones/use-milestones";
import { useRealLocation } from "@/hooks/platform/use-real-location";
import railwayLinesAsset from "@/statics/lignes-par-type.geojson";
import railwaySearchCatalog from "@/statics/railway-search-catalog.json";

export default function Index() {
  const [railwayAssets] = useAssets(railwayLinesAsset);
  const { openSettings, requestAccess, retry, state } = useRealLocation();
  const milestoneState = useMilestones();
  const [recenterRequest, setRecenterRequest] = useState(0);
  const [milestoneFocusRequest, setMilestoneFocusRequest] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<
    MapFeature | undefined
  >();
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>(
    DEFAULT_MAP_LAYER_VISIBILITY,
  );
  const railwayData = railwayAssets?.[0]?.localUri ?? railwayAssets?.[0]?.uri;
  const milestoneSearch = useMemo(
    () => createMilestoneSearchState(milestoneState, railwaySearchCatalog),
    [milestoneState],
  );
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
  const onLayerVisibilityChange = (
    layer: ToggleableMapLayer,
    visible: boolean,
  ): void => {
    setLayerVisibility((current) => ({ ...current, [layer]: visible }));
    if (!visible) {
      setSelectedFeature((current) =>
        current?.kind === layer ? undefined : current,
      );
    }
  };
  const onMilestoneSelect = (milestone: Milestone): void => {
    setLayerVisibility((current) => ({ ...current, milestone: true }));
    setSelectedFeature(milestone);
    setMilestoneFocusRequest((request) => request + 1);
  };

  return (
    <View className="flex-1 bg-surface">
      <Map
        focusLocation={
          selectedFeature?.kind === "milestone"
            ? selectedFeature.coordinates
            : undefined
        }
        focusRequest={milestoneFocusRequest}
        layerVisibility={layerVisibility}
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
      {process.env.EXPO_OS !== "web" ? (
        <MapToolbar
          milestoneSearch={milestoneSearch}
          onMilestoneSelect={onMilestoneSelect}
          onVisibilityChange={onLayerVisibilityChange}
          visibility={layerVisibility}
        />
      ) : null}
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
