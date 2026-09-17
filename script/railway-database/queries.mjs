export const ENABLE_FOREIGN_KEYS = "PRAGMA foreign_keys = ON";
export const BEGIN_TRANSACTION = "BEGIN IMMEDIATE";
export const COMMIT_TRANSACTION = "COMMIT";
export const ROLLBACK_TRANSACTION = "ROLLBACK";
export const SET_SCHEMA_VERSION = "PRAGMA user_version = 1";
export const VACUUM_DATABASE = "VACUUM";
export const CHECK_DATABASE_INTEGRITY = "PRAGMA integrity_check";
export const CHECK_FOREIGN_KEYS = "PRAGMA foreign_key_check";

export const INSERT_RAILWAY_SECTION = `
  INSERT INTO railway_sections (
    code_ligne, rg_troncon, idgaia, lib_ligne, type_ligne, pkd, pkf, has_geometry
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const INSERT_KILOMETRIC_POINT = `
  INSERT INTO kilometric_points (
    code_ligne, rg_troncon, position_m, label, latitude, longitude
  ) VALUES (?, ?, ?, ?, ?, ?)
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
