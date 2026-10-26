import type { FeatureCollection, Point } from "geojson";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { Milestone } from "@shared/railway-domain/milestone";
import { Railway } from "@shared/railway-domain/railway";
import type { RailwaySection } from "@shared/railway-domain/railway-section";
import { isCanonicalRailwayLineCode } from "@shared/railway-domain/line-code";
import { isMilestoneLabelForPosition } from "@shared/railway-domain/kilometric-position";
import {
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isUnsignedInteger,
} from "@shared/value-validation";
import { geographicCoordinatesFromPosition } from "./geojson-validation";
interface MilestoneGeoJSONProperties {
  readonly label: string;
  readonly lineCode: string;
  readonly positionMeters: number;
  readonly sectionRank: number;
}

export type MilestoneFeatureCollection = FeatureCollection<
  Point,
  MilestoneGeoJSONProperties
>;

interface RailwayLineProperties {
  readonly code_ligne: string;
  readonly idgaia: string;
  readonly lib_ligne: string;
  readonly rg_troncon: number;
  readonly type_ligne: string;
}

function isMilestoneProperties(
  properties: GeoJSON.GeoJsonProperties,
): properties is MilestoneGeoJSONProperties {
  if (!isRecord(properties)) {
    return false;
  }

  return (
    hasMilestoneIdentity(properties) &&
    hasMilestoneMetadata(properties) &&
    isMilestoneLabelForPosition(properties.label, properties.positionMeters)
  );
}

function hasMilestoneIdentity(properties: Record<string, unknown>): boolean {
  return (
    isCanonicalRailwayLineCode(properties.lineCode) &&
    isPositiveInteger(properties.sectionRank) &&
    isUnsignedInteger(properties.positionMeters)
  );
}

function hasMilestoneMetadata(properties: Record<string, unknown>): boolean {
  return isNonEmptyString(properties.label);
}

export function milestoneFromFeature(
  feature: GeoJSON.Feature,
): Milestone | undefined {
  if (
    feature.geometry.type !== "Point" ||
    !isMilestoneProperties(feature.properties)
  ) {
    return undefined;
  }

  const coordinates = geographicCoordinatesFromPosition(
    feature.geometry.coordinates,
  );
  if (coordinates === undefined) {
    return undefined;
  }

  const milestone = new Milestone({
    id: new MilestoneId(
      new RailwaySectionId(
        feature.properties.lineCode,
        feature.properties.sectionRank,
      ),
      feature.properties.positionMeters,
    ),
    coordinates,
    label: feature.properties.label,
  });

  return feature.id === milestone.id.value ? milestone : undefined;
}

function isRailwayLineProperties(
  properties: GeoJSON.GeoJsonProperties,
): properties is RailwayLineProperties {
  if (!isRecord(properties)) {
    return false;
  }

  return hasRailwayIdentity(properties) && hasRailwayMetadata(properties);
}

function hasRailwayIdentity(properties: Record<string, unknown>): boolean {
  return (
    isCanonicalRailwayLineCode(properties.code_ligne) &&
    isPositiveInteger(properties.rg_troncon)
  );
}

function hasRailwayMetadata(properties: Record<string, unknown>): boolean {
  return (
    isNonEmptyString(properties.idgaia) &&
    isNonEmptyString(properties.lib_ligne) &&
    isNonEmptyString(properties.type_ligne)
  );
}

export function railwayFromFeature(
  feature: GeoJSON.Feature,
): RailwaySection | undefined {
  if (
    feature.geometry.type !== "LineString" &&
    feature.geometry.type !== "MultiLineString"
  ) {
    return undefined;
  }

  if (!isRailwayLineProperties(feature.properties)) {
    return undefined;
  }

  const railway = new Railway({
    code: feature.properties.code_ligne,
    name: feature.properties.lib_ligne,
    sections: [
      {
        geometry: {
          gaiaId: feature.properties.idgaia,
          railwayType: feature.properties.type_ligne,
          status: "present",
        },
        sectionRank: feature.properties.rg_troncon,
      },
    ],
  });
  const section = railway.sections[0];

  return section !== undefined && feature.id === section.id.value
    ? section
    : undefined;
}
