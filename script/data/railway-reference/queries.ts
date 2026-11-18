import {
  KILOMETRIC_POINTS_TABLE,
  projection,
  RAILWAY_SECTIONS_TABLE,
} from "../../../shared/railway-reference/schema";
import { DATABASE_SCHEMA_VERSION } from "../../../shared/railway-reference/database-version";

export const ENABLE_FOREIGN_KEYS = "PRAGMA foreign_keys = ON";
export const BEGIN_TRANSACTION = "BEGIN IMMEDIATE";
export const COMMIT_TRANSACTION = "COMMIT";
export const ROLLBACK_TRANSACTION = "ROLLBACK";
export const SET_SCHEMA_VERSION = `PRAGMA user_version = ${DATABASE_SCHEMA_VERSION}`;
export const VACUUM_DATABASE = "VACUUM";
export const ANALYZE_DATABASE = "ANALYZE";
export const CREATE_POINT_DISPLAY_INDEX = `
  CREATE INDEX kilometric_points_display_idx
  ON ${KILOMETRIC_POINTS_TABLE.name} (visibility_class, longitude, latitude)
`;

export const INSERT_RAILWAY_SECTION = `
  INSERT INTO ${RAILWAY_SECTIONS_TABLE.name} (
    ${projection(RAILWAY_SECTIONS_TABLE, ["code_ligne", "rg_troncon", "idgaia", "lib_ligne", "type_ligne", "first_recorded_position_m", "last_recorded_position_m", "has_geometry", "milestone_count"])}
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const INSERT_KILOMETRIC_POINT = `
  INSERT INTO ${KILOMETRIC_POINTS_TABLE.name} (
    ${projection(KILOMETRIC_POINTS_TABLE, ["code_ligne", "rg_troncon", "position_m", "label", "latitude", "longitude", "position_in_section", "visibility_class"])}
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;
