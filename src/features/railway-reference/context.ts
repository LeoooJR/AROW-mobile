import { createContext, useContext } from "react";

import type { MilestoneSearchModel } from "@/features/milestones/search/contracts";
import type { MilestoneLoadState } from "@/features/railway-reference/milestone-state";

export interface RailwayReferenceModel {
  readonly milestoneSearch: MilestoneSearchModel;
  readonly milestoneState: MilestoneLoadState;
}

export const RailwayReferenceContext = createContext<
  RailwayReferenceModel | undefined
>(undefined);

export function useRailwayReference(): RailwayReferenceModel {
  const value = useContext(RailwayReferenceContext);
  if (value === undefined) {
    throw new Error(
      "useRailwayReference must be used within RailwayReferenceProvider",
    );
  }
  return value;
}
