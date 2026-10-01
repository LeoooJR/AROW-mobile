import type { GeographicCoordinates } from "@/types/geographic-coordinates";
import type { LocationDescriptor } from "@/types/location-descriptor";

export function formatCoordinate(
  value: number,
  positiveHemisphere: string,
  negativeHemisphere: string,
): string {
  const hemisphere = value >= 0 ? positiveHemisphere : negativeHemisphere;
  return `${Math.abs(value).toFixed(5)} ${hemisphere}`;
}

export function formatGeographicCoordinates(
  coordinates: GeographicCoordinates,
  westHemisphere: "O" | "W",
): string {
  return [
    formatCoordinate(coordinates.latitude, "N", "S"),
    formatCoordinate(coordinates.longitude, "E", westHemisphere),
  ].join(" · ");
}

export function formatLocationDescriptor(position: LocationDescriptor): string {
  const accuracy =
    position.accuracy === null
      ? "précision indisponible"
      : `précision ${Math.max(0, Math.round(position.accuracy))} m`;
  return `${formatGeographicCoordinates(position, "O")} · ${accuracy}`;
}
