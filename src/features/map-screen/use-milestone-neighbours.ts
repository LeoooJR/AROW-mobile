import { useEffect, useRef } from "react";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { MilestoneNeighbours } from "@shared/railway-domain/milestone-neighbours";
import type { RailwayReferenceModel } from "@/features/railway-reference/context";
import { useSelectionLookup } from "./use-selection-lookup";

type Direction = "previous" | "next";

export interface MilestoneNavigationModel {
  readonly neighbours?: MilestoneNeighbours;
  readonly loading?: boolean;
  readonly retryable?: boolean;
  readonly onPrevious?: () => void;
  readonly onNext?: () => void;
}

export function useMilestoneNeighbours(
  milestone: Milestone | undefined,
  findNeighbours: RailwayReferenceModel["findMilestoneNeighbours"],
  onNavigate: (milestone: Milestone) => void,
  onFailure: () => void,
): MilestoneNavigationModel {
  const { state, run } = useSelectionLookup(
    milestone?.id,
    findNeighbours,
    onFailure,
  );
  const transitioned = useRef(false);
  useEffect(() => {
    transitioned.current = false;
  }, [milestone, findNeighbours, onNavigate, onFailure]);

  const navigate = (direction: Direction) => {
    if (transitioned.current) return;
    run((neighbours) => {
      const target = neighbours?.[direction];
      if (target !== undefined) {
        transitioned.current = true;
        onNavigate(target);
      }
    });
  };
  return {
    neighbours: state.status === "ready" ? state.data : undefined,
    loading: state.status === "loading",
    retryable: state.status === "error",
    onPrevious: () => navigate("previous"),
    onNext: () => navigate("next"),
  };
}
