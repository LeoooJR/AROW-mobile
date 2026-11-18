import { canonicalRailwayLineCode } from "../../../shared/railway-domain/line-code";
import { parseMilestoneLabel } from "../../../shared/railway-domain/kilometric-position";

export function milestonePositionMeters(
  label: string,
  context: string,
): number {
  const parsed = parseMilestoneLabel(label);
  if (parsed === undefined) {
    throw new Error(`${context} must use the kilometre+metric format`);
  }

  return parsed.positionMeters;
}

export function canonicalLineCode(value: unknown, context: string): string {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 999_999
  ) {
    throw new Error(`${context} must be an integer between 0 and 999999`);
  }

  return canonicalRailwayLineCode(value);
}
