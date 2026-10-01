import {
  Map as MapLibreMap,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import { type ReactElement, useCallback, useState } from "react";
import {
  type NativeSyntheticEvent,
  StyleSheet,
  useColorScheme,
} from "react-native";

import MapCamera from "@/components/adapters/map/map-camera";
import { DEFAULT_MAP_LAYER_VISIBILITY } from "@/components/adapters/map/map-layer-visibility";
import type { MapProps } from "@/components/adapters/map/map-props";
import { DARK_MAP_STYLE } from "@/components/adapters/map/map-style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";
import MilestoneLayer from "@/components/adapters/map/milestone-layer";
import RailwayLinesSource from "@/components/adapters/map/railway-lines-source";
import UserLocationMarker from "@/components/adapters/map/user-location-marker";
import { resolveColorTheme } from "@/utils/color-theme";

export type {
  MapLocation,
  MapProps,
} from "@/components/adapters/map/map-props";

const MAP_STYLES = { dark: DARK_MAP_STYLE, light: LIGHT_MAP_STYLE };

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map({
  focusLocation,
  focusRequest,
  layerVisibility = DEFAULT_MAP_LAYER_VISIBILITY,
  location,
  milestoneData,
  onFeaturePress,
  railwayData,
  recenterRequest,
  selectedFeature,
}: MapProps): ReactElement {
  const colorScheme = useColorScheme();
  const [bearing, setBearing] = useState(0);
  const selectedSection =
    selectedFeature === undefined ? undefined : selectedFeature.key;
  const selectedMilestone =
    selectedFeature?.kind === "milestone" ? selectedFeature : undefined;

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      setBearing(event.nativeEvent.bearing);
    },
    [],
  );

  return (
    <MapLibreMap
      accessibilityLabel="Carte ferroviaire interactive AROW"
      mapStyle={MAP_STYLES[resolveColorTheme(colorScheme)]}
      onRegionDidChange={onRegionDidChange}
      style={styles.map}
      testID="arow-map"
    >
      <MapCamera
        focusLocation={focusLocation}
        focusRequest={focusRequest}
        location={location}
        recenterRequest={recenterRequest}
      />
      <MilestoneLayer
        data={milestoneData}
        onFeaturePress={onFeaturePress}
        selectedMilestone={selectedMilestone}
        visible={layerVisibility.milestone}
      />
      {railwayData === undefined ? null : (
        <RailwayLinesSource
          data={railwayData}
          onFeaturePress={onFeaturePress}
          selectedSection={selectedSection}
          visible={layerVisibility.railway}
        />
      )}
      {location === undefined ? null : (
        <UserLocationMarker bearing={bearing} location={location} />
      )}
    </MapLibreMap>
  );
}
