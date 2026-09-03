import type { Position } from "geojson";

import type { GeographicCoordinates } from "@/types/geographic-coordinates";
import { isFiniteNumberInRange } from "@/types/value-validation";

export function geographicCoordinatesFromPosition(
  position: Position,
): GeographicCoordinates | undefined {
  if (position.length !== 2 && position.length !== 3) {
    return undefined;
  }

  const [longitude, latitude, altitude] = position;
  if (
    !isFiniteNumberInRange(latitude, -90, 90) ||
    !isFiniteNumberInRange(longitude, -180, 180) ||
    (position.length === 3 &&
      (typeof altitude !== "number" || !Number.isFinite(altitude)))
  ) {
    return undefined;
  }

  return { latitude, longitude };
}
