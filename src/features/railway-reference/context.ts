import { createContext } from "react";

import type { MilestoneSearchModel } from "@/features/milestones/search/contracts";
import type { Milestone } from "@/features/milestones/domain/milestone";
import type { RailwaySectionKey } from "@shared/railway-reference/values";

export interface RailwayMilestoneBounds {
  readonly first?: Milestone;
  readonly last?: Milestone;
}

export interface RailwayReferenceModel {
  readonly findRailwayMilestoneBounds: (
    section: RailwaySectionKey,
  ) => Promise<RailwayMilestoneBounds>;
  readonly milestoneSearch: MilestoneSearchModel;
}

export const RailwayReferenceContext = createContext<
  RailwayReferenceModel | undefined
>(undefined);
