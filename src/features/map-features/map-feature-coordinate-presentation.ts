import type { GeographicCoordinates } from "@/types/geographic-coordinates";

function formatCoordinate(
  value: number,
  positiveDirection: "E" | "N",
  negativeDirection: "S" | "W",
): string {
  const direction = value >= 0 ? positiveDirection : negativeDirection;
  return `${Math.abs(value).toFixed(5)} ${direction}`;
}

export default function formatMapFeatureCoordinates(
  coordinates: GeographicCoordinates,
): string {
  return `${formatCoordinate(coordinates.latitude, "N", "S")} · ${formatCoordinate(coordinates.longitude, "E", "W")}`;
}
