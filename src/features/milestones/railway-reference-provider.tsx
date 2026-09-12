import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/milestone";
import type { MilestoneLoadState } from "@/features/milestones/milestone-load-state";
import type {
  MilestoneLookupInput,
  MilestoneSearchState,
} from "@/features/milestones/milestone-search";
import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/milestones/railway-reference-context";
import {
  findMilestone as findMilestoneInDatabase,
  loadMilestones,
  loadSearchableRailways,
} from "@/features/milestones/railway-reference-database";
import useRailwayReferenceLoad from "@/features/milestones/use-railway-reference-load";
import milestoneDatabaseAsset from "@/statics/pk.sqlite";

export interface RailwayReferenceProviderProps {
  readonly children: ReactNode;
}

function RailwayReferenceDataProvider({
  children,
}: RailwayReferenceProviderProps): ReactElement {
  const database = useSQLiteContext();
  const milestoneLoad = useRailwayReferenceLoad(database, loadMilestones);
  const railwayLoad = useRailwayReferenceLoad(database, loadSearchableRailways);
  const milestoneState = useMemo<MilestoneLoadState>(
    () =>
      milestoneLoad.status === "ready"
        ? { milestones: milestoneLoad.value, status: "ready" }
        : milestoneLoad,
    [milestoneLoad],
  );
  const searchState = useMemo<MilestoneSearchState>(
    () =>
      railwayLoad.status === "ready"
        ? { railways: railwayLoad.value, status: "ready" }
        : railwayLoad,
    [railwayLoad],
  );
  const findMilestone = useCallback(
    (input: MilestoneLookupInput): Promise<Milestone | undefined> =>
      findMilestoneInDatabase(database, input),
    [database],
  );
  const value = useMemo<RailwayReferenceModel>(
    () => ({
      milestoneSearch: { findMilestone, state: searchState },
      milestoneState,
    }),
    [findMilestone, milestoneState, searchState],
  );

  return (
    <RailwayReferenceContext.Provider value={value}>
      {children}
    </RailwayReferenceContext.Provider>
  );
}

export default function RailwayReferenceProvider({
  children,
}: RailwayReferenceProviderProps): ReactElement {
  return (
    <SQLiteProvider
      assetSource={{ assetId: milestoneDatabaseAsset }}
      databaseName="railway-reference-v1.sqlite"
    >
      <RailwayReferenceDataProvider>{children}</RailwayReferenceDataProvider>
    </SQLiteProvider>
  );
}
