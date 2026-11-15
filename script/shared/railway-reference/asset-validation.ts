import { readFileSync } from "node:fs";

import { isRecord } from "../../../shared/value-validation";

import {
  DEFAULT_RAILWAY_DATABASE_PATH,
  DEFAULT_RAILWAY_GEOJSON_PATH,
  EXPECTED_RAILWAY_SNAPSHOT,
} from "./configuration";
import { validateRailwayDatabase } from "./database-validation";
import { parseRailwaySections } from "./geojson";
import type { GenerationSummary } from "./types";

const SETUP_INSTRUCTION =
  "Run `npm run database:setup` to generate the railway reference assets.";

export interface RailwayAssetValidationOptions {
  readonly databasePath?: string;
  readonly expectedSnapshot?: GenerationSummary;
  readonly geojsonPath?: string;
}

function errorMessage(cause: unknown): string | undefined {
  if (cause instanceof Error) {
    return cause.message;
  }
  return isRecord(cause) && typeof cause.message === "string"
    ? cause.message
    : undefined;
}

export function validationFailure(asset: string, cause: unknown): Error {
  const message = errorMessage(cause);
  const detail = message === undefined ? "" : ` ${message}`;
  return new Error(
    `${asset} is missing or invalid.${detail} ${SETUP_INSTRUCTION}`,
    { cause },
  );
}

function validateRailwayGeoJson(
  geojsonPath: string,
  expectedSnapshot: GenerationSummary,
): void {
  try {
    const value: unknown = JSON.parse(readFileSync(geojsonPath, "utf8"));
    const sections = parseRailwaySections(value);
    if (sections.length !== expectedSnapshot.geometryCount) {
      throw new Error(
        `Expected ${expectedSnapshot.geometryCount} railway features, received ${sections.length}.`,
      );
    }
  } catch (cause) {
    throw validationFailure("Railway GeoJSON asset", cause);
  }
}

function validateRailwaySqlite(
  databasePath: string,
  expectedSnapshot: GenerationSummary,
): void {
  try {
    validateRailwayDatabase(databasePath, expectedSnapshot);
  } catch (cause) {
    throw validationFailure("Railway SQLite asset", cause);
  }
}

export function validateBundledRailwayAssets({
  databasePath = DEFAULT_RAILWAY_DATABASE_PATH,
  expectedSnapshot = EXPECTED_RAILWAY_SNAPSHOT,
  geojsonPath = DEFAULT_RAILWAY_GEOJSON_PATH,
}: RailwayAssetValidationOptions = {}): void {
  validateRailwayGeoJson(geojsonPath, expectedSnapshot);
  validateRailwaySqlite(databasePath, expectedSnapshot);
}
