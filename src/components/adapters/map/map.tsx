import {
  Camera,
  Map as MapLibreMap,
  Marker,
  type InitialViewState,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type NativeSyntheticEvent,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { DARK_MAP_STYLE } from "@/components/adapters/map/map-style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";

export interface MapLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapProps {
  readonly location?: MapLocation;
}

interface CameraTarget {
  readonly center: [number, number];
  readonly zoom: number;
}

interface MarkerColors {
  readonly accent: string;
  readonly foreground: string;
}

const CAMERA_TRANSITION_DURATION_MS = 700;
const LOCATION_ZOOM = 15;
const WORLD_CAMERA_TARGET: CameraTarget = {
  center: [0, 0],
  zoom: 0,
};
const INITIAL_VIEW_STATE = {
  bearing: 0,
  center: WORLD_CAMERA_TARGET.center,
  pitch: 0,
  zoom: WORLD_CAMERA_TARGET.zoom,
} satisfies InitialViewState;
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

function locationCameraTarget(location: MapLocation): CameraTarget {
  return {
    center: [location.longitude, location.latitude],
    zoom: LOCATION_ZOOM,
  };
}

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

export default function Map({ location }: MapProps): ReactElement {
  const colorScheme = useColorScheme();
  const reduceMotion = useReducedMotion();
  const hadLocationRef = useRef(location !== undefined);
  const [bearing, setBearing] = useState(0);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(() =>
    location === undefined
      ? WORLD_CAMERA_TARGET
      : locationCameraTarget(location),
  );
  const markerColors =
    colorScheme === "dark" ? MARKER_COLORS.dark : MARKER_COLORS.light;

  useEffect(() => {
    const hasLocation = location !== undefined;

    if (!hadLocationRef.current && location !== undefined) {
      setCameraTarget(locationCameraTarget(location));
    } else if (hadLocationRef.current && !hasLocation) {
      setCameraTarget(WORLD_CAMERA_TARGET);
    }

    hadLocationRef.current = hasLocation;
  }, [location]);

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
      <Camera
        bearing={0}
        center={cameraTarget.center}
        duration={reduceMotion ? 0 : CAMERA_TRANSITION_DURATION_MS}
        easing="ease"
        initialViewState={INITIAL_VIEW_STATE}
        pitch={0}
        testID="arow-map-camera"
        zoom={cameraTarget.zoom}
      />
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
