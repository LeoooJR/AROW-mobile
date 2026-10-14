import type { SQLiteDatabase } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/domain/milestone";
import type { MilestoneLookupInput } from "@/features/milestones/search/contracts";
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
import type { Railway } from "@/features/railways/domain/railway";
import type { RailwaySectionKey } from "@shared/railway-reference/values";
import type { RailwayMilestoneBounds } from "@/features/railway-reference/context";

export async function findRailwayMilestoneBounds(
  database: Pick<SQLiteDatabase, "getAllAsync">,
  section: RailwaySectionKey,
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
  input: MilestoneLookupInput,
): Promise<Milestone | undefined> {
  const record = await readMilestoneRow(database, input);
  return record === null
    ? undefined
    : milestoneFromDatabaseRow(record, "lookup result");
}
