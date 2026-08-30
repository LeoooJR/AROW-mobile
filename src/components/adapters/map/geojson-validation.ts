import type { Position } from "geojson";

import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isCanonicalRailwayLineCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isCoordinateInRange(
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

export function geographicCoordinatesFromPosition(
  position: Position,
): GeographicCoordinates | undefined {
  if (position.length !== 2 && position.length !== 3) {
    return undefined;
  }

  const [longitude, latitude, altitude] = position;
  if (
    !isCoordinateInRange(latitude, -90, 90) ||
    !isCoordinateInRange(longitude, -180, 180) ||
    (position.length === 3 &&
      (typeof altitude !== "number" || !Number.isFinite(altitude)))
  ) {
    return undefined;
  }

  return { latitude, longitude };
}
