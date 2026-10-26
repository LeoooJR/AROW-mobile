import {
  milestoneDisplayInterval,
  type MilestoneDisplayInterval,
} from "@/features/railway-reference/milestone-display";
import { MAP_LAYER_IDS } from "./map-layer-ids";

export const MILESTONE_CIRCLES = {
  normal: { radius: 4, stroke: 1 },
  selected: { radius: 7, stroke: 2 },
} as const;

export const RAILWAY_HIT_PADDING = 22;

const MILESTONE_HIT_TOLERANCE: Readonly<
  Record<MilestoneDisplayInterval, number>
> = {
  1000: 2,
  500: 6,
  100: 3,
  1: 1,
};

export function milestoneDotLayerId(
  interval: MilestoneDisplayInterval,
): string {
  return interval === 1000
    ? MAP_LAYER_IDS.milestone.dots
    : `${MAP_LAYER_IDS.milestone.dots}-${interval}`;
}

export function milestoneHitRadius(
  zoom: number,
  selected: boolean,
): number | undefined {
  const interval = milestoneDisplayInterval(zoom);
  if (interval === undefined) return undefined;
  const circle = selected
    ? MILESTONE_CIRCLES.selected
    : MILESTONE_CIRCLES.normal;
  return circle.radius + circle.stroke + MILESTONE_HIT_TOLERANCE[interval];
}
