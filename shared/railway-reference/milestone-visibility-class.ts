export type MilestoneVisibilityClass = 0 | 1 | 2 | 3;

export function isMilestoneVisibilityClass(
  value: unknown,
): value is MilestoneVisibilityClass {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/** Passive map visibility tier derived from numerical PK; the app owns zoom thresholds. */
export function milestoneVisibilityClassForPosition(
  positionMeters: number,
): MilestoneVisibilityClass {
  if (positionMeters % 1000 === 0) return 0;
  if (positionMeters % 500 === 0) return 1;
  if (positionMeters % 100 === 0) return 2;
  return 3;
}
