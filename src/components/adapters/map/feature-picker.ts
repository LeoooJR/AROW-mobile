import type {
  MapRef,
  PixelPoint,
  PixelPointBounds,
} from "@maplibre/maplibre-react-native";
import type { MapFeature } from "@/types/map-feature";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { RailwaySection } from "@shared/railway-domain/railway-section";
import { milestoneDisplayInterval } from "@/features/railway-reference/milestone-display";
import type { MapLayerVisibility } from "./layer-visibility";
import { MAP_LAYER_IDS } from "./layer-ids";
import { railwayFromFeature } from "./feature-parsing";
import {
  eligibleMilestoneCandidates,
  nearestMilestoneWithinTarget,
  type ProjectedMilestone,
} from "./milestone-hit-testing";
import {
  milestoneDotLayerId,
  milestoneHitRadius,
  RAILWAY_HIT_PADDING,
} from "./hit-policy";

export type FeatureQueryMap = Pick<
  MapRef,
  "getZoom" | "project" | "queryRenderedFeatures"
>;

export interface MapFeaturePickOptions {
  readonly point: PixelPoint;
  readonly visibility: MapLayerVisibility;
  readonly railwayAvailable: boolean;
  readonly selectedFeature?: MapFeature;
}

function boundsAround([x, y]: PixelPoint, radius: number): PixelPointBounds {
  return [
    [x - radius, y - radius],
    [x + radius, y + radius],
  ];
}

async function projectMilestones(
  map: FeatureQueryMap,
  milestones: readonly Milestone[],
): Promise<ProjectedMilestone[]> {
  return Promise.all(
    milestones.map(async (milestone) => ({
      milestone,
      point: await map.project([
        milestone.coordinates.longitude,
        milestone.coordinates.latitude,
      ]),
    })),
  );
}

async function pickMilestone(
  map: FeatureQueryMap,
  zoom: number,
  options: MapFeaturePickOptions,
  isCurrent: () => boolean,
): Promise<Milestone | undefined> {
  const selectedMilestone =
    options.selectedFeature?.kind === "milestone"
      ? options.selectedFeature
      : undefined;
  const interval = milestoneDisplayInterval(zoom);
  const radius = milestoneHitRadius(zoom, selectedMilestone !== undefined);
  if (
    interval === undefined ||
    radius === undefined ||
    !options.visibility.milestone
  )
    return undefined;

  const layers = [milestoneDotLayerId(interval)];
  if (selectedMilestone !== undefined)
    layers.push(MAP_LAYER_IDS.milestone.selected);
  const features = await map.queryRenderedFeatures(
    boundsAround(options.point, radius),
    { layers },
  );
  if (!isCurrent()) return undefined;

  const selectedId = selectedMilestone?.id.value;
  const candidates = eligibleMilestoneCandidates(
    features,
    interval,
    selectedId,
  );
  const projected = await projectMilestones(map, candidates);
  if (!isCurrent()) return undefined;

  return nearestMilestoneWithinTarget(
    projected,
    options.point,
    zoom,
    selectedId,
  );
}

async function pickRailway(
  map: FeatureQueryMap,
  zoom: number,
  options: MapFeaturePickOptions,
  isCurrent: () => boolean,
): Promise<RailwaySection | undefined> {
  if (zoom < 7 || !options.visibility.railway || !options.railwayAvailable)
    return undefined;

  const layers: string[] = [MAP_LAYER_IDS.railway.passive];
  if (options.selectedFeature !== undefined)
    layers.push(MAP_LAYER_IDS.railway.selected);
  const railways = await map.queryRenderedFeatures(
    boundsAround(options.point, RAILWAY_HIT_PADDING),
    { layers },
  );
  if (!isCurrent()) return undefined;

  return railways
    .map(railwayFromFeature)
    .find((section) => section !== undefined);
}

export async function pickMapFeature(
  map: FeatureQueryMap,
  options: MapFeaturePickOptions,
  isCurrent: () => boolean,
): Promise<MapFeature | undefined> {
  if (!options.point.every(Number.isFinite) || !isCurrent()) return undefined;

  const zoom = await map.getZoom();
  if (!Number.isFinite(zoom) || !isCurrent()) return undefined;

  const milestone = await pickMilestone(map, zoom, options, isCurrent);
  if (!isCurrent()) return undefined;

  return milestone ?? pickRailway(map, zoom, options, isCurrent);
}
