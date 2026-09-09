import { isCanonicalRailwayLineCode } from "@/features/map-features/railway-section-key";
import { Milestone } from "@/features/milestones/milestone";
import {
  isLatitude,
  isLongitude,
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isUnsignedInteger,
} from "@/types/value-validation";

export function milestoneRecordToFeature(
  value: unknown,
  context: string,
): Milestone {
  if (
    !isRecord(value) ||
    !isCanonicalRailwayLineCode(value.code_ligne) ||
    !isUnsignedInteger(value.position_m) ||
    !isNonEmptyString(value.label) ||
    !isPositiveInteger(value.rg_troncon) ||
    !isLatitude(value.latitude) ||
    !isLongitude(value.longitude)
  ) {
    throw new Error(`Invalid milestone ${context}`);
  }

  return new Milestone({
    coordinates: {
      latitude: value.latitude,
      longitude: value.longitude,
    },
    label: value.label,
    lineCode: value.code_ligne,
    positionMeters: value.position_m,
    sectionRank: value.rg_troncon,
  });
}

export function milestoneRecordsToFeatures(
  values: readonly unknown[],
): readonly Milestone[] {
  return values.map((value, index) =>
    milestoneRecordToFeature(value, `at row ${index}`),
  );
}
