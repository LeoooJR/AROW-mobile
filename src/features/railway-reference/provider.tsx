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

import type { Milestone } from "@shared/railway-domain/milestone";
import type { MilestoneId } from "@shared/railway-domain/milestone-id";
import type { RailwaySearchState } from "@/features/railway-reference/search/contracts";
import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/railway-reference/context";
import {
  findMilestone as findMilestoneInDatabase,
  findMilestoneNeighbours as findNeighboursInDatabase,
  findRailwayMilestoneBounds as findBoundsInDatabase,
  findVisibleMilestones as findVisibleInDatabase,
  loadSearchableRailways,
} from "@/features/railway-reference/repository";
import railwayReferenceDatabaseAsset from "@/statics/railway_reference.sqlite";
import { RAILWAY_REFERENCE_DATABASE_NAME } from "@shared/railway-reference/database-version";
import type { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import type { MapViewport } from "@/types/map-viewport";
import type { MilestoneDisplayInterval } from "./milestone-display";

export interface RailwayReferenceProviderProps {
  readonly children: ReactNode;
  readonly onError?: (error: Error) => void;
}

function RailwayReferenceDataProvider({
  children,
}: RailwayReferenceProviderProps): ReactElement {
  const database = useSQLiteContext();
  const [searchState, setSearchState] = useState<RailwaySearchState>({
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
    (input: MilestoneId): Promise<Milestone | undefined> =>
      findMilestoneInDatabase(database, input),
    [database],
  );
  const findRailwayMilestoneBounds = useCallback(
    (section: RailwaySectionId) => findBoundsInDatabase(database, section),
    [database],
  );
  const findMilestoneNeighbours = useCallback(
    (id: MilestoneId) => findNeighboursInDatabase(database, id),
    [database],
  );
  const findVisibleMilestones = useCallback(
    (bounds: MapViewport["bounds"], interval: MilestoneDisplayInterval) =>
      findVisibleInDatabase(database, bounds, interval),
    [database],
  );
  const value = useMemo<RailwayReferenceModel>(
    () => ({
      findVisibleMilestones,
      findMilestoneNeighbours,
      findRailwayMilestoneBounds,
      milestoneSearch: { findMilestone, loadRailways, state: searchState },
    }),
    [
      findMilestoneNeighbours,
      findMilestone,
      findRailwayMilestoneBounds,
      loadRailways,
      searchState,
      findVisibleMilestones,
    ],
  );

  return (
    <RailwayReferenceContext.Provider value={value}>
      {children}
    </RailwayReferenceContext.Provider>
  );
}

export default function RailwayReferenceProvider({
  children,
  onError,
}: RailwayReferenceProviderProps): ReactElement {
  // SQLiteProvider reports initialization errors during render. Defer the
  // notification so it does not update the root while a child renders.
  const reportError = useCallback(
    (error: Error) => {
      queueMicrotask(() => onError?.(error));
    },
    [onError],
  );
  return (
    <SQLiteProvider
      assetSource={{ assetId: railwayReferenceDatabaseAsset }}
      databaseName={RAILWAY_REFERENCE_DATABASE_NAME}
      onError={onError === undefined ? undefined : reportError}
    >
      <RailwayReferenceDataProvider>{children}</RailwayReferenceDataProvider>
    </SQLiteProvider>
  );
}
