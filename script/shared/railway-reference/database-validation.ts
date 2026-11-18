import { DatabaseSync, type SQLOutputValue } from "node:sqlite";
import type { GenerationSummary } from "./types";
import { validatePointDisplayMetadata } from "./point-display-metadata";
import { validateSectionEndpoints } from "./section-endpoints";
import {
  CHECK_DATABASE_INTEGRITY,
  CHECK_FOREIGN_KEYS,
  CHECK_SCHEMA_VERSION,
  DATABASE_SCHEMA_VERSION,
  FIND_INVALID_SECTION_COUNT,
  FIND_INVALID_MILESTONE_ORDINAL,
  FIND_CONFLICTING_LINE_NAMES,
  SELECT_DATABASE_COUNTS,
} from "./queries";

interface DatabaseCounts {
  readonly fallbackSectionCount: number;
  readonly geometryCount: number;
  readonly geometryWithoutMilestoneCount: number;
  readonly milestoneCount: number;
  readonly railwaySectionCount: number;
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
    const version = database.prepare(CHECK_SCHEMA_VERSION).get();
    if (version?.user_version !== DATABASE_SCHEMA_VERSION) {
      throw new Error(
        `Generated database schema version must be ${DATABASE_SCHEMA_VERSION}`,
      );
    }
    const integrity = database.prepare(CHECK_DATABASE_INTEGRITY).get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error("Generated database failed its integrity check");
    }
    if (database.prepare(CHECK_FOREIGN_KEYS).get() !== undefined) {
      throw new Error("Generated database contains an invalid foreign key");
    }
    if (database.prepare(FIND_CONFLICTING_LINE_NAMES).get() !== undefined) {
      throw new Error(
        "Generated database contains conflicting railway line names",
      );
    }
    if (database.prepare(FIND_INVALID_SECTION_COUNT).get() !== undefined) {
      throw new Error(
        "Generated database contains an invalid section milestone count",
      );
    }
    if (database.prepare(FIND_INVALID_MILESTONE_ORDINAL).get() !== undefined) {
      throw new Error(
        "Generated database contains an invalid milestone section position",
      );
    }

    validatePointDisplayMetadata(database);
    validateSectionEndpoints(database);
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
