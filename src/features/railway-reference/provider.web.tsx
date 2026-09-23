import { type ReactElement } from "react";

import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/railway-reference/context";
import type { RailwayReferenceProviderProps } from "@/features/railway-reference/provider";

const UNAVAILABLE_REFERENCE: RailwayReferenceModel = {
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
