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
import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  type MapLayerVisibility,
} from "@/components/adapters/map/map-layer-visibility";
import { DARK_MAP_STYLE } from "@/components/adapters/map/map-style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";
import MilestoneLayer from "@/components/adapters/map/milestone-layer";
import RailwayLinesSource from "@/components/adapters/map/railway-lines-source";
import UserLocationMarker from "@/components/adapters/map/user-location-marker";
import type { MapFeature } from "@/features/map-features/map-feature";
import type { Milestone } from "@/features/milestones/milestone";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export interface MapLocation extends GeographicCoordinates {
  readonly heading: number | null;
}

export interface MapProps {
  readonly layerVisibility?: MapLayerVisibility;
  readonly location?: MapLocation;
  readonly milestones?: readonly Milestone[];
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

const EMPTY_MILESTONES = Object.freeze([]) satisfies readonly Milestone[];

export default function Map({
  layerVisibility = DEFAULT_MAP_LAYER_VISIBILITY,
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
      mapStyle={colorScheme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
      onRegionDidChange={onRegionDidChange}
      style={styles.map}
      testID="arow-map"
    >
      <MapCamera location={location} recenterRequest={recenterRequest} />
      <MilestoneLayer
        milestones={milestones ?? EMPTY_MILESTONES}
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
