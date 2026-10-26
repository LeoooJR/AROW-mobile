import type { DatabaseSync } from "node:sqlite";
import {
  createTableSql,
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
} from "../../shared/railway-reference/schema";

export function validateSectionEndpoints(database: DatabaseSync): void {
  // PRAGMA foreign_key_list does not expose whether a constraint is deferred.
  const normalize = (sql: string) =>
    sql.replace(/\s+/g, " ").trim().replace(/;$/, "");
  for (const table of [RAILWAY_SECTIONS_TABLE, KILOMETRIC_POINTS_TABLE]) {
    const row = database
      .prepare(
        "SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?",
      )
      .get(table.name);
    if (
      typeof row?.sql !== "string" ||
      normalize(row.sql) !== normalize(createTableSql(table))
    ) {
      throw new Error(
        "Generated database has a missing or invalid section endpoint schema",
      );
    }
  }
  const invalid = database
    .prepare(
      `
    SELECT section.code_ligne, section.rg_troncon
    FROM railway_sections AS section
    LEFT JOIN (
      SELECT code_ligne, rg_troncon, MIN(position_m) AS first, MAX(position_m) AS last
      FROM kilometric_points GROUP BY code_ligne, rg_troncon
    ) AS recorded USING (code_ligne, rg_troncon)
    WHERE section.first_recorded_position_m IS NOT recorded.first
       OR section.last_recorded_position_m IS NOT recorded.last
    LIMIT 1
  `,
    )
    .get();
  if (invalid !== undefined) {
    throw new Error(
      "Generated database contains invalid recorded section endpoints",
    );
  }
}
