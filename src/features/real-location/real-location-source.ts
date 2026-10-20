import * as Location from "expo-location";
import { Linking } from "react-native";

import type { LocationDescriptor } from "@/types/location-descriptor";

export interface LocationPermission {
  readonly granted: boolean;
  readonly undetermined: boolean;
  readonly canAskAgain: boolean;
}

export interface LocationUpdate {
  readonly position: LocationDescriptor;
  readonly mocked: boolean;
}

export interface LocationWatcher {
  remove(): void;
}

export interface RealLocationSource {
  getPermission(): Promise<LocationPermission>;
  requestPermission(): Promise<LocationPermission>;
  hasServicesEnabled(): Promise<boolean>;
  watch(
    update: (location: LocationUpdate) => void,
    error: () => void,
  ): Promise<LocationWatcher>;
  openSettings(): Promise<void>;
}

function permissionFromResponse(
  response: Location.LocationPermissionResponse,
): LocationPermission {
  return {
    granted: response.granted,
    canAskAgain: response.canAskAgain,
    undetermined: response.status === Location.PermissionStatus.UNDETERMINED,
  };
}

function descriptorFromLocation(
  location: Location.LocationObject,
): LocationDescriptor {
  const heading = location.coords.heading;
  return {
    accuracy: location.coords.accuracy,
    heading:
      heading === null || !Number.isFinite(heading) || heading < 0
        ? null
        : heading % 360,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export const realLocationSource: RealLocationSource = {
  getPermission: async () =>
    permissionFromResponse(await Location.getForegroundPermissionsAsync()),
  requestPermission: async () =>
    permissionFromResponse(await Location.requestForegroundPermissionsAsync()),
  hasServicesEnabled: () => Location.hasServicesEnabledAsync(),
  openSettings: () => Linking.openSettings(),
  watch: (update, error) =>
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 5_000,
      },
      (location) =>
        update({
          position: descriptorFromLocation(location),
          mocked: location.mocked === true,
        }),
      error,
    ),
};
