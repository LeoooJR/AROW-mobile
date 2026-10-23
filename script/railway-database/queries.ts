import {
  KILOMETRIC_POINTS_TABLE,
  projection,
  RAILWAY_SECTIONS_TABLE,
} from "../../shared/railway-reference/schema";
import { DATABASE_SCHEMA_VERSION } from "../../shared/railway-reference/database-version";

export { DATABASE_SCHEMA_VERSION };

export const ENABLE_FOREIGN_KEYS = "PRAGMA foreign_keys = ON";
export const BEGIN_TRANSACTION = "BEGIN IMMEDIATE";
export const COMMIT_TRANSACTION = "COMMIT";
export const ROLLBACK_TRANSACTION = "ROLLBACK";
export const SET_SCHEMA_VERSION = `PRAGMA user_version = ${DATABASE_SCHEMA_VERSION}`;
export const CHECK_SCHEMA_VERSION = "PRAGMA user_version";
export const VACUUM_DATABASE = "VACUUM";
export const ANALYZE_DATABASE = "ANALYZE";
export const CREATE_POINT_DISPLAY_INDEX = `
  CREATE INDEX kilometric_points_display_idx
  ON ${KILOMETRIC_POINTS_TABLE.name} (visibility_class, longitude, latitude)
`;
export const CHECK_DATABASE_INTEGRITY = "PRAGMA integrity_check";
export const CHECK_FOREIGN_KEYS = "PRAGMA foreign_key_check";
export const FIND_CONFLICTING_LINE_NAMES = `
  SELECT code_ligne FROM railway_sections
  WHERE milestone_count > 0
  GROUP BY code_ligne HAVING COUNT(DISTINCT lib_ligne) > 1
  LIMIT 1
`;

export const INSERT_RAILWAY_SECTION = `
  INSERT INTO ${RAILWAY_SECTIONS_TABLE.name} (
    ${projection(RAILWAY_SECTIONS_TABLE, ["code_ligne", "rg_troncon", "idgaia", "lib_ligne", "type_ligne", "pkd", "pkf", "has_geometry", "milestone_count"])}
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const INSERT_KILOMETRIC_POINT = `
  INSERT INTO ${KILOMETRIC_POINTS_TABLE.name} (
    ${projection(KILOMETRIC_POINTS_TABLE, ["code_ligne", "rg_troncon", "position_m", "label", "latitude", "longitude", "position_in_section", "visibility_class"])}
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const FIND_INVALID_SECTION_COUNT = `
  SELECT section.code_ligne, section.rg_troncon
  FROM railway_sections AS section
  LEFT JOIN (
    SELECT code_ligne, rg_troncon, COUNT(*) AS actual_count
    FROM kilometric_points GROUP BY code_ligne, rg_troncon
  ) AS recorded USING (code_ligne, rg_troncon)
  WHERE section.milestone_count != COALESCE(recorded.actual_count, 0)
  LIMIT 1
`;

export const FIND_INVALID_MILESTONE_ORDINAL = `
  WITH ordered AS (
    SELECT position_in_section,
      ROW_NUMBER() OVER (
        PARTITION BY code_ligne, rg_troncon ORDER BY position_m
      ) AS expected_position
    FROM kilometric_points
  )
  SELECT position_in_section FROM ordered
  WHERE position_in_section != expected_position LIMIT 1
`;

export const SELECT_DATABASE_COUNTS = `
  SELECT
    (SELECT COUNT(*) FROM railway_sections) AS railway_section_count,
    (SELECT COUNT(*) FROM railway_sections WHERE has_geometry = 1) AS geometry_count,
    (SELECT COUNT(*) FROM railway_sections WHERE has_geometry = 0) AS fallback_section_count,
    (SELECT COUNT(*)
       FROM railway_sections AS railway
      WHERE railway.has_geometry = 1
        AND NOT EXISTS (
          SELECT 1
            FROM kilometric_points AS point
           WHERE point.code_ligne = railway.code_ligne
             AND point.rg_troncon = railway.rg_troncon
        )) AS geometry_without_milestone_count,
    (SELECT COUNT(*) FROM kilometric_points) AS milestone_count
`;
