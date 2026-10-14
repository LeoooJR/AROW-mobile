import type { SQLiteDatabase } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/domain/milestone";
import { Milestone as MilestoneValue } from "@/features/milestones/domain/milestone";
import type { MilestoneLookupInput } from "@/features/milestones/search/contracts";
import { searchableSectionRowsToRailways } from "@/features/railway-reference/sqlite/railway-assembly";
import {
  FIND_MILESTONE_QUERY,
  FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "@/features/railway-reference/sqlite/queries";
import type { Railway } from "@/features/railways/domain/railway";
import { decodeKilometricPointDatabaseRow } from "@shared/railway-reference/records";
import type { RailwaySectionKey } from "@shared/railway-reference/values";
import type { RailwayMilestoneBounds } from "@/features/railway-reference/context";

export async function findRailwayMilestoneBounds(
  database: Pick<SQLiteDatabase, "getAllAsync">,
  section: RailwaySectionKey,
): Promise<RailwayMilestoneBounds> {
  const records = await database.getAllAsync<unknown>(
    FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
    section.lineCode,
    section.sectionRank,
    section.lineCode,
    section.sectionRank,
    section.lineCode,
    section.sectionRank,
  );
  const points = records.map((row) =>
    milestoneFromDatabaseRow(row, "section boundary"),
  );
  return { first: points[0], last: points.at(-1) };
}

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
