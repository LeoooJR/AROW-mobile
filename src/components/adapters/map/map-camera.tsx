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
  readonly focusLocation?: MapCameraLocation;
  readonly focusRequest?: number;
  readonly location?: MapCameraLocation;
  readonly recenterRequest?: number;
}

interface CameraTarget {
  readonly center: [number, number];
  readonly zoom: number;
}

type CameraTargetOwner = "focus" | "location" | "world";

interface MapCameraState {
  readonly focusRequest?: number;
  readonly hasLocation: boolean;
  readonly owner: CameraTargetOwner;
  readonly recenterRequest?: number;
  readonly target: CameraTarget;
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

function initialCameraState(
  location: MapCameraLocation | undefined,
  focusRequest: number | undefined,
  recenterRequest: number | undefined,
): MapCameraState {
  return {
    focusRequest,
    hasLocation: location !== undefined,
    owner: location === undefined ? "world" : "location",
    recenterRequest,
    target:
      location === undefined
        ? DEFAULT_MAP_CAMERA_SETTINGS.worldTarget
        : locationCameraTarget(location),
  };
}

function deriveCameraState(
  current: MapCameraState,
  focusLocation: MapCameraLocation | undefined,
  focusRequest: number | undefined,
  location: MapCameraLocation | undefined,
  recenterRequest: number | undefined,
): MapCameraState {
  const focusChanged = current.focusRequest !== focusRequest;
  const recenterChanged = current.recenterRequest !== recenterRequest;
  const hasLocation = location !== undefined;

  if (focusChanged && focusLocation !== undefined) {
    return {
      focusRequest,
      hasLocation,
      owner: "focus",
      recenterRequest,
      target: locationCameraTarget(focusLocation),
    };
  }

  if (recenterChanged && location !== undefined) {
    return {
      focusRequest,
      hasLocation,
      owner: "location",
      recenterRequest,
      target: locationCameraTarget(location),
    };
  }

  if (!current.hasLocation && location !== undefined) {
    return {
      focusRequest,
      hasLocation,
      owner: current.owner === "focus" ? "focus" : "location",
      recenterRequest,
      target:
        current.owner === "focus"
          ? current.target
          : locationCameraTarget(location),
    };
  }

  if (current.hasLocation && !hasLocation) {
    return {
      focusRequest,
      hasLocation,
      owner: current.owner === "location" ? "world" : current.owner,
      recenterRequest,
      target:
        current.owner === "location"
          ? DEFAULT_MAP_CAMERA_SETTINGS.worldTarget
          : current.target,
    };
  }

  if (focusChanged || recenterChanged) {
    return { ...current, focusRequest, recenterRequest };
  }

  return current;
}

export default function MapCamera({
  focusLocation,
  focusRequest,
  location,
  recenterRequest,
}: MapCameraProps): ReactElement {
  const reduceMotion = useReducedMotion();
  const cameraRef = useRef<CameraRef>(null);
  const lastRecenterRequestRef = useRef(recenterRequest);
  const lastFocusRequestRef = useRef(focusRequest);
  const [cameraState, setCameraState] = useState<MapCameraState>(() =>
    initialCameraState(location, focusRequest, recenterRequest),
  );
  const derivedCameraState = deriveCameraState(
    cameraState,
    focusLocation,
    focusRequest,
    location,
    recenterRequest,
  );

  if (derivedCameraState !== cameraState) {
    setCameraState(derivedCameraState);
  }

  useEffect(() => {
    if (lastRecenterRequestRef.current === recenterRequest) {
      return;
    }

    lastRecenterRequestRef.current = recenterRequest;

    if (location === undefined) {
      return;
    }

    const target = locationCameraTarget(location);
    cameraRef.current?.easeTo({
      bearing: 0,
      center: target.center,
      duration: reduceMotion
        ? 0
        : DEFAULT_MAP_CAMERA_SETTINGS.transitionDurationMs,
      easing: "ease",
      pitch: 0,
      zoom: DEFAULT_MAP_CAMERA_SETTINGS.locationZoom,
    });
  }, [location, recenterRequest, reduceMotion]);

  useEffect(() => {
    if (lastFocusRequestRef.current === focusRequest) {
      return;
    }

    lastFocusRequestRef.current = focusRequest;
    if (focusLocation === undefined) {
      return;
    }

    const target = locationCameraTarget(focusLocation);
    cameraRef.current?.easeTo({
      bearing: 0,
      center: target.center,
      duration: reduceMotion
        ? 0
        : DEFAULT_MAP_CAMERA_SETTINGS.transitionDurationMs,
      easing: "ease",
      pitch: 0,
      zoom: DEFAULT_MAP_CAMERA_SETTINGS.locationZoom,
    });
  }, [focusLocation, focusRequest, reduceMotion]);

  return (
    <Camera
      bearing={0}
      center={cameraState.target.center}
      duration={
        reduceMotion ? 0 : DEFAULT_MAP_CAMERA_SETTINGS.transitionDurationMs
      }
      easing="ease"
      initialViewState={DEFAULT_MAP_CAMERA_SETTINGS.initialViewState}
      pitch={0}
      ref={cameraRef}
      testID="arow-map-camera"
      zoom={cameraState.target.zoom}
    />
  );
}
