import { type MilestoneState } from "./milestones";

export function useMilestones(): MilestoneState {
  return { status: "unavailable" };
}
