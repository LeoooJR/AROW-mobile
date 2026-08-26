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
import UserLocationMarker from "@/components/adapters/map/user-location-marker";
import { type MilestoneFeatureCollection } from "@/features/milestones/milestones";

export interface MapLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapProps {
  readonly location?: MapLocation;
  readonly milestones?: MilestoneFeatureCollection;
  readonly recenterRequest?: number;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map({
  location,
  milestones,
  recenterRequest,
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
      {milestones === undefined ? null : (
        <MilestoneLayer milestones={milestones} />
      )}
      {location === undefined ? null : (
        <UserLocationMarker bearing={bearing} location={location} />
      )}
    </MapLibreMap>
  );
}
