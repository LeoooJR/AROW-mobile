import { useEffect, useState } from "react";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { MapViewport } from "@/types/map-viewport";
import { milestoneDisplayInterval } from "./railway-reference/milestone-display";
import { normalizedViewportBounds } from "@/components/adapters/map/viewport";
import { useRailwayReference } from "./use-railway-reference";

const EMPTY_POINTS: readonly Milestone[] = [];

export function useVisibleMilestones(
  viewport: MapViewport | undefined,
  visible: boolean,
): readonly Milestone[] {
  const { findVisibleMilestones } = useRailwayReference();
  const [points, setPoints] = useState(EMPTY_POINTS);
  useEffect(() => {
    const bounds =
      viewport === undefined || !visible
        ? undefined
        : normalizedViewportBounds(viewport.bounds);
    const interval =
      viewport === undefined
        ? undefined
        : milestoneDisplayInterval(viewport.zoom);
    if (bounds === undefined || interval === undefined) {
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      void findVisibleMilestones(bounds, interval).then(
        (rows) => {
          if (active) setPoints(rows);
        },
        (error) => {
          if (active) {
            setPoints(EMPTY_POINTS);
            console.warn("Unable to load visible railway points", error);
          }
        },
      );
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [findVisibleMilestones, viewport, visible]);
  return viewport === undefined ||
    !visible ||
    milestoneDisplayInterval(viewport.zoom) === undefined ||
    normalizedViewportBounds(viewport.bounds) === undefined
    ? EMPTY_POINTS
    : points;
}
