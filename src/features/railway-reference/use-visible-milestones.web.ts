import type { Milestone } from "@shared/railway-domain/milestone";
import type { MapViewport } from "@/types/map-viewport";

const EMPTY_POINTS: readonly Milestone[] = [];
export function useVisibleMilestones(
  _viewport: MapViewport | undefined,
  _visible: boolean,
): readonly Milestone[] {
  return EMPTY_POINTS;
}
