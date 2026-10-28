import { createContext } from "react";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { MapViewport } from "@/types/map-viewport";
import type { MilestoneDisplayInterval } from "./milestone-display";
import type { MilestoneId } from "@shared/railway-domain/milestone-id";
import type { MilestoneNeighbours } from "@shared/railway-domain/milestone-neighbours";

import type { MilestoneSearchModel } from "@/features/railway-reference/search/contracts";
import type { RailwayMilestoneBounds } from "@shared/railway-domain/railway-milestone-bounds";
import type { RailwaySectionId } from "@shared/railway-domain/railway-section-id";

export interface RailwayReferenceModel {
  readonly findVisibleMilestones: (
    bounds: MapViewport["bounds"],
    interval: MilestoneDisplayInterval,
  ) => Promise<readonly Milestone[]>;
  readonly findMilestoneNeighbours: (
    id: MilestoneId,
  ) => Promise<MilestoneNeighbours | undefined>;
  readonly findRailwayMilestoneBounds: (
    section: RailwaySectionId,
  ) => Promise<RailwayMilestoneBounds>;
  readonly milestoneSearch: MilestoneSearchModel;
}

export const RailwayReferenceContext = createContext<
  RailwayReferenceModel | undefined
>(undefined);
