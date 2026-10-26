import type { PixelPoint } from "@maplibre/maplibre-react-native";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { MilestoneDisplayInterval } from "@/features/railway-reference/milestone-display";
import { milestoneFromFeature } from "./map-feature-parsing";
import { milestoneHitRadius } from "./map-hit-policy";

export interface ProjectedMilestone {
  readonly milestone: Milestone;
  readonly point: PixelPoint;
}

interface MilestoneHit {
  readonly milestone: Milestone;
  readonly distanceSquared: number;
}

export function eligibleMilestoneCandidates(
  features: readonly GeoJSON.Feature[],
  interval: MilestoneDisplayInterval,
  selectedId: string | undefined,
): Milestone[] {
  const candidates = new Map<string, Milestone>();
  for (const feature of features) {
    const milestone = milestoneFromFeature(feature);
    if (milestone === undefined) continue;
    const isEligible =
      milestone.positionMeters % interval === 0 ||
      milestone.id.value === selectedId;
    if (isEligible) candidates.set(milestone.id.value, milestone);
  }
  return [...candidates.values()];
}

function hitWithinTarget(
  candidate: ProjectedMilestone,
  tap: PixelPoint,
  zoom: number,
  selectedId: string | undefined,
): MilestoneHit | undefined {
  if (!candidate.point.every(Number.isFinite)) return undefined;
  const radius = milestoneHitRadius(
    zoom,
    candidate.milestone.id.value === selectedId,
  );
  const [x, y] = candidate.point;
  const distanceSquared = (x - tap[0]) ** 2 + (y - tap[1]) ** 2;
  if (radius === undefined || distanceSquared > radius ** 2) return undefined;
  return { milestone: candidate.milestone, distanceSquared };
}

function isPreferredHit(
  candidate: MilestoneHit,
  current: MilestoneHit,
): boolean {
  if (candidate.distanceSquared !== current.distanceSquared)
    return candidate.distanceSquared < current.distanceSquared;
  return candidate.milestone.id.value < current.milestone.id.value;
}

export function nearestMilestoneWithinTarget(
  candidates: readonly ProjectedMilestone[],
  tap: PixelPoint,
  zoom: number,
  selectedId: string | undefined,
): Milestone | undefined {
  let nearest: MilestoneHit | undefined;
  for (const candidate of candidates) {
    const hit = hitWithinTarget(candidate, tap, zoom, selectedId);
    if (hit === undefined) continue;
    if (nearest === undefined || isPreferredHit(hit, nearest)) nearest = hit;
  }
  return nearest?.milestone;
}
