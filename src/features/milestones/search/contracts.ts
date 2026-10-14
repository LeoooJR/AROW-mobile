import type { Milestone } from "@/features/milestones/domain/milestone";
import type { RailwaySearchState } from "@/features/railways/search/contracts";

export interface MilestoneLookupInput {
  readonly lineCode: string;
  readonly positionMeters: number;
  readonly sectionRank: number;
}

export interface MilestoneSearchModel {
  readonly findMilestone: (
    input: MilestoneLookupInput,
  ) => Promise<Milestone | undefined>;
  readonly loadRailways: () => void;
  readonly state: RailwaySearchState;
}

export type MilestoneResolution =
  | { readonly status: "incomplete" }
  | { readonly status: "loading" }
  | { readonly message: string; readonly status: "error" }
  | { readonly milestone: Milestone; readonly status: "ready" };

export type MilestoneInputResolution =
  | { readonly status: "incomplete" }
  | { readonly message: string; readonly status: "error" }
  | { readonly positionMeters: number; readonly status: "ready" };
