export type MilestoneDisplayInterval = 1000 | 500 | 100 | 1;

interface MilestoneDisplayBand {
  readonly minZoom: number;
  readonly maxZoom?: number;
  readonly intervalMeters: MilestoneDisplayInterval;
}

export const MILESTONE_DISPLAY_BANDS: readonly MilestoneDisplayBand[] = [
  { minZoom: 10, maxZoom: 12, intervalMeters: 1000 },
  { minZoom: 12, maxZoom: 14, intervalMeters: 500 },
  { minZoom: 14, maxZoom: 15, intervalMeters: 100 },
  { minZoom: 15, intervalMeters: 1 },
];

export function milestoneDisplayInterval(
  zoom: number,
): MilestoneDisplayInterval | undefined {
  if (!Number.isFinite(zoom)) return undefined;
  return MILESTONE_DISPLAY_BANDS.find(
    (band) => zoom >= band.minZoom && zoom < (band.maxZoom ?? Infinity),
  )?.intervalMeters;
}
