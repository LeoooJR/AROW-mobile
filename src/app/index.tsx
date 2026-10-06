import { useAssets } from "expo-asset";
import { View } from "react-native";

import Map from "@/components/adapters/map/map";
import LocationBar from "@/components/composites/location-bar";
import MapFeatureDetailsCard from "@/components/composites/map-feature-details-card";
import MapToolbar from "@/components/composites/map-toolbar";
import { useMapLocation } from "@/features/map-screen/use-map-location";
import { useMapSelection } from "@/features/map-screen/use-map-selection";
import { useRailwayReference } from "@/hooks/features/use-railway-reference";
import railwayLinesAsset from "@/statics/lignes-par-type.geojson";
import milestonesAsset from "@/statics/milestones.geojson";

export default function Index() {
  const [railwayAssets] = useAssets([railwayLinesAsset, milestonesAsset]);
  const { milestoneSearch } = useRailwayReference();
  const selection = useMapSelection();
  const location = useMapLocation(selection.selectedSimulationMilestone);
  const railwayData = railwayAssets?.[0]?.localUri ?? railwayAssets?.[0]?.uri;
  const milestoneData = railwayAssets?.[1]?.localUri ?? railwayAssets?.[1]?.uri;
  const showOverlays = process.env.EXPO_OS !== "web" && !selection.mapFocused;

  return (
    <View className="flex-1 bg-surface">
      <Map
        focusLocation={
          selection.selectedFeature?.kind === "milestone"
            ? selection.selectedFeature.coordinates
            : undefined
        }
        focusRequest={selection.milestoneFocusRequest}
        layerVisibility={selection.layerVisibility}
        location={location.currentLocation}
        milestoneData={milestoneData}
        onFeaturePress={selection.onFeaturePress}
        railwayData={railwayData}
        recenterRequest={location.recenterRequest}
        selectedFeature={selection.selectedFeature}
      />
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
        <MapFeatureDetailsCard
          feature={selection.selectedFeature}
          key={selection.selectedFeature.kind}
          onClose={selection.closeSelection}
          showSimulationAction={location.showSimulationAction}
        />
      ) : null}
      {showOverlays ? (
        <LocationBar
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
