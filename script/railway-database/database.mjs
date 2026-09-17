import { DatabaseSync } from "node:sqlite";

import {
  BEGIN_TRANSACTION,
  CHECK_DATABASE_INTEGRITY,
  CHECK_FOREIGN_KEYS,
  COMMIT_TRANSACTION,
  ENABLE_FOREIGN_KEYS,
  INSERT_KILOMETRIC_POINT,
  INSERT_RAILWAY_SECTION,
  ROLLBACK_TRANSACTION,
  SELECT_DATABASE_COUNTS,
  SET_SCHEMA_VERSION,
  VACUUM_DATABASE,
} from "./queries.mjs";
import {
  KILOMETRIC_POINTS_SCHEMA,
  RAILWAY_SECTIONS_SCHEMA,
} from "./schema.mjs";

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

export function completeRailwaySections(geojsonSections, milestones) {
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
  return [...sections.values()].sort(
    (left, right) =>
      left.code.localeCompare(right.code) || left.rank - right.rank,
  );
}

function insertRailwaySections(database, sections) {
  const statement = database.prepare(INSERT_RAILWAY_SECTION);
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
  const statement = database.prepare(INSERT_KILOMETRIC_POINT);
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

function populateDatabase(database, sections, milestones) {
  database.exec(BEGIN_TRANSACTION);
  try {
    database.exec(RAILWAY_SECTIONS_SCHEMA);
    database.exec(KILOMETRIC_POINTS_SCHEMA);
    insertRailwaySections(database, sections);
    insertMilestones(database, milestones);
    database.exec(SET_SCHEMA_VERSION);
    database.exec(COMMIT_TRANSACTION);
  } catch (cause) {
    database.exec(ROLLBACK_TRANSACTION);
    throw cause;
  }
}

export function createRailwayDatabase(databasePath, sections, milestones) {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(ENABLE_FOREIGN_KEYS);
    populateDatabase(database, sections, milestones);
    database.exec(VACUUM_DATABASE);
  } finally {
    database.close();
  }
}

export function validateRailwayDatabase(databasePath, expected) {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const integrity = database.prepare(CHECK_DATABASE_INTEGRITY).get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error("Generated database failed its integrity check");
    }
    if (database.prepare(CHECK_FOREIGN_KEYS).get() !== undefined) {
      throw new Error("Generated database contains an invalid foreign key");
    }

    const counts = database.prepare(SELECT_DATABASE_COUNTS).get();
    if (
      counts?.railway_section_count !== expected.railwaySectionCount ||
      counts?.geometry_count !== expected.geometryCount ||
      counts?.fallback_section_count !== expected.fallbackSectionCount ||
      counts?.geometry_without_milestone_count !==
        expected.geometryWithoutMilestoneCount ||
      counts?.milestone_count !== expected.milestoneCount
    ) {
      throw new Error(
        "Generated database row counts do not match their sources",
      );
    }
  } finally {
    database.close();
  }
}
