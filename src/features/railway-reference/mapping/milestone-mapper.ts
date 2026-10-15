import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { Milestone } from "@shared/railway-domain/milestone";
import type { RailwayMilestoneBounds } from "@shared/railway-domain/railway-milestone-bounds";
import { decodeKilometricPointDatabaseRow } from "@shared/railway-reference/records";

export function milestoneFromDatabaseRow(
  value: unknown,
  context: string,
): Milestone {
  const row = decodeKilometricPointDatabaseRow(value, context);
  return new Milestone({
    id: new MilestoneId(
      new RailwaySectionId(row.code_ligne, row.rg_troncon),
      row.position_m,
    ),
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    label: row.label,
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
