import { Milestone } from "@/features/milestones/milestone";

export type MilestoneLoadState =
  | { readonly status: "unavailable" }
  | { readonly status: "loading" }
  | {
      readonly milestones: readonly Milestone[];
      readonly status: "ready";
    }
  | { readonly status: "error" };

interface MilestoneDatabaseRow {
  readonly code_ligne: number;
  readonly km: number;
  readonly label: string;
  readonly latitude: number;
  readonly ligne: string;
  readonly longitude: number;
  readonly rg_troncon: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

function isCoordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function parseMilestoneDatabaseRow(
  value: unknown,
  index: number,
): MilestoneDatabaseRow {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.ligne) ||
    !isNonNegativeInteger(value.code_ligne) ||
    value.code_ligne > 999_999 ||
    !isNonNegativeInteger(value.km) ||
    !isNonEmptyString(value.label) ||
    !isPositiveInteger(value.rg_troncon) ||
    !isCoordinate(value.latitude, -90, 90) ||
    !isCoordinate(value.longitude, -180, 180)
  ) {
    throw new Error(`Invalid milestone at row ${index}`);
  }

  return {
    code_ligne: value.code_ligne,
    km: value.km,
    label: value.label,
    latitude: value.latitude,
    ligne: value.ligne,
    longitude: value.longitude,
    rg_troncon: value.rg_troncon,
  };
}

export function milestoneRowsToFeatures(
  rows: readonly unknown[],
): readonly Milestone[] {
  return rows.map((value, index) => {
    const row = parseMilestoneDatabaseRow(value, index);
    const milestone = new Milestone({
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude,
      },
      kilometer: row.km,
      label: row.label,
      lineCode: row.code_ligne,
      sectionRank: row.rg_troncon,
    });

    if (row.ligne !== `${milestone.lineCode}-${milestone.sectionRank}`) {
      throw new Error(`Invalid milestone railway section at row ${index}`);
    }

    return milestone;
  });
}
