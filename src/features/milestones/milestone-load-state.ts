import type { Milestone } from "@/features/milestones/milestone";

export type MilestoneLoadState =
  | { readonly status: "unavailable" }
  | { readonly status: "loading" }
  | {
      readonly milestones: readonly Milestone[];
      readonly status: "ready";
    }
  | { readonly status: "error" };
