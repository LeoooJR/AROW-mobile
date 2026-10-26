import type { SQLiteDatabase } from "expo-sqlite";

import type { MilestoneId } from "@shared/railway-domain/milestone-id";
import type { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import {
  FIND_MILESTONE_QUERY,
  FIND_PREVIOUS_MILESTONE_QUERY,
  FIND_NEXT_MILESTONE_QUERY,
  FIND_CURRENT_MILESTONE_QUERY,
  FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "./queries";

export function readPreviousMilestoneRow(
  database: Pick<SQLiteDatabase, "getFirstAsync">,
  id: MilestoneId,
): Promise<unknown | null> {
  return database.getFirstAsync<unknown>(
    FIND_PREVIOUS_MILESTONE_QUERY,
    id.lineCode,
    id.sectionRank,
    id.positionMeters,
  );
}

export function readNextMilestoneRow(
  database: Pick<SQLiteDatabase, "getFirstAsync">,
  id: MilestoneId,
): Promise<unknown | null> {
  return database.getFirstAsync<unknown>(
    FIND_NEXT_MILESTONE_QUERY,
    id.lineCode,
    id.sectionRank,
    id.positionMeters,
  );
}

export function readCurrentMilestoneRow(
  database: Pick<SQLiteDatabase, "getFirstAsync">,
  id: MilestoneId,
): Promise<unknown | null> {
  return database.getFirstAsync<unknown>(
    FIND_CURRENT_MILESTONE_QUERY,
    id.lineCode,
    id.sectionRank,
    id.positionMeters,
  );
}

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
  );
}
