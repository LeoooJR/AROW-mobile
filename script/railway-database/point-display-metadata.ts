import type { DatabaseSync } from "node:sqlite";

export function validatePointDisplayMetadata(database: DatabaseSync): void {
  const invalid = database
    .prepare(
      `
    SELECT code_ligne, rg_troncon, position_m FROM kilometric_points
    WHERE visibility_class != CASE
      WHEN position_m % 1000 = 0 THEN 0
      WHEN position_m % 500 = 0 THEN 1
      WHEN position_m % 100 = 0 THEN 2
      ELSE 3 END
    LIMIT 1
  `,
    )
    .get();
  if (invalid !== undefined)
    throw new Error(
      "Generated database contains an invalid point visibility class",
    );

  const columns = database
    .prepare("PRAGMA index_xinfo(kilometric_points_display_idx)")
    .all();
  const expected = [
    "visibility_class",
    "longitude",
    "latitude",
    "code_ligne",
    "rg_troncon",
    "position_m",
  ];
  const index = database
    .prepare("PRAGMA index_list(kilometric_points)")
    .all()
    .find((row) => row.name === "kilometric_points_display_idx");
  if (
    index === undefined ||
    index.unique !== 0 ||
    index.partial !== 0 ||
    columns.length !== expected.length ||
    columns.some(
      (row, i) =>
        row.name !== expected[i] ||
        row.desc !== 0 ||
        row.coll !== "BINARY" ||
        row.key !== (i < 3 ? 1 : 0),
    )
  )
    throw new Error(
      "Generated database has a missing or invalid point display index",
    );
}
