import { useCallback, useEffect, useRef, useState } from "react";
import type { Milestone } from "@shared/railway-domain/milestone";
import type { MilestoneNeighbours } from "@shared/railway-domain/milestone-neighbours";
import type { RailwayReferenceModel } from "@/features/railway-reference/context";

type Direction = "previous" | "next";
type State = {
  readonly id: string;
  readonly status: "loading" | "ready" | "error";
  readonly neighbours?: MilestoneNeighbours;
};

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
  const [state, setState] = useState<State>();
  const generation = useRef(0);
  const pending = useRef(false);
  const transitioned = useRef(false);
  const load = useCallback(
    async (direction?: Direction) => {
      if (milestone === undefined || pending.current || transitioned.current)
        return;
      const request = ++generation.current;
      pending.current = true;
      setState({ id: milestone.id.value, status: "loading" });
      try {
        const neighbours = await findNeighbours(milestone.id);
        if (request !== generation.current) return;
        setState({ id: milestone.id.value, status: "ready", neighbours });
        const target =
          direction === undefined ? undefined : neighbours?.[direction];
        if (target !== undefined) {
          transitioned.current = true;
          onNavigate(target);
        }
      } catch {
        if (request !== generation.current) return;
        setState({ id: milestone.id.value, status: "error" });
        onFailure();
      } finally {
        if (request === generation.current) pending.current = false;
      }
    },
    [milestone, findNeighbours, onNavigate, onFailure],
  );

  useEffect(() => {
    let active = true;
    const lifecycle = generation;
    transitioned.current = false;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      ++lifecycle.current;
      pending.current = false;
    };
  }, [load]);

  const current =
    milestone !== undefined && state?.id === milestone.id.value
      ? state
      : undefined;
  const navigate = (direction: Direction) => {
    if (pending.current || transitioned.current) return;
    if (current?.status === "error") void load(direction);
    else if (current?.status === "ready") {
      const target = current.neighbours?.[direction];
      if (target !== undefined) {
        transitioned.current = true;
        onNavigate(target);
      }
    }
  };
  return {
    neighbours: current?.status === "ready" ? current.neighbours : undefined,
    loading: current === undefined || current.status === "loading",
    retryable: current?.status === "error",
    onPrevious: () => navigate("previous"),
    onNext: () => navigate("next"),
  };
}
