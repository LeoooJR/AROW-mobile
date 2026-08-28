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
import { DARK_MAP_STYLE } from "@/components/adapters/map/map-style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";
import MilestoneLayer from "@/components/adapters/map/milestone-layer";
import RailwayLinesSource from "@/components/adapters/map/railway-lines-source";
import UserLocationMarker from "@/components/adapters/map/user-location-marker";
import { railwaySectionKey } from "@/features/map-features/map-features";
import {
  type GeographicCoordinates,
  type MapFeature,
  type MilestoneFeature,
} from "@/types/map-feature";

export interface MapLocation extends GeographicCoordinates {
  readonly heading: number | null;
}

export interface MapProps {
  readonly location?: MapLocation;
  readonly milestones?: readonly MilestoneFeature[];
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly railwayData?: string;
  readonly recenterRequest?: number;
  readonly selectedFeature?: MapFeature;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map({
  location,
  milestones,
  onFeaturePress,
  railwayData,
  recenterRequest,
  selectedFeature,
}: MapProps): ReactElement {
  const colorScheme = useColorScheme();
  const [bearing, setBearing] = useState(0);
  const selectedSection =
    selectedFeature === undefined
      ? undefined
      : railwaySectionKey(selectedFeature);
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
      mapStyle={colorScheme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
      onRegionDidChange={onRegionDidChange}
      style={styles.map}
      testID="arow-map"
    >
      <MapCamera location={location} recenterRequest={recenterRequest} />
      {railwayData === undefined ? null : (
        <RailwayLinesSource
          data={railwayData}
          onFeaturePress={onFeaturePress}
          selectedSection={selectedSection}
        />
      )}
      {milestones === undefined ? null : (
        <MilestoneLayer
          milestones={milestones}
          onFeaturePress={onFeaturePress}
          selectedMilestone={selectedMilestone}
        />
      )}
      {location === undefined ? null : (
        <UserLocationMarker bearing={bearing} location={location} />
      )}
    </MapLibreMap>
  );
}
