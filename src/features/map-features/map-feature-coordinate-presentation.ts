import type { GeographicCoordinates } from "@/types/geographic-coordinates";
import { formatGeographicCoordinates } from "@/utils/location-format";

export default function formatMapFeatureCoordinates(
  coordinates: GeographicCoordinates,
): string {
  return formatGeographicCoordinates(coordinates, "W");
}
