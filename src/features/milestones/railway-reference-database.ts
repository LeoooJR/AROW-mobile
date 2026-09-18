import type { SQLiteDatabase } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/milestone";
import { Milestone as MilestoneValue } from "@/features/milestones/milestone";
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
import { decodeKilometricPointDatabaseRow } from "@shared/railway-reference/records";

function milestoneFromDatabaseRow(value: unknown, context: string): Milestone {
  const row = decodeKilometricPointDatabaseRow(value, context);
  return new MilestoneValue({
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    label: row.label,
    lineCode: row.code_ligne,
    positionMeters: row.position_m,
    sectionRank: row.rg_troncon,
  });
}

export async function loadMilestones(
  database: Pick<SQLiteDatabase, "getAllAsync">,
): Promise<readonly Milestone[]> {
  const records = await database.getAllAsync<unknown>(LOAD_MILESTONES_QUERY);
  return records.map((record, index) =>
    milestoneFromDatabaseRow(record, `at row ${index}`),
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
    : milestoneFromDatabaseRow(record, "lookup result");
}
