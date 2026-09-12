import { type ReactElement } from "react";

import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/milestones/railway-reference-context";
import type { RailwayReferenceProviderProps } from "@/features/milestones/railway-reference-provider";

const UNAVAILABLE_REFERENCE: RailwayReferenceModel = {
  milestoneSearch: {
    findMilestone: async () => undefined,
    state: { status: "unavailable" },
  },
  milestoneState: { status: "unavailable" },
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
