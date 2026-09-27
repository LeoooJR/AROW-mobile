import type { NativeRunningSnapshot } from "../../../modules/arow-mock-location/src/native-contracts";
import type { LocationDescriptor } from "@/types/location-descriptor";

export function positionFromSnapshot(
  snapshot: NativeRunningSnapshot,
): LocationDescriptor {
  return {
    accuracy: null,
    heading: null,
    latitude: snapshot.latitude,
    longitude: snapshot.longitude,
  };
}
