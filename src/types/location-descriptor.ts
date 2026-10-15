import type { GeographicCoordinatesWithHeading } from "@shared/geographic-coordinates";

export interface LocationDescriptor extends GeographicCoordinatesWithHeading {
  readonly accuracy: number | null;
}
