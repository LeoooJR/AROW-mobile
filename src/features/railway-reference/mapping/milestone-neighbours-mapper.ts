import type { MilestoneNeighbours } from "@shared/railway-domain/milestone-neighbours";
import { isPositiveInteger, isRecord } from "@shared/value-validation";
import { milestoneFromDatabaseRow } from "./milestone-mapper";

export function milestoneRowsToNeighbours(
  currentRow: unknown | null,
  previous: unknown | null,
  next: unknown | null,
): MilestoneNeighbours | undefined {
  if (currentRow === null) return undefined;
  if (
    !isRecord(currentRow) ||
    !isPositiveInteger(currentRow.position_in_section) ||
    !isPositiveInteger(currentRow.total) ||
    currentRow.position_in_section > currentRow.total
  ) {
    throw new Error("Milestone section position result is invalid");
  }
  return {
    current: milestoneFromDatabaseRow(currentRow, "current milestone result"),
    positionInSection: currentRow.position_in_section,
    total: currentRow.total,
    previous:
      previous === null
        ? undefined
        : milestoneFromDatabaseRow(previous, "previous milestone result"),
    next:
      next === null
        ? undefined
        : milestoneFromDatabaseRow(next, "next milestone result"),
  };
}
