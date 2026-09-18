import { DatabaseSync } from "node:sqlite";
import type { SQLOutputValue } from "node:sqlite";

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
} from "./queries";
import { KILOMETRIC_POINTS_SCHEMA, RAILWAY_SECTIONS_SCHEMA } from "./schema";
import type {
  GenerationSummary,
  Milestone,
  RailwaySection,
  RailwaySectionWithGeometry,
  RailwaySectionWithoutGeometry,
} from "./types";

interface DatabaseCounts {
  readonly fallbackSectionCount: number;
  readonly geometryCount: number;
  readonly geometryWithoutMilestoneCount: number;
  readonly milestoneCount: number;
  readonly railwaySectionCount: number;
}

function fallbackRailwaySection(
  milestone: Milestone,
): RailwaySectionWithoutGeometry {
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

export function completeRailwaySections(
  geojsonSections: readonly RailwaySectionWithGeometry[],
  milestones: readonly Milestone[],
): readonly RailwaySection[] {
  const sections = new Map<string, RailwaySection>(
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

function insertRailwaySections(
  database: DatabaseSync,
  sections: readonly RailwaySection[],
): void {
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

function insertMilestones(
  database: DatabaseSync,
  milestones: readonly Milestone[],
): void {
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

function populateDatabase(
  database: DatabaseSync,
  sections: readonly RailwaySection[],
  milestones: readonly Milestone[],
): void {
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

export function createRailwayDatabase(
  databasePath: string,
  sections: readonly RailwaySection[],
  milestones: readonly Milestone[],
): void {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(ENABLE_FOREIGN_KEYS);
    populateDatabase(database, sections, milestones);
    database.exec(VACUUM_DATABASE);
  } finally {
    database.close();
  }
}

function requireCount(
  value: SQLOutputValue | undefined,
  column: string,
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Generated database returned an invalid ${column}`);
  }
  return value;
}

function databaseCounts(
  row: Record<string, SQLOutputValue> | undefined,
): DatabaseCounts {
  if (row === undefined) {
    throw new Error("Generated database did not return row counts");
  }
  return Object.freeze({
    fallbackSectionCount: requireCount(
      row.fallback_section_count,
      "fallback section count",
    ),
    geometryCount: requireCount(row.geometry_count, "geometry count"),
    geometryWithoutMilestoneCount: requireCount(
      row.geometry_without_milestone_count,
      "geometry without milestone count",
    ),
    milestoneCount: requireCount(row.milestone_count, "milestone count"),
    railwaySectionCount: requireCount(
      row.railway_section_count,
      "railway section count",
    ),
  });
}

export function validateRailwayDatabase(
  databasePath: string,
  expected: GenerationSummary,
): void {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const integrity = database.prepare(CHECK_DATABASE_INTEGRITY).get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error("Generated database failed its integrity check");
    }
    if (database.prepare(CHECK_FOREIGN_KEYS).get() !== undefined) {
      throw new Error("Generated database contains an invalid foreign key");
    }

    const counts = databaseCounts(
      database.prepare(SELECT_DATABASE_COUNTS).get(),
    );
    if (
      counts.railwaySectionCount !== expected.railwaySectionCount ||
      counts.geometryCount !== expected.geometryCount ||
      counts.fallbackSectionCount !== expected.fallbackSectionCount ||
      counts.geometryWithoutMilestoneCount !==
        expected.geometryWithoutMilestoneCount ||
      counts.milestoneCount !== expected.milestoneCount
    ) {
      throw new Error(
        "Generated database row counts do not match their sources",
      );
    }
  } finally {
    database.close();
  }
}
