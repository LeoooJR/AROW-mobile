import { Marker } from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface UserLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface UserLocationMarkerProps {
  readonly bearing: number;
  readonly location: UserLocation;
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

export default function UserLocationMarker({
  bearing,
  location,
}: UserLocationMarkerProps): ReactElement {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? MARKER_COLORS.dark : MARKER_COLORS.light;
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
