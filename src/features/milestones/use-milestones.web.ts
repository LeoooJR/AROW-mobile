import { type MilestoneLoadState } from "./milestones";

export function useMilestones(): MilestoneLoadState {
  return { status: "unavailable" };
}
