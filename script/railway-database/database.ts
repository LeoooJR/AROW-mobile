import { DatabaseSync } from "node:sqlite";
import type { SQLOutputValue } from "node:sqlite";

import type {
  KilometricPointDatabaseRow,
  RailwaySectionDatabaseRow,
} from "../../shared/railway-reference/records";
import {
  createTableSql,
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
} from "../../shared/railway-reference/schema";
import { railwaySectionId } from "../../shared/railway-reference/values";

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
      railwaySectionId(section.code, section.rank),
      section,
    ]),
  );
  for (const milestone of milestones) {
    const id = railwaySectionId(milestone.code, milestone.rank);
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
    const row: RailwaySectionDatabaseRow =
      section.hasGeometry === 1
        ? {
            code_ligne: section.code,
            has_geometry: 1,
            idgaia: section.gaiaId,
            lib_ligne: section.name,
            pkd: section.startMilestone,
            pkf: section.endMilestone,
            rg_troncon: section.rank,
            type_ligne: section.railwayType,
          }
        : {
            code_ligne: section.code,
            has_geometry: 0,
            idgaia: null,
            lib_ligne: section.name,
            pkd: null,
            pkf: null,
            rg_troncon: section.rank,
            type_ligne: null,
          };
    statement.run(
      row.code_ligne,
      row.rg_troncon,
      row.idgaia,
      row.lib_ligne,
      row.type_ligne,
      row.pkd,
      row.pkf,
      row.has_geometry,
    );
  }
}

function insertMilestones(
  database: DatabaseSync,
  milestones: readonly Milestone[],
): void {
  const statement = database.prepare(INSERT_KILOMETRIC_POINT);
  for (const milestone of milestones) {
    const row: KilometricPointDatabaseRow = {
      code_ligne: milestone.code,
      label: milestone.label,
      latitude: milestone.latitude,
      longitude: milestone.longitude,
      position_m: milestone.positionMeters,
      rg_troncon: milestone.rank,
    };
    statement.run(
      row.code_ligne,
      row.rg_troncon,
      row.position_m,
      row.label,
      row.latitude,
      row.longitude,
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
    database.exec(createTableSql(RAILWAY_SECTIONS_TABLE));
    database.exec(createTableSql(KILOMETRIC_POINTS_TABLE));
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
