import type { Milestone } from "./milestone";

/** Adjacent recorded PKs and one-based position within the same section. */
export interface MilestoneNeighbours {
  readonly previous?: Milestone;
  readonly next?: Milestone;
  readonly current: Milestone;
  readonly positionInSection: number;
  readonly total: number;
}
