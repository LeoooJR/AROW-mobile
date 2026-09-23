import {
  isCanonicalRailwayLineCode,
  milestoneId,
} from "../../shared/railway-reference/values";
import {
  isNonEmptyString,
  isLatitude,
  isLongitude,
  isPositiveInteger,
  isRecord,
  isUnsignedInteger,
} from "../../shared/value-validation";

import type {
  MilestoneFeatureCollection,
  MilestoneGeoJsonFeature,
} from "./types";

const COLLECTION_KEYS = new Set(["features", "type"]);
const FEATURE_KEYS = new Set(["geometry", "id", "properties", "type"]);
const GEOMETRY_KEYS = new Set(["coordinates", "type"]);
const PROPERTY_KEYS = new Set([
  "label",
  "lineCode",
  "positionMeters",
  "sectionRank",
]);

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: ReadonlySet<string>,
) {
  return Object.keys(value).every((key) => keys.has(key));
}

function normalizeFeature(value: unknown): MilestoneGeoJsonFeature {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, FEATURE_KEYS) ||
    value.type !== "Feature" ||
    !isRecord(value.geometry) ||
    !hasOnlyKeys(value.geometry, GEOMETRY_KEYS) ||
    value.geometry.type !== "Point" ||
    !Array.isArray(value.geometry.coordinates) ||
    value.geometry.coordinates.length !== 2 ||
    !isLongitude(value.geometry.coordinates[0]) ||
    !isLatitude(value.geometry.coordinates[1]) ||
    !isRecord(value.properties) ||
    !hasOnlyKeys(value.properties, PROPERTY_KEYS) ||
    !isNonEmptyString(value.properties.label) ||
    !isCanonicalRailwayLineCode(value.properties.lineCode) ||
    !isPositiveInteger(value.properties.sectionRank) ||
    !isUnsignedInteger(value.properties.positionMeters)
  ) {
    throw new Error("Milestone GeoJSON contains an invalid feature");
  }

  const expectedId = milestoneId(
    value.properties.lineCode,
    value.properties.sectionRank,
    value.properties.positionMeters,
  );
  if (value.id !== expectedId) {
    throw new Error(
      `Milestone GeoJSON feature has invalid id ${String(value.id)}`,
    );
  }

  return value as unknown as MilestoneGeoJsonFeature;
}

export function normalizeMilestoneGeoJson(
  value: unknown,
): MilestoneFeatureCollection {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, COLLECTION_KEYS) ||
    value.type !== "FeatureCollection" ||
    !Array.isArray(value.features)
  ) {
    throw new Error("Milestone GeoJSON must be a FeatureCollection");
  }

  return {
    features: value.features.map(normalizeFeature),
    type: "FeatureCollection",
  };
}
