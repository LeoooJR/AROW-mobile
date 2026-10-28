import { type ReactElement } from "react";
import type { Milestone } from "@shared/railway-domain/milestone";

import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/railway-reference/context";
import type { RailwayReferenceProviderProps } from "@/features/railway-reference/provider";

const EMPTY_POINTS: readonly Milestone[] = [];

const UNAVAILABLE_REFERENCE: RailwayReferenceModel = {
  findVisibleMilestones: async () => EMPTY_POINTS,
  findMilestoneNeighbours: async () => undefined,
  findRailwayMilestoneBounds: async () => ({}),
  milestoneSearch: {
    findMilestone: async () => undefined,
    loadRailways: () => undefined,
    state: { status: "unavailable" },
  },
};

export default function RailwayReferenceProvider({
  children,
}: RailwayReferenceProviderProps): ReactElement {
  return (
    <RailwayReferenceContext.Provider value={UNAVAILABLE_REFERENCE}>
      {children}
    </RailwayReferenceContext.Provider>
  );
}
