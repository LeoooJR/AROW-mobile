import type { NativeSnapshot } from "../../../modules/arow-mock-location/src/ArowMockLocationModule";
import type { LocationDescriptor } from "@/types/location-descriptor";

export function positionFromSnapshot(
  snapshot: NativeSnapshot,
): LocationDescriptor | undefined {
  if (snapshot.latitude === undefined || snapshot.longitude === undefined)
    return undefined;
  return {
    accuracy: null,
    heading: null,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
  };
}
