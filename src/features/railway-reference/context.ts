import { createContext } from "react";

import type { MilestoneSearchModel } from "@/features/milestones/search/contracts";
import type { RailwayMilestoneBounds } from "@shared/railway-domain/railway-milestone-bounds";
import type { RailwaySectionId } from "@shared/railway-domain/railway-section-id";

export interface RailwayReferenceModel {
  readonly findRailwayMilestoneBounds: (
    section: RailwaySectionId,
  ) => Promise<RailwayMilestoneBounds>;
  readonly milestoneSearch: MilestoneSearchModel;
}

export const RailwayReferenceContext = createContext<
  RailwayReferenceModel | undefined
>(undefined);
