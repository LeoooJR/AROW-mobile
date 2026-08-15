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
import UserLocationMarker from "@/components/adapters/map/user-location-marker";

export interface MapLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapProps {
  readonly location?: MapLocation;
  readonly recenterRequest?: number;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map({
  location,
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
      {location === undefined ? null : (
        <UserLocationMarker bearing={bearing} location={location} />
      )}
    </MapLibreMap>
  );
}
