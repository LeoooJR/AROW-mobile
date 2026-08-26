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
import { type MilestoneFeatureCollection } from "@/features/milestones/milestones";
import type { RailwayLineKey, RailwayLineMetadata } from "@/types/railway-line";

export interface MapLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapProps {
  readonly location?: MapLocation;
  readonly milestones?: MilestoneFeatureCollection;
  readonly onRailwayPress?: (railway: RailwayLineMetadata) => void;
  readonly railwayData?: string;
  readonly recenterRequest?: number;
  readonly selectedRailway?: RailwayLineKey;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map({
  location,
  milestones,
  onRailwayPress,
  railwayData,
  recenterRequest,
  selectedRailway,
}: MapProps): ReactElement {
  const colorScheme = useColorScheme();
  const [bearing, setBearing] = useState(0);

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
          onRailwayPress={onRailwayPress}
          selectedRailway={selectedRailway}
        />
      )}
      {milestones === undefined ? null : (
        <MilestoneLayer milestones={milestones} />
      )}
      {location === undefined ? null : (
        <UserLocationMarker bearing={bearing} location={location} />
      )}
    </MapLibreMap>
  );
}
