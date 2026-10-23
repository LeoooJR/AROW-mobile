import type { SQLiteDatabase } from "expo-sqlite";
import type { MapViewport } from "@/types/map-viewport";
import { normalizeLongitude } from "@/utils/angle";
import { hasValidViewportBounds } from "@/components/adapters/map/map-viewport";
import {
  milestoneDisplayInterval,
  MILESTONE_DISPLAY_CLASSES,
  type MilestoneDisplayInterval,
} from "./milestone-display";
import type { Milestone } from "@shared/railway-domain/milestone";
import { milestoneFromDatabaseRow } from "./mapping/milestone-mapper";
import { visibleMilestonesQuery } from "./sqlite/queries";

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
  const classes = MILESTONE_DISPLAY_CLASSES[intervalMeters];
  const rows = await database.getAllAsync<unknown>(
    visibleMilestonesQuery(classes, west > east),
    south,
    north,
    west,
    east,
    ...classes,
  );
  return rows.map((row) => milestoneFromDatabaseRow(row, "visible map point"));
}
