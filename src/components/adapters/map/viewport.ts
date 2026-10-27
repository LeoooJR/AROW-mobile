import type { MapViewport } from "@/types/map-viewport";
import { normalizeLongitude } from "@/utils/angle";

export function normalizedViewportBounds(
  bounds: MapViewport["bounds"],
): MapViewport["bounds"] | undefined {
  if (!hasValidViewportBounds(bounds)) return undefined;
  const [west, south, east, north] = bounds;
  if (Math.abs(east - west) >= 360) return [-180, south, 180, north];
  return [normalizeLongitude(west), south, normalizeLongitude(east), north];
}

export function hasValidViewportBounds(bounds: MapViewport["bounds"]): boolean {
  const [, south, , north] = bounds;
  return (
    bounds.every(Number.isFinite) &&
    south <= north &&
    south >= -90 &&
    north <= 90
  );
}
