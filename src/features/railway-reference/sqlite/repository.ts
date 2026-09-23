import type { SQLiteDatabase } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/domain/milestone";
import { Milestone as MilestoneValue } from "@/features/milestones/domain/milestone";
import type { MilestoneLookupInput } from "@/features/milestones/search/contracts";
import { searchableSectionRowsToRailways } from "@/features/railway-reference/sqlite/railway-assembly";
import {
  FIND_MILESTONE_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "@/features/railway-reference/sqlite/queries";
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

export async function loadSearchableRailways(
  database: Pick<SQLiteDatabase, "getAllAsync">,
): Promise<readonly Railway[]> {
  const records = await database.getAllAsync<unknown>(
    LOAD_SEARCHABLE_RAILWAYS_QUERY,
  );
  return searchableSectionRowsToRailways(records);
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
