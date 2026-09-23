import { isNonEmptyString, isRecord } from "../value-validation";
import {
  isCanonicalRailwayLineCode,
  isKilometricPosition,
  isMilestoneLabelForPosition,
  isRailwayLatitude,
  isRailwayLongitude,
  isRailwaySectionRank,
} from "./values";

export interface KilometricPointDatabaseRow {
  readonly code_ligne: string;
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly position_m: number;
  readonly rg_troncon: number;
}

interface RailwaySectionDatabaseRowBase {
  readonly code_ligne: string;
  readonly lib_ligne: string;
  readonly rg_troncon: number;
}

export interface RailwaySectionDatabaseRowWithGeometry extends RailwaySectionDatabaseRowBase {
  readonly has_geometry: 1;
  readonly idgaia: string;
  readonly pkd: string;
  readonly pkf: string;
  readonly type_ligne: string;
}

export interface RailwaySectionDatabaseRowWithoutGeometry extends RailwaySectionDatabaseRowBase {
  readonly has_geometry: 0;
  readonly idgaia: null;
  readonly pkd: null;
  readonly pkf: null;
  readonly type_ligne: null;
}

export type RailwaySectionDatabaseRow =
  | RailwaySectionDatabaseRowWithGeometry
  | RailwaySectionDatabaseRowWithoutGeometry;

export function decodeKilometricPointDatabaseRow(
  value: unknown,
  context: string,
): KilometricPointDatabaseRow {
  if (
    !isRecord(value) ||
    !isCanonicalRailwayLineCode(value.code_ligne) ||
    !isRailwaySectionRank(value.rg_troncon) ||
    !isKilometricPosition(value.position_m) ||
    !isNonEmptyString(value.label) ||
    !isMilestoneLabelForPosition(value.label, value.position_m) ||
    !isRailwayLatitude(value.latitude) ||
    !isRailwayLongitude(value.longitude)
  ) {
    throw new Error(`Invalid milestone ${context}`);
  }

  return Object.freeze({
    code_ligne: value.code_ligne,
    label: value.label,
    latitude: value.latitude,
    longitude: value.longitude,
    position_m: value.position_m,
    rg_troncon: value.rg_troncon,
  });
}

export function decodeRailwaySectionDatabaseRow(
  value: unknown,
  context: string,
): RailwaySectionDatabaseRow {
  if (
    !isRecord(value) ||
    !isCanonicalRailwayLineCode(value.code_ligne) ||
    !isNonEmptyString(value.lib_ligne) ||
    !isRailwaySectionRank(value.rg_troncon)
  ) {
    throw new Error(`Invalid railway section ${context}`);
  }

  const base = {
    code_ligne: value.code_ligne,
    lib_ligne: value.lib_ligne,
    rg_troncon: value.rg_troncon,
  };
  if (
    value.has_geometry === 0 &&
    value.idgaia === null &&
    value.type_ligne === null &&
    value.pkd === null &&
    value.pkf === null
  ) {
    return Object.freeze({
      ...base,
      has_geometry: 0,
      idgaia: null,
      pkd: null,
      pkf: null,
      type_ligne: null,
    });
  }

  if (
    value.has_geometry === 1 &&
    isNonEmptyString(value.idgaia) &&
    isNonEmptyString(value.type_ligne) &&
    isNonEmptyString(value.pkd) &&
    isNonEmptyString(value.pkf)
  ) {
    return Object.freeze({
      ...base,
      has_geometry: 1,
      idgaia: value.idgaia,
      pkd: value.pkd,
      pkf: value.pkf,
      type_ligne: value.type_ligne,
    });
  }

  throw new Error(`Invalid railway section ${context}`);
}
