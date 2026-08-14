import {
  Map as MapLibreMap,
  Marker,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import { type ReactElement, useCallback, useState } from "react";
import {
  type NativeSyntheticEvent,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import MapCamera from "@/components/adapters/map/map-camera";
import { DARK_MAP_STYLE } from "@/components/adapters/map/map-style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";

export interface MapLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapProps {
  readonly location?: MapLocation;
  readonly recenterRequest?: number;
}

interface MarkerColors {
  readonly accent: string;
  readonly foreground: string;
}

const MARKER_COLORS = {
  dark: {
    accent: "#FF6A00",
    foreground: "#FFFFFF",
  },
  light: {
    accent: "#FF6A00",
    foreground: "#0A0A0A",
  },
} as const satisfies Record<"dark" | "light", MarkerColors>;

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  marker: {
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    width: 50,
  },
});

function normalizedDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function CurrentLocationMarker({
  bearing,
  colors,
  location,
}: {
  readonly bearing: number;
  readonly colors: MarkerColors;
  readonly location: MapLocation;
}): ReactElement {
  const heading = location.heading ?? 0;
  const rotation = normalizedDegrees(heading - bearing);

  return (
    <Marker
      anchor="center"
      id="current-location-marker"
      lngLat={[location.longitude, location.latitude]}
    >
      <View
        accessible
        accessibilityLabel="Position actuelle"
        pointerEvents="none"
        style={styles.marker}
        testID="current-location-marker"
      >
        <Svg
          height={50}
          style={{ transform: [{ rotate: `${rotation}deg` }] }}
          viewBox="-25 -25 50 50"
          width={50}
        >
          <Circle fill={colors.accent} opacity={0.14} r={25} />
          <Circle
            fill={colors.accent}
            r={13}
            stroke={colors.foreground}
            strokeWidth={2}
          />
          <Path d="M0 -7 L5 6 L0 3 L-5 6 Z" fill={colors.foreground} />
        </Svg>
      </View>
    </Marker>
  );
}

export default function Map({
  location,
  recenterRequest,
}: MapProps): ReactElement {
  const colorScheme = useColorScheme();
  const [bearing, setBearing] = useState(0);
  const markerColors =
    colorScheme === "dark" ? MARKER_COLORS.dark : MARKER_COLORS.light;

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
        <CurrentLocationMarker
          bearing={bearing}
          colors={markerColors}
          location={location}
        />
      )}
    </MapLibreMap>
  );
}
