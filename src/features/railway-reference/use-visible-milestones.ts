import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { MapViewport } from "@/types/map-viewport";
import { findVisibleMilestones, markerBounds } from "./visible-milestones";

const EMPTY_POINTS: readonly Milestone[] = [];

export function useVisibleMilestones(
  viewport: MapViewport | undefined,
  visible: boolean,
): readonly Milestone[] {
  const database = useSQLiteContext();
  const [points, setPoints] = useState(EMPTY_POINTS);
  useEffect(() => {
    const bounds =
      viewport === undefined || !visible ? undefined : markerBounds(viewport);
    if (bounds === undefined) {
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      void findVisibleMilestones(database, bounds).then(
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
  }, [database, viewport, visible]);
  return viewport === undefined ||
    !visible ||
    markerBounds(viewport) === undefined
    ? EMPTY_POINTS
    : points;
}
