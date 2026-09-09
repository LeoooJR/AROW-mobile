import type { SQLiteDatabase } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/milestone";
import { MilestoneRecord } from "@/features/milestones/milestone-query-record";
import type { MilestoneLookupInput } from "@/features/milestones/milestone-search";
import {
  FIND_MILESTONE_QUERY,
  LOAD_MILESTONES_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "@/features/milestones/railway-reference-queries";
import {
  SearchableRailwaySectionRecord,
  searchableRailwaySectionRecordsToRailways,
} from "@/features/milestones/searchable-railway-section-record";
import type { Railway } from "@/features/railways/railway";

export async function loadMilestones(
  database: Pick<SQLiteDatabase, "getAllAsync">,
): Promise<readonly Milestone[]> {
  const records = await database.getAllAsync<unknown>(LOAD_MILESTONES_QUERY);
  return records.map((record, index) =>
    MilestoneRecord.fromUnknown(record, `at row ${index}`).toMilestone(),
  );
}

export async function loadSearchableRailways(
  database: Pick<SQLiteDatabase, "getAllAsync">,
): Promise<readonly Railway[]> {
  const records = await database.getAllAsync<unknown>(
    LOAD_SEARCHABLE_RAILWAYS_QUERY,
  );
  return searchableRailwaySectionRecordsToRailways(
    records.map((record, index) =>
      SearchableRailwaySectionRecord.fromUnknown(record, `at row ${index}`),
    ),
  );
}

export async function findMilestone(
  database: Pick<SQLiteDatabase, "getFirstAsync">,
  input: MilestoneLookupInput,
): Promise<Milestone | undefined> {
  const record = await database.getFirstAsync<unknown>(
    FIND_MILESTONE_QUERY,
    input.lineCode,
    input.sectionRank,
    input.positionMeters,
  );
  return record === null
    ? undefined
    : MilestoneRecord.fromUnknown(record, "lookup result").toMilestone();
}
