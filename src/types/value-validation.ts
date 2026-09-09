export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

export function isUnsignedInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

export function isFiniteNumberInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

export function isLatitude(value: unknown): value is number {
  return isFiniteNumberInRange(value, -90, 90);
}

export function isLongitude(value: unknown): value is number {
  return isFiniteNumberInRange(value, -180, 180);
}
