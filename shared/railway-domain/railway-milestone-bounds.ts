import type { Milestone } from "./milestone";

/** Located recorded endpoints; a single-point section shares the same milestone. */
export interface RailwayMilestoneBounds {
  readonly first?: Milestone;
  readonly last?: Milestone;
}
