import type { SQLiteDatabase } from "expo-sqlite";

import type { MilestoneId } from "@shared/railway-domain/milestone-id";
import type { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import {
  FIND_MILESTONE_QUERY,
  FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "./queries";

export function readSearchableRailwayRows(
  database: Pick<SQLiteDatabase, "getAllAsync">,
): Promise<readonly unknown[]> {
  return database.getAllAsync<unknown>(LOAD_SEARCHABLE_RAILWAYS_QUERY);
}

export function readMilestoneRow(
  database: Pick<SQLiteDatabase, "getFirstAsync">,
  input: MilestoneId,
): Promise<unknown | null> {
  return database.getFirstAsync<unknown>(
    FIND_MILESTONE_QUERY,
    input.lineCode,
    input.sectionRank,
    input.positionMeters,
  );
}

export function readRailwayMilestoneBoundRows(
  database: Pick<SQLiteDatabase, "getAllAsync">,
  section: RailwaySectionId,
): Promise<readonly unknown[]> {
  return database.getAllAsync<unknown>(
    FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
    section.lineCode,
    section.sectionRank,
    section.lineCode,
    section.sectionRank,
    section.lineCode,
    section.sectionRank,
  );
}
