export interface GeographicCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface RailwaySectionKey {
  readonly lineCode: string;
  readonly sectionRank: number;
}

export interface RailwayFeature extends RailwaySectionKey {
  readonly endMilestone: string;
  readonly gaiaId: string;
  readonly kind: "railway";
  readonly name: string;
  readonly railwayType: string;
  readonly startMilestone: string;
}

export interface MilestoneFeature extends RailwaySectionKey {
  readonly coordinates: GeographicCoordinates;
  readonly kilometer: number;
  readonly kind: "milestone";
  readonly label: string;
}

export type MapFeature = RailwayFeature | MilestoneFeature;

const LINE_CODE_LENGTH = 6;
const MAX_NUMERIC_LINE_CODE = 10 ** LINE_CODE_LENGTH - 1;

export function canonicalRailwayLineCode(value: string | number): string {
  if (typeof value === "string") {
    if (/^\d{6}$/.test(value)) {
      return value;
    }

    throw new Error("Railway line code must contain exactly six digits");
  }

  if (!Number.isInteger(value) || value < 0 || value > MAX_NUMERIC_LINE_CODE) {
    throw new Error("Numeric railway line code must be between 0 and 999999");
  }

  return String(value).padStart(LINE_CODE_LENGTH, "0");
}

export function railwaySectionId(key: RailwaySectionKey): string {
  return `${key.lineCode}:${key.sectionRank}`;
}

export function milestoneId(
  milestone: Pick<MilestoneFeature, "kilometer" | "lineCode" | "sectionRank">,
): string {
  return `${railwaySectionId(milestone)}:${milestone.kilometer}`;
}

export function railwaySectionKey(feature: MapFeature): RailwaySectionKey {
  return {
    lineCode: feature.lineCode,
    sectionRank: feature.sectionRank,
  };
}
