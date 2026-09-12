import { readFileSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";

import { parseRailwaySections } from "./railway-database/geojson.mjs";
import { RAILWAY_SCHEMA } from "./railway-database/schema.mjs";
import {
  canonicalLineCode,
  isRecord,
  milestonePositionMeters,
  requireCanonicalLineCode,
  requireCoordinate,
  requireNonEmptyString,
  requirePositiveInteger,
} from "./railway-database/validation.mjs";

const DEFAULT_DATABASE_PATH = resolve("src/statics/pk.sqlite");
const DEFAULT_GEOJSON_PATH = resolve("src/statics/lignes-par-type.geojson");

function tableColumns(database, table) {
  return database
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((column) => column.name);
}

function parseMilestoneRow(value, index, legacy) {
  const context = `Milestone row ${index}`;
  if (!isRecord(value)) {
    throw new Error(`${context} must be a record`);
  }

  const code = legacy
    ? canonicalLineCode(value.code_ligne, `${context} code_ligne`)
    : requireCanonicalLineCode(value.code_ligne, `${context} code_ligne`);
  const label = requireNonEmptyString(value.label, `${context} label`);
  const positionMeters = legacy
    ? milestonePositionMeters(label, `${context} label`)
    : value.position_m;
  if (!Number.isInteger(positionMeters) || positionMeters < 0) {
    throw new Error(`${context} position_m must be a non-negative integer`);
  }

  return Object.freeze({
    code,
    label,
    latitude: requireCoordinate(value.latitude, -90, 90, `${context} latitude`),
    longitude: requireCoordinate(
      value.longitude,
      -180,
      180,
      `${context} longitude`,
    ),
    positionMeters,
    rank: requirePositiveInteger(value.rg_troncon, `${context} rg_troncon`),
  });
}

function readMilestones(database) {
  const columns = tableColumns(database, "kilometric_points");
  const legacy = columns.includes("km");
  const positionColumn = legacy ? "km" : "position_m";
  const rows = database
    .prepare(
      `SELECT code_ligne, rg_troncon, ${positionColumn}, label, latitude, longitude
       FROM kilometric_points
       ORDER BY code_ligne, rg_troncon, ${positionColumn}`,
    )
    .all();

  return rows.map((row, index) => parseMilestoneRow(row, index, legacy));
}

function readSourceMilestones(databasePath) {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    return readMilestones(database);
  } finally {
    database.close();
  }
}

function fallbackRailwaySection(milestone) {
  return Object.freeze({
    code: milestone.code,
    endMilestone: null,
    gaiaId: null,
    hasGeometry: 0,
    name: `Ligne ${milestone.code}`,
    railwayType: null,
    rank: milestone.rank,
    startMilestone: null,
  });
}

function completeRailwaySections(geojsonSections, milestones) {
  const sections = new Map(
    geojsonSections.map((section) => [
      `${section.code}:${section.rank}`,
      section,
    ]),
  );

  for (const milestone of milestones) {
    const id = `${milestone.code}:${milestone.rank}`;
    if (!sections.has(id)) {
      sections.set(id, fallbackRailwaySection(milestone));
    }
  }

  return [...sections.values()].sort((left, right) =>
    `${left.code}:${left.rank}`.localeCompare(`${right.code}:${right.rank}`),
  );
}

function insertRailwaySections(database, sections) {
  const statement = database.prepare(`
    INSERT INTO railway_sections_next (
      code_ligne, rg_troncon, idgaia, lib_ligne, type_ligne, pkd, pkf, has_geometry
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const section of sections) {
    statement.run(
      section.code,
      section.rank,
      section.gaiaId,
      section.name,
      section.railwayType,
      section.startMilestone,
      section.endMilestone,
      section.hasGeometry,
    );
  }
}

function insertMilestones(database, milestones) {
  const statement = database.prepare(`
    INSERT INTO kilometric_points_next (
      code_ligne, rg_troncon, position_m, label, latitude, longitude
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const milestone of milestones) {
    statement.run(
      milestone.code,
      milestone.rank,
      milestone.positionMeters,
      milestone.label,
      milestone.latitude,
      milestone.longitude,
    );
  }
}

function rebuildSchema(database, sections, milestones) {
  database.exec("PRAGMA foreign_keys = OFF");
  database.exec("BEGIN IMMEDIATE");
  try {
    database.exec("DROP TABLE IF EXISTS kilometric_points_next");
    database.exec("DROP TABLE IF EXISTS railway_sections_next");
    database.exec(RAILWAY_SCHEMA);
    insertRailwaySections(database, sections);
    insertMilestones(database, milestones);
    database.exec("DROP TABLE IF EXISTS kilometric_points");
    database.exec("DROP TABLE IF EXISTS railway_sections");
    database.exec(
      "ALTER TABLE railway_sections_next RENAME TO railway_sections",
    );
    database.exec(
      "ALTER TABLE kilometric_points_next RENAME TO kilometric_points",
    );
    database.exec("PRAGMA user_version = 1");
    database.exec("COMMIT");
  } catch (cause) {
    database.exec("ROLLBACK");
    throw cause;
  }
  database.exec("PRAGMA foreign_keys = ON");
}

function validateDatabase(database, geojsonCount, milestoneCount) {
  const integrity = database.prepare("PRAGMA integrity_check").get();
  if (integrity?.integrity_check !== "ok") {
    throw new Error("Generated database failed its integrity check");
  }

  if (database.prepare("PRAGMA foreign_key_check").get() !== undefined) {
    throw new Error("Generated database contains an invalid foreign key");
  }

  const counts = database
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM railway_sections WHERE has_geometry = 1) AS geometry_count,
        (SELECT COUNT(*) FROM kilometric_points) AS milestone_count
    `,
    )
    .get();
  if (
    counts?.geometry_count !== geojsonCount ||
    counts?.milestone_count !== milestoneCount
  ) {
    throw new Error("Generated database row counts do not match their sources");
  }
}

export function updateRailwayDatabase({ databasePath, geojsonPath }) {
  const targetPath = resolve(databasePath);
  const stagingPath = `${targetPath}.staging-${process.pid}`;
  const geojson = JSON.parse(readFileSync(resolve(geojsonPath), "utf8"));
  const geojsonSections = parseRailwaySections(geojson);
  const milestones = readSourceMilestones(targetPath);
  const sections = completeRailwaySections(geojsonSections, milestones);

  rmSync(stagingPath, { force: true });
  let database;
  try {
    database = new DatabaseSync(stagingPath);
    rebuildSchema(database, sections, milestones);
    validateDatabase(database, geojsonSections.length, milestones.length);
    database.exec("VACUUM");
    database.close();
    database = undefined;
    renameSync(stagingPath, targetPath);
  } catch (cause) {
    database?.close();
    rmSync(stagingPath, { force: true });
    throw cause;
  }
}

function main() {
  const [
    databasePath = DEFAULT_DATABASE_PATH,
    geojsonPath = DEFAULT_GEOJSON_PATH,
  ] = process.argv.slice(2);
  updateRailwayDatabase({ databasePath, geojsonPath });
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
