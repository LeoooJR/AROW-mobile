import type { SQLiteDatabase } from "expo-sqlite";
import type { MapViewport } from "@/types/map-viewport";
import { normalizeLongitude } from "@/utils/angle";
import { hasValidViewportBounds } from "@/components/adapters/map/map-viewport";
import {
  milestoneDisplayInterval,
  type MilestoneDisplayInterval,
} from "./milestone-display";
import type { Milestone } from "@shared/railway-domain/milestone";
import { milestoneFromDatabaseRow } from "./mapping/milestone-mapper";
import {
  FIND_VISIBLE_MILESTONES_QUERY,
  FIND_WRAPPED_VISIBLE_MILESTONES_QUERY,
} from "./sqlite/queries";

export function markerBounds(
  viewport: MapViewport,
): MapViewport["bounds"] | undefined {
  const [west, south, east, north] = viewport.bounds;
  if (
    milestoneDisplayInterval(viewport.zoom) === undefined ||
    !hasValidViewportBounds(viewport.bounds)
  )
    return undefined;
  if (Math.abs(east - west) >= 360) return [-180, south, 180, north];
  return [normalizeLongitude(west), south, normalizeLongitude(east), north];
}

export async function findVisibleMilestones(
  database: Pick<SQLiteDatabase, "getAllAsync">,
  bounds: MapViewport["bounds"],
  intervalMeters: MilestoneDisplayInterval,
): Promise<readonly Milestone[]> {
  const [west, south, east, north] = bounds;
  const rows = await database.getAllAsync<unknown>(
    west <= east
      ? FIND_VISIBLE_MILESTONES_QUERY
      : FIND_WRAPPED_VISIBLE_MILESTONES_QUERY,
    south,
    north,
    west,
    east,
    intervalMeters,
  );
  return rows.map((row) => milestoneFromDatabaseRow(row, "visible map point"));
}
