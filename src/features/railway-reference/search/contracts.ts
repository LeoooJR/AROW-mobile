import type { Milestone } from "@shared/railway-domain/milestone";
import type { MilestoneId } from "@shared/railway-domain/milestone-id";
import type { Railway } from "@shared/railway-domain/railway";

export type RailwaySearchState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | { readonly status: "error" }
  | {
      readonly railways: readonly Railway[];
      readonly status: "ready";
    };

export interface MilestoneSearchModel {
  readonly findMilestone: (
    input: MilestoneId,
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
