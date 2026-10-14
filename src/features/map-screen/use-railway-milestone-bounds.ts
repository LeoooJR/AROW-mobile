import { useCallback, useEffect, useRef, useState } from "react";

import type {
  RailwayMilestoneBounds,
  RailwayReferenceModel,
} from "@/features/railway-reference/context";
import type { RailwaySection } from "@/features/railways/domain/railway-section";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

type Boundary = "first" | "last";
type BoundsState =
  | { readonly id: string; readonly status: "loading" | "error" }
  | {
      readonly id: string;
      readonly status: "ready";
      readonly bounds: RailwayMilestoneBounds;
    };

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
  const [state, setState] = useState<BoundsState>();
  const operation = useRef(0);
  const pending = useRef(false);
  const load = useCallback(
    async (boundary?: Boundary) => {
      if (section === undefined || pending.current) return;
      const request = ++operation.current;
      pending.current = true;
      setState({ id: section.id, status: "loading" });
      try {
        const bounds = await findBounds(section.key);
        if (operation.current !== request) return;
        setState({ id: section.id, status: "ready", bounds });
        const point = boundary === undefined ? undefined : bounds[boundary];
        if (point !== undefined) onFocus(point.coordinates);
      } catch {
        if (operation.current !== request) return;
        setState({ id: section.id, status: "error" });
        onFailure();
      } finally {
        if (operation.current === request) pending.current = false;
      }
    },
    [section, findBounds, onFocus, onFailure],
  );

  useEffect(() => {
    let active = true;
    const lifecycle = operation;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      ++lifecycle.current;
      pending.current = false;
    };
  }, [load]);

  const current = state?.id === section?.id ? state : undefined;
  const bounds = current?.status === "ready" ? current.bounds : undefined;
  const focus = (boundary: Boundary) => {
    if (current?.status === "error") void load(boundary);
    else {
      const point = bounds?.[boundary];
      if (point !== undefined) onFocus(point.coordinates);
    }
  };
  return {
    bounds,
    loading: current === undefined || current.status === "loading",
    retryable: current?.status === "error",
    onFirst: () => focus("first"),
    onLast: () => focus("last"),
  };
}
