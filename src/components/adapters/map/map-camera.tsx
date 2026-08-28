import {
  Camera,
  type CameraRef,
  type InitialViewState,
} from "@maplibre/maplibre-react-native";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

interface MapCameraLocation {
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapCameraProps {
  readonly location?: MapCameraLocation;
  readonly recenterRequest?: number;
}

interface CameraTarget {
  readonly center: [number, number];
  readonly zoom: number;
}

interface MapCameraSettings {
  readonly initialViewState: InitialViewState;
  readonly locationZoom: number;
  readonly transitionDurationMs: number;
  readonly worldTarget: CameraTarget;
}

const DEFAULT_MAP_CAMERA_SETTINGS = {
  initialViewState: {
    bearing: 0,
    center: [0, 0],
    pitch: 0,
    zoom: 0,
  },
  locationZoom: 15,
  transitionDurationMs: 700,
  worldTarget: {
    center: [0, 0],
    zoom: 0,
  },
} satisfies MapCameraSettings;

function locationCameraTarget(location: MapCameraLocation): CameraTarget {
  return {
    center: [location.longitude, location.latitude],
    zoom: DEFAULT_MAP_CAMERA_SETTINGS.locationZoom,
  };
}

export default function MapCamera({
  location,
  recenterRequest,
}: MapCameraProps): ReactElement {
  const reduceMotion = useReducedMotion();
  const cameraRef = useRef<CameraRef>(null);
  const hadLocationRef = useRef(location !== undefined);
  const lastRecenterRequestRef = useRef(recenterRequest);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>(() =>
    location === undefined
      ? DEFAULT_MAP_CAMERA_SETTINGS.worldTarget
      : locationCameraTarget(location),
  );

  useEffect(() => {
    const hasLocation = location !== undefined;

    if (!hadLocationRef.current && location !== undefined) {
      setCameraTarget(locationCameraTarget(location));
    } else if (hadLocationRef.current && !hasLocation) {
      setCameraTarget(DEFAULT_MAP_CAMERA_SETTINGS.worldTarget);
    }

    hadLocationRef.current = hasLocation;
  }, [location]);

  useEffect(() => {
    if (lastRecenterRequestRef.current === recenterRequest) {
      return;
    }

    lastRecenterRequestRef.current = recenterRequest;

    if (location === undefined) {
      return;
    }

    cameraRef.current?.easeTo({
      bearing: 0,
      center: [location.longitude, location.latitude],
      duration: reduceMotion
        ? 0
        : DEFAULT_MAP_CAMERA_SETTINGS.transitionDurationMs,
      easing: "ease",
      pitch: 0,
      zoom: DEFAULT_MAP_CAMERA_SETTINGS.locationZoom,
    });
  }, [location, recenterRequest, reduceMotion]);

  return (
    <Camera
      bearing={0}
      center={cameraTarget.center}
      duration={
        reduceMotion ? 0 : DEFAULT_MAP_CAMERA_SETTINGS.transitionDurationMs
      }
      easing="ease"
      initialViewState={DEFAULT_MAP_CAMERA_SETTINGS.initialViewState}
      pitch={0}
      ref={cameraRef}
      testID="arow-map-camera"
      zoom={cameraTarget.zoom}
    />
  );
}
