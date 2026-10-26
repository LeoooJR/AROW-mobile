import type { MapViewport } from "@/types/map-viewport";

export function hasValidViewportBounds(bounds: MapViewport["bounds"]): boolean {
  const [, south, , north] = bounds;
  return (
    bounds.every(Number.isFinite) &&
    south <= north &&
    south >= -90 &&
    north <= 90
  );
}
