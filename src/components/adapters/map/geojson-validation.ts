import type { Position } from "geojson";

import type { GeographicCoordinates } from "@/types/geographic-coordinates";
import { isLatitude, isLongitude } from "@/types/value-validation";

export function geographicCoordinatesFromPosition(
  position: Position,
): GeographicCoordinates | undefined {
  if (position.length !== 2 && position.length !== 3) {
    return undefined;
  }

  const [longitude, latitude, altitude] = position;
  if (
    !isLatitude(latitude) ||
    !isLongitude(longitude) ||
    (position.length === 3 &&
      (typeof altitude !== "number" || !Number.isFinite(altitude)))
  ) {
    return undefined;
  }

  return { latitude, longitude };
}
