import type { GeographicCoordinatesWithHeading } from "@/types/geographic-coordinates";

export interface LocationDescriptor extends GeographicCoordinatesWithHeading {
  readonly accuracy: number | null;
}
