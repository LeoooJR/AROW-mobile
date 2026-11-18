import { DatabaseSync } from "node:sqlite";

import type {
  KilometricPointDatabaseRow,
  RailwaySectionDatabaseRow,
} from "../../../shared/railway-reference/records";

import {
  createTableSql,
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
} from "../../../shared/railway-reference/schema";

import { RailwaySectionId } from "../../../shared/railway-domain/railway-section-id";

import { milestoneRowsBySection } from "./milestone-metadata";

import {
  BEGIN_TRANSACTION,
  ANALYZE_DATABASE,
  CREATE_POINT_DISPLAY_INDEX,
  COMMIT_TRANSACTION,
  ENABLE_FOREIGN_KEYS,
  INSERT_KILOMETRIC_POINT,
  INSERT_RAILWAY_SECTION,
  ROLLBACK_TRANSACTION,
  SET_SCHEMA_VERSION,
  VACUUM_DATABASE,
} from "./queries";

import type { Milestone } from "./types";
import type {
  RailwaySection,
  RailwaySectionWithGeometry,
  RailwaySectionWithoutGeometry,
} from "../../shared/railway-reference/types";

function fallbackRailwaySection(
  milestone: Milestone,
  lineName?: string,
): RailwaySectionWithoutGeometry {
  return Object.freeze({
    code: milestone.code,
    gaiaId: null,
    hasGeometry: 0,
    name: lineName ?? `Ligne ${milestone.code}`,
    railwayType: null,
    rank: milestone.rank,
  });
}

export function completeRailwaySections(
  geojsonSections: readonly RailwaySectionWithGeometry[],
  milestones: readonly Milestone[],
): readonly RailwaySection[] {
  const lineNames = new Map(
    geojsonSections.map((section) => [section.code, section.name]),
  );
  const sections = new Map<string, RailwaySection>(
    geojsonSections.map((section) => [
      new RailwaySectionId(section.code, section.rank).value,
      section,
    ]),
  );
  for (const milestone of milestones) {
    const id = new RailwaySectionId(milestone.code, milestone.rank).value;
    if (!sections.has(id)) {
      sections.set(
        id,
        fallbackRailwaySection(milestone, lineNames.get(milestone.code)),
      );
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
  points: ReadonlyMap<string, readonly KilometricPointDatabaseRow[]>,
): void {
  const statement = database.prepare(INSERT_RAILWAY_SECTION);
  for (const section of sections) {
    const sectionPoints =
      points.get(new RailwaySectionId(section.code, section.rank).value) ?? [];
    const milestoneCount = sectionPoints.length;
    const endpoints = {
      first_recorded_position_m: sectionPoints[0]?.position_m ?? null,
      last_recorded_position_m: sectionPoints.at(-1)?.position_m ?? null,
    };
    const row: RailwaySectionDatabaseRow =
      section.hasGeometry === 1
        ? {
            code_ligne: section.code,
            has_geometry: 1,
            idgaia: section.gaiaId,
            lib_ligne: section.name,
            milestone_count: milestoneCount,
            ...endpoints,
            rg_troncon: section.rank,
            type_ligne: section.railwayType,
          }
        : {
            code_ligne: section.code,
            has_geometry: 0,
            idgaia: null,
            lib_ligne: section.name,
            milestone_count: milestoneCount,
            ...endpoints,
            rg_troncon: section.rank,
            type_ligne: null,
          };
    statement.run(
      row.code_ligne,
      row.rg_troncon,
      row.idgaia,
      row.lib_ligne,
      row.type_ligne,
      row.first_recorded_position_m,
      row.last_recorded_position_m,
      row.has_geometry,
      row.milestone_count,
    );
  }
}

function insertMilestones(
  database: DatabaseSync,
  groups: ReadonlyMap<string, readonly KilometricPointDatabaseRow[]>,
): void {
  const statement = database.prepare(INSERT_KILOMETRIC_POINT);
  for (const rows of groups.values()) {
    for (const row of rows) {
      statement.run(
        row.code_ligne,
        row.rg_troncon,
        row.position_m,
        row.label,
        row.latitude,
        row.longitude,
        row.position_in_section,
        row.visibility_class,
      );
    }
  }
}

function populateDatabase(
  database: DatabaseSync,
  sections: readonly RailwaySection[],
  milestones: readonly Milestone[],
): void {
  database.exec(BEGIN_TRANSACTION);
  try {
    const points = milestoneRowsBySection(milestones);
    database.exec(createTableSql(RAILWAY_SECTIONS_TABLE));
    database.exec(createTableSql(KILOMETRIC_POINTS_TABLE));
    insertRailwaySections(database, sections, points);
    insertMilestones(database, points);
    database.exec(CREATE_POINT_DISPLAY_INDEX);
    database.exec(ANALYZE_DATABASE);
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
