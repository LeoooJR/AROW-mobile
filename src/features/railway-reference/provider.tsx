import {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  findMilestone as findMilestoneInDatabase,
  loadSearchableRailways,
} from "@/features/railway-reference/sqlite/repository";
import railwayReferenceDatabaseAsset from "@/statics/railway_reference.sqlite";

export interface RailwayReferenceProviderProps {
  readonly children: ReactNode;
}

function RailwayReferenceDataProvider({
  children,
}: RailwayReferenceProviderProps): ReactElement {
  const database = useSQLiteContext();
  const [searchState, setSearchState] = useState<MilestoneSearchState>({
    status: "idle",
  });
  const catalogLoadStarted = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const loadRailways = useCallback((): void => {
    if (catalogLoadStarted.current) {
      return;
    }
    catalogLoadStarted.current = true;
    setSearchState({ status: "loading" });
    void loadSearchableRailways(database).then(
      (railways) => {
        if (mounted.current) {
          setSearchState({ railways, status: "ready" });
        }
      },
      () => {
        if (mounted.current) {
          setSearchState({ status: "error" });
        }
      },
    );
  }, [database]);
  const findMilestone = useCallback(
    (input: MilestoneLookupInput): Promise<Milestone | undefined> =>
      findMilestoneInDatabase(database, input),
    [database],
  );
  const value = useMemo<RailwayReferenceModel>(
    () => ({
      milestoneSearch: { findMilestone, loadRailways, state: searchState },
    }),
    [findMilestone, loadRailways, searchState],
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
