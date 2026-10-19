import type { RailwayMilestoneBounds } from "@shared/railway-domain/railway-milestone-bounds";
import type { RailwayReferenceModel } from "@/features/railway-reference/context";
import type { RailwaySection } from "@shared/railway-domain/railway-section";
import type { GeographicCoordinates } from "@shared/geographic-coordinates";
import { useSelectionLookup } from "./use-selection-lookup";

type Boundary = "first" | "last";

export interface RailwayMilestoneBoundsModel {
  readonly bounds?: RailwayMilestoneBounds;
  readonly loading: boolean;
  readonly retryable: boolean;
  readonly onFirst: () => void;
  readonly onLast: () => void;
}

export function useRailwayMilestoneBounds(
  section: RailwaySection | undefined,
  findBounds: RailwayReferenceModel["findRailwayMilestoneBounds"],
  onFocus: (coordinates: GeographicCoordinates) => void,
  onFailure: () => void,
): RailwayMilestoneBoundsModel {
  const { state, run } = useSelectionLookup(section?.id, findBounds, onFailure);
  const focus = (boundary: Boundary) => {
    run((bounds) => {
      const point = bounds?.[boundary];
      if (point !== undefined) onFocus(point.coordinates);
    });
  };
  return {
    bounds: state.status === "ready" ? state.data : undefined,
    loading: state.status === "loading",
    retryable: state.status === "error",
    onFirst: () => focus("first"),
    onLast: () => focus("last"),
  };
}
