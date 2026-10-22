import { DatabaseSync } from "node:sqlite";
import type { Milestone } from "./types";

export function validateImportedMilestones(
  databasePath: string,
  milestones: readonly Milestone[],
): void {
  const expected = new Map(
    milestones.map((point) => [
      `${point.code}:${point.rank}:${point.positionMeters}`,
      point,
    ]),
  );
  if (expected.size !== milestones.length)
    throw new Error("Accepted milestones contain duplicate identities");
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    let count = 0;
    for (const row of database
      .prepare(
        "SELECT code_ligne, rg_troncon, position_m, label, longitude, latitude FROM kilometric_points",
      )
      .iterate()) {
      const id = `${row.code_ligne}:${row.rg_troncon}:${row.position_m}`;
      const point = expected.get(id);
      if (
        point === undefined ||
        point.label !== row.label ||
        point.longitude !== row.longitude ||
        point.latitude !== row.latitude
      ) {
        throw new Error(`SQLite disagrees with accepted CSV milestone ${id}`);
      }
      count++;
    }
    if (count !== expected.size)
      throw new Error(
        "SQLite and accepted CSV milestones have different point counts",
      );
  } finally {
    database.close();
  }
}
