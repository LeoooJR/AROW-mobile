import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export interface LocationDescriptor extends GeographicCoordinates {
  readonly accuracy: number | null;
  readonly heading: number | null;
}
