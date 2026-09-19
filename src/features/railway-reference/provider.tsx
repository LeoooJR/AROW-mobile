import { type ReactElement, type ReactNode, useCallback, useMemo } from "react";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

import type { Milestone } from "@/features/milestones/domain/milestone";
import type {
  MilestoneLookupInput,
  MilestoneSearchState,
} from "@/features/milestones/search/contracts";
import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/railway-reference/context";
import type { MilestoneLoadState } from "@/features/railway-reference/milestone-state";
import {
  findMilestone as findMilestoneInDatabase,
  loadMilestones,
  loadSearchableRailways,
} from "@/features/railway-reference/sqlite/repository";
import useAsyncLoad from "@/features/railway-reference/use-async-load";
import railwayReferenceDatabaseAsset from "@/statics/railway_reference.sqlite";

export interface RailwayReferenceProviderProps {
  readonly children: ReactNode;
}

function RailwayReferenceDataProvider({
  children,
}: RailwayReferenceProviderProps): ReactElement {
  const database = useSQLiteContext();
  const milestoneLoad = useAsyncLoad(database, loadMilestones);
  const railwayLoad = useAsyncLoad(database, loadSearchableRailways);
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
      assetSource={{ assetId: railwayReferenceDatabaseAsset }}
      databaseName="railway_reference.sqlite"
    >
      <RailwayReferenceDataProvider>{children}</RailwayReferenceDataProvider>
    </SQLiteProvider>
  );
}
