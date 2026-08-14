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

function locationCameraTarget(location: MapCameraLocation): CameraTarget {
  return {
    center: [location.longitude, location.latitude],
    zoom: LOCATION_ZOOM,
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
      ? WORLD_CAMERA_TARGET
      : locationCameraTarget(location),
  );

  useEffect(() => {
    const hasLocation = location !== undefined;

    if (!hadLocationRef.current && location !== undefined) {
      setCameraTarget(locationCameraTarget(location));
    } else if (hadLocationRef.current && !hasLocation) {
      setCameraTarget(WORLD_CAMERA_TARGET);
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
      duration: reduceMotion ? 0 : CAMERA_TRANSITION_DURATION_MS,
      easing: "ease",
      pitch: 0,
      zoom: LOCATION_ZOOM,
    });
  }, [location, recenterRequest, reduceMotion]);

  return (
    <Camera
      bearing={0}
      center={cameraTarget.center}
      duration={reduceMotion ? 0 : CAMERA_TRANSITION_DURATION_MS}
      easing="ease"
      initialViewState={INITIAL_VIEW_STATE}
      pitch={0}
      ref={cameraRef}
      testID="arow-map-camera"
      zoom={cameraTarget.zoom}
    />
  );
}
