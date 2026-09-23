import { readFileSync } from "node:fs";

import { isRecord } from "../../shared/value-validation";

import {
  DEFAULT_RAILWAY_DATABASE_PATH,
  DEFAULT_RAILWAY_GEOJSON_PATH,
  DEFAULT_MILESTONE_GEOJSON_PATH,
  EXPECTED_RAILWAY_SNAPSHOT,
} from "./configuration";
import { validateRailwayDatabase } from "./database";
import { normalizeRailwayGeoJson } from "./geojson";
import { normalizeMilestoneGeoJson } from "./milestone-geojson";
import type { GenerationSummary } from "./types";

const SETUP_INSTRUCTION =
  "Run `npm run database:setup` to generate the railway reference assets.";

export interface RailwayAssetValidationOptions {
  readonly databasePath?: string;
  readonly expectedSnapshot?: GenerationSummary;
  readonly geojsonPath?: string;
  readonly milestoneGeojsonPath?: string;
}

function validateMilestoneGeoJson(
  milestoneGeojsonPath: string,
  expectedSnapshot: GenerationSummary,
): void {
  try {
    const value: unknown = JSON.parse(
      readFileSync(milestoneGeojsonPath, "utf8"),
    );
    const geojson = normalizeMilestoneGeoJson(value);
    if (geojson.features.length !== expectedSnapshot.milestoneCount) {
      throw new Error(
        `Expected ${expectedSnapshot.milestoneCount} milestone features, received ${geojson.features.length}.`,
      );
    }
  } catch (cause) {
    throw validationFailure("Milestone GeoJSON asset", cause);
  }
}

function errorMessage(cause: unknown): string | undefined {
  if (cause instanceof Error) {
    return cause.message;
  }
  return isRecord(cause) && typeof cause.message === "string"
    ? cause.message
    : undefined;
}

function validationFailure(asset: string, cause: unknown): Error {
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
    const { geojson } = normalizeRailwayGeoJson(value);
    if (geojson.features.length !== expectedSnapshot.geometryCount) {
      throw new Error(
        `Expected ${expectedSnapshot.geometryCount} railway features, received ${geojson.features.length}.`,
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

export function validateRailwayAssets({
  databasePath = DEFAULT_RAILWAY_DATABASE_PATH,
  expectedSnapshot = EXPECTED_RAILWAY_SNAPSHOT,
  geojsonPath = DEFAULT_RAILWAY_GEOJSON_PATH,
  milestoneGeojsonPath = DEFAULT_MILESTONE_GEOJSON_PATH,
}: RailwayAssetValidationOptions = {}): void {
  validateRailwayGeoJson(geojsonPath, expectedSnapshot);
  validateMilestoneGeoJson(milestoneGeojsonPath, expectedSnapshot);
  validateRailwaySqlite(databasePath, expectedSnapshot);
}
