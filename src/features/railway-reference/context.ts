import { createContext } from "react";

import type { MilestoneSearchModel } from "@/features/milestones/search/contracts";

export interface RailwayReferenceModel {
  readonly milestoneSearch: MilestoneSearchModel;
}

export const RailwayReferenceContext = createContext<
  RailwayReferenceModel | undefined
>(undefined);
