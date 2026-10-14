import { Milestone } from "@/features/milestones/domain/milestone";
import type { RailwayMilestoneBounds } from "@/features/railway-reference/context";
import { decodeKilometricPointDatabaseRow } from "@shared/railway-reference/records";

export function milestoneFromDatabaseRow(
  value: unknown,
  context: string,
): Milestone {
  const row = decodeKilometricPointDatabaseRow(value, context);
  return new Milestone({
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    label: row.label,
    lineCode: row.code_ligne,
    positionMeters: row.position_m,
    sectionRank: row.rg_troncon,
  });
}

export function milestoneRowsToBounds(
  rows: readonly unknown[],
): RailwayMilestoneBounds {
  const points = rows.map((row) =>
    milestoneFromDatabaseRow(row, "section boundary"),
  );
  return { first: points[0], last: points.at(-1) };
}
