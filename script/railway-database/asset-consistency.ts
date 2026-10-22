import { DatabaseSync } from "node:sqlite";
import type { MilestoneFeatureCollection } from "./types";

export function validatePointConsistency(
  databasePath: string,
  geojson: MilestoneFeatureCollection,
): void {
  const features = new Map(
    geojson.features.map((feature) => [feature.id, feature]),
  );
  if (features.size !== geojson.features.length)
    throw new Error("Milestone GeoJSON contains duplicate identities");
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    let count = 0;
    for (const row of database
      .prepare(
        "SELECT code_ligne, rg_troncon, position_m, label, longitude, latitude FROM kilometric_points",
      )
      .iterate()) {
      const id = `${row.code_ligne}:${row.rg_troncon}:${row.position_m}`;
      const feature = features.get(id);
      if (
        feature === undefined ||
        feature.properties.label !== row.label ||
        feature.geometry.coordinates[0] !== row.longitude ||
        feature.geometry.coordinates[1] !== row.latitude
      ) {
        throw new Error(`Milestone GeoJSON disagrees with SQLite for ${id}`);
      }
      count++;
    }
    if (count !== features.size)
      throw new Error(
        "Milestone GeoJSON and SQLite have different point counts",
      );
  } finally {
    database.close();
  }
}
