import {
  canonicalRailwayLineCode,
  isCanonicalRailwayLineCode,
  parseMilestoneLabel,
} from "../../shared/railway-reference/values";
import {
  isFiniteNumberInRange,
  isNonEmptyString,
  isPositiveInteger,
} from "../../shared/value-validation";

export function requireCanonicalLineCode(
  value: unknown,
  context: string,
): string {
  if (!isCanonicalRailwayLineCode(value)) {
    throw new Error(`${context} must contain exactly six digits`);
  }

  return value;
}

export function requireNonEmptyString(value: unknown, context: string): string {
  if (!isNonEmptyString(value)) {
    throw new Error(`${context} must be a non-empty string`);
  }

  return value;
}

export function requirePositiveInteger(
  value: unknown,
  context: string,
): number {
  if (!isPositiveInteger(value)) {
    throw new Error(`${context} must be a positive integer`);
  }

  return value;
}

export function requireCoordinate(
  value: unknown,
  minimum: number,
  maximum: number,
  context: string,
): number {
  if (!isFiniteNumberInRange(value, minimum, maximum)) {
    throw new Error(`${context} is outside its geographic range`);
  }

  return value;
}

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
