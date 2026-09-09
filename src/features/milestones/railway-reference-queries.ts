const MILESTONE_COLUMNS =
  "code_ligne, rg_troncon, position_m, label, latitude, longitude";

export const LOAD_MILESTONES_QUERY = `
  SELECT ${MILESTONE_COLUMNS}
  FROM kilometric_points
`;

export const LOAD_SEARCHABLE_RAILWAYS_QUERY = `
  WITH section_bounds AS (
    SELECT
      code_ligne,
      rg_troncon,
      MIN(position_m) AS minimum_position_m,
      MAX(position_m) AS maximum_position_m
    FROM kilometric_points
    GROUP BY code_ligne, rg_troncon
  )
  SELECT
    railway.code_ligne,
    railway.lib_ligne,
    railway.rg_troncon,
    railway.has_geometry,
    railway.idgaia,
    railway.type_ligne,
    railway.pkd,
    railway.pkf,
    bounds.minimum_position_m,
    minimum_point.label AS minimum_label,
    bounds.maximum_position_m,
    maximum_point.label AS maximum_label
  FROM railway_sections AS railway
  INNER JOIN section_bounds AS bounds
    USING (code_ligne, rg_troncon)
  INNER JOIN kilometric_points AS minimum_point
    ON minimum_point.code_ligne = bounds.code_ligne
    AND minimum_point.rg_troncon = bounds.rg_troncon
    AND minimum_point.position_m = bounds.minimum_position_m
  INNER JOIN kilometric_points AS maximum_point
    ON maximum_point.code_ligne = bounds.code_ligne
    AND maximum_point.rg_troncon = bounds.rg_troncon
    AND maximum_point.position_m = bounds.maximum_position_m
  ORDER BY railway.lib_ligne, railway.code_ligne, railway.rg_troncon
`;

export const FIND_MILESTONE_QUERY = `
  SELECT ${MILESTONE_COLUMNS}
  FROM kilometric_points
  WHERE code_ligne = ? AND rg_troncon = ? AND position_m = ?
  LIMIT 1
`;
