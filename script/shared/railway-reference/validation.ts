import { isCanonicalRailwayLineCode } from "../../../shared/railway-domain/line-code";
import {
  isFiniteNumberInRange,
  isNonEmptyString,
  isPositiveInteger,
} from "../../../shared/value-validation";

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
