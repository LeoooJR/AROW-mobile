import type { SQLiteDatabase } from "expo-sqlite";

import type { Milestone } from "@shared/railway-domain/milestone";
import type { MilestoneId } from "@shared/railway-domain/milestone-id";
import { searchableSectionRowsToRailways } from "./mapping/railway-mapper";
import {
  milestoneFromDatabaseRow,
  milestoneRowsToBounds,
} from "./mapping/milestone-mapper";
import {
  readMilestoneRow,
  readRailwayMilestoneBoundRows,
  readSearchableRailwayRows,
} from "./sqlite/reader";
import type { Railway } from "@shared/railway-domain/railway";
import type { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import type { RailwayMilestoneBounds } from "@shared/railway-domain/railway-milestone-bounds";

export async function findRailwayMilestoneBounds(
  database: Pick<SQLiteDatabase, "getAllAsync">,
  section: RailwaySectionId,
): Promise<RailwayMilestoneBounds> {
  const records = await readRailwayMilestoneBoundRows(database, section);
  return milestoneRowsToBounds(records);
}

export async function loadSearchableRailways(
  database: Pick<SQLiteDatabase, "getAllAsync">,
): Promise<readonly Railway[]> {
  const records = await readSearchableRailwayRows(database);
  return searchableSectionRowsToRailways(records);
}

export async function findMilestone(
  database: Pick<SQLiteDatabase, "getFirstAsync">,
  input: MilestoneId,
): Promise<Milestone | undefined> {
  const record = await readMilestoneRow(database, input);
  return record === null
    ? undefined
    : milestoneFromDatabaseRow(record, "lookup result");
}
