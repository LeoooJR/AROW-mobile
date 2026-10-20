import { useAssets } from "expo-asset";
import { use, useCallback, useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import type { Milestone } from "@shared/railway-domain/milestone";

import Map from "@/components/adapters/map/map";
import LocationBar from "@/components/composites/location-bar";
import RailwayDetailsCard from "@/components/composites/map-feature-details-card/railway-details-card";
import MilestoneDetailsCard from "@/components/composites/map-feature-details-card/milestone-details-card";
import ToastMessage from "@/components/composites/toast-message";
import { useToast } from "@/components/adapters/toast";
import { useRailwayMilestoneBounds } from "@/features/map-screen/use-railway-milestone-bounds";
import { useMilestoneNeighbours } from "@/features/map-screen/use-milestone-neighbours";
import MapToolbar from "@/components/composites/map-toolbar";
import { AppStartupContext } from "@/contexts/app-startup-context";
import { useMapStartup } from "@/hooks/features/use-map-startup";
import { useMapLocation } from "@/features/map-screen/use-map-location";
import { useMapSelection } from "@/features/map-screen/use-map-selection";
import { useRailwayReference } from "@/hooks/features/use-railway-reference";
import railwayLinesAsset from "@/statics/lignes-par-type.geojson";
import milestonesAsset from "@/statics/milestones.geojson";

export default function Index() {
  const [locationBarHeight, setLocationBarHeight] = useState<number>();
  const onLocationBarLayout = useCallback((event: LayoutChangeEvent) => {
    setLocationBarHeight(event.nativeEvent.layout.height);
  }, []);
  const detailsBottomOffset =
    locationBarHeight === undefined ? undefined : locationBarHeight + 16;
  const [railwayAssets, assetError] = useAssets([
    railwayLinesAsset,
    milestonesAsset,
  ]);
  const startup = use(AppStartupContext);
  const onMapReady = useMapStartup(startup);
  const onFailure = startup?.onFailure;
  useEffect(() => {
    if (assetError !== undefined) onFailure?.();
  }, [assetError, onFailure]);
  const {
    milestoneSearch,
    findRailwayMilestoneBounds,
    findMilestoneNeighbours,
  } = useRailwayReference();
  const selection = useMapSelection();
  const { show, close } = useToast();
  const reportBoundaryFailure = useCallback(() => {
    show({
      id: "railway-boundary-error",
      placement: "top",
      containerStyle: { marginTop: 80 },
      render: () => (
        <ToastMessage
          severity="error"
          message="Impossible de charger les repères de cette section."
          onDismiss={() => close("railway-boundary-error")}
        />
      ),
    });
  }, [show, close]);
  const reportNeighbourFailure = useCallback(() => {
    show({
      id: "milestone-neighbour-error",
      placement: "top",
      containerStyle: { marginTop: 80 },
      render: () => (
        <ToastMessage
          severity="error"
          message="Impossible de charger les repères voisins de ce point."
          onDismiss={() => close("milestone-neighbour-error")}
        />
      ),
    });
  }, [show, close]);
  const milestoneNavigation = useMilestoneNeighbours(
    !selection.mapFocused && selection.selectedFeature?.kind === "milestone"
      ? selection.selectedFeature
      : undefined,
    findMilestoneNeighbours,
    selection.onMilestoneNavigate,
    reportNeighbourFailure,
  );
  const railwayBoundaries = useRailwayMilestoneBounds(
    selection.selectedFeature?.kind === "railway-section"
      ? selection.selectedFeature
      : undefined,
    findRailwayMilestoneBounds,
    selection.focusOnLocation,
    reportBoundaryFailure,
  );
  const location = useMapLocation(selection.selectedSimulationMilestone);
  const { canSelectSimulationTarget } = location;
  const { onMilestoneSelect } = selection;
  const onUsePoint = useCallback(
    (milestone: Milestone) => {
      if (canSelectSimulationTarget) onMilestoneSelect(milestone);
    },
    [canSelectSimulationTarget, onMilestoneSelect],
  );
  const railwayData = railwayAssets?.[0]?.localUri ?? railwayAssets?.[0]?.uri;
  const milestoneData = railwayAssets?.[1]?.localUri ?? railwayAssets?.[1]?.uri;
  const showOverlays = process.env.EXPO_OS !== "web" && !selection.mapFocused;

  return (
    <View className="flex-1 bg-surface">
      {process.env.EXPO_OS === "web" ||
      (railwayData !== undefined && milestoneData !== undefined) ? (
        <Map
          focusLocation={selection.focusLocation}
          focusRequest={selection.focusRequest}
          layerVisibility={selection.layerVisibility}
          location={location.currentLocation}
          milestoneData={milestoneData}
          onFeaturePress={selection.onFeaturePress}
          onReady={onMapReady}
          onLoadError={startup?.status === "loading" ? onFailure : undefined}
          railwayData={railwayData}
          recenterRequest={location.recenterRequest}
          selectedFeature={selection.selectedFeature}
        />
      ) : null}
      {process.env.EXPO_OS !== "web" ? (
        <MapToolbar
          mapFocused={selection.mapFocused}
          milestoneSearch={milestoneSearch}
          onMapFocusChange={selection.onMapFocusChange}
          onMilestoneSelect={selection.onMilestoneSelect}
          onVisibilityChange={selection.onVisibilityChange}
          visibility={selection.layerVisibility}
        />
      ) : null}
      {showOverlays && selection.selectedFeature !== undefined ? (
        selection.selectedFeature.kind === "railway-section" ? (
          <RailwayDetailsCard
            bottomOffset={detailsBottomOffset}
            feature={selection.selectedFeature}
            onClose={selection.closeSelection}
            showSimulationAction={location.showSimulationAction}
            {...railwayBoundaries}
          />
        ) : (
          <MilestoneDetailsCard
            onUsePoint={onUsePoint}
            usePointDisabled={!canSelectSimulationTarget}
            {...milestoneNavigation}
            bottomOffset={detailsBottomOffset}
            feature={selection.selectedFeature}
            onClose={selection.closeSelection}
            showSimulationAction={location.showSimulationAction}
          />
        )
      ) : null}
      {showOverlays ? (
        <LocationBar
          onLayout={onLocationBarLayout}
          onAction={location.onLocationAction}
          onCenter={location.onCenter}
          onSimulationPress={location.onSimulationPress}
          showSimulationAction={location.showSimulationAction}
          simulation={location.simulation}
          state={location.state}
        />
      ) : null}
    </View>
  );
}
