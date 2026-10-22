import {
  columnReference,
  KILOMETRIC_POINTS_TABLE,
  projection,
  RAILWAY_SECTIONS_TABLE,
} from "@shared/railway-reference/schema";

const railwayAlias = "railway";
const boundsAlias = "bounds";
const minimumPointAlias = "minimum_point";
const maximumPointAlias = "maximum_point";

const milestoneColumns = [
  "code_ligne",
  "rg_troncon",
  "position_m",
  "label",
  "latitude",
  "longitude",
  "position_in_section",
] as const;

const milestoneProjection = projection(
  KILOMETRIC_POINTS_TABLE,
  milestoneColumns,
);
const lineCode = "code_ligne";
const sectionRank = "rg_troncon";
const positionMeters = "position_m";

export const LOAD_SEARCHABLE_RAILWAYS_QUERY = `
  WITH section_bounds AS (
    SELECT
      ${lineCode},
      ${sectionRank},
      MIN(${positionMeters}) AS minimum_position_m,
      MAX(${positionMeters}) AS maximum_position_m
    FROM ${KILOMETRIC_POINTS_TABLE.name}
    GROUP BY ${lineCode}, ${sectionRank}
  )
  SELECT
    ${projection(RAILWAY_SECTIONS_TABLE, ["code_ligne", "lib_ligne", "rg_troncon", "has_geometry", "idgaia", "type_ligne", "pkd", "pkf", "milestone_count"], railwayAlias)},
    ${boundsAlias}.minimum_position_m,
    ${columnReference(KILOMETRIC_POINTS_TABLE, "label", minimumPointAlias)} AS minimum_label,
    ${boundsAlias}.maximum_position_m,
    ${columnReference(KILOMETRIC_POINTS_TABLE, "label", maximumPointAlias)} AS maximum_label
  FROM ${RAILWAY_SECTIONS_TABLE.name} AS ${railwayAlias}
  INNER JOIN section_bounds AS ${boundsAlias}
    USING (${lineCode}, ${sectionRank})
  INNER JOIN ${KILOMETRIC_POINTS_TABLE.name} AS ${minimumPointAlias}
    ON ${columnReference(KILOMETRIC_POINTS_TABLE, lineCode, minimumPointAlias)} = ${boundsAlias}.${lineCode}
    AND ${columnReference(KILOMETRIC_POINTS_TABLE, sectionRank, minimumPointAlias)} = ${boundsAlias}.${sectionRank}
    AND ${columnReference(KILOMETRIC_POINTS_TABLE, positionMeters, minimumPointAlias)} = ${boundsAlias}.minimum_position_m
  INNER JOIN ${KILOMETRIC_POINTS_TABLE.name} AS ${maximumPointAlias}
    ON ${columnReference(KILOMETRIC_POINTS_TABLE, lineCode, maximumPointAlias)} = ${boundsAlias}.${lineCode}
    AND ${columnReference(KILOMETRIC_POINTS_TABLE, sectionRank, maximumPointAlias)} = ${boundsAlias}.${sectionRank}
    AND ${columnReference(KILOMETRIC_POINTS_TABLE, positionMeters, maximumPointAlias)} = ${boundsAlias}.maximum_position_m
  ORDER BY ${columnReference(RAILWAY_SECTIONS_TABLE, "lib_ligne", railwayAlias)}, ${columnReference(RAILWAY_SECTIONS_TABLE, lineCode, railwayAlias)}, ${columnReference(RAILWAY_SECTIONS_TABLE, sectionRank, railwayAlias)}
`;

export const FIND_MILESTONE_QUERY = `
  SELECT ${milestoneProjection}
  FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE ${lineCode} = ? AND ${sectionRank} = ? AND ${positionMeters} = ?
  LIMIT 1
`;

export const FIND_VISIBLE_MILESTONES_QUERY = `
  SELECT ${milestoneProjection} FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
    AND ${positionMeters} % ? = 0
  ORDER BY ${lineCode}, ${sectionRank}, ${positionMeters}
`;

export const FIND_WRAPPED_VISIBLE_MILESTONES_QUERY = `
  SELECT ${milestoneProjection} FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE latitude BETWEEN ? AND ? AND (longitude >= ? OR longitude <= ?)
    AND ${positionMeters} % ? = 0
  ORDER BY ${lineCode}, ${sectionRank}, ${positionMeters}
`;

export const FIND_PREVIOUS_MILESTONE_QUERY = `
  SELECT ${milestoneProjection} FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE ${lineCode} = ? AND ${sectionRank} = ? AND ${positionMeters} < ?
  ORDER BY ${positionMeters} DESC LIMIT 1
`;

export const FIND_NEXT_MILESTONE_QUERY = `
  SELECT ${milestoneProjection} FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE ${lineCode} = ? AND ${sectionRank} = ? AND ${positionMeters} > ?
  ORDER BY ${positionMeters} ASC LIMIT 1
`;

export const FIND_CURRENT_MILESTONE_QUERY = `
  SELECT
    ${projection(KILOMETRIC_POINTS_TABLE, milestoneColumns, "current")},
    ${columnReference(RAILWAY_SECTIONS_TABLE, "milestone_count", "section")} AS total
  FROM ${KILOMETRIC_POINTS_TABLE.name} AS current
  INNER JOIN ${RAILWAY_SECTIONS_TABLE.name} AS section
    ON section.${lineCode} = current.${lineCode}
    AND section.${sectionRank} = current.${sectionRank}
  WHERE current.${lineCode} = ? AND current.${sectionRank} = ? AND current.${positionMeters} = ?
  LIMIT 1
`;

export const FIND_RAILWAY_MILESTONE_BOUNDS_QUERY = `
  SELECT ${milestoneProjection}
  FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE ${lineCode} = ? AND ${sectionRank} = ?
    AND ${positionMeters} IN (
      SELECT MIN(${positionMeters}) FROM ${KILOMETRIC_POINTS_TABLE.name}
      WHERE ${lineCode} = ? AND ${sectionRank} = ?
      UNION
      SELECT MAX(${positionMeters}) FROM ${KILOMETRIC_POINTS_TABLE.name}
      WHERE ${lineCode} = ? AND ${sectionRank} = ?
    )
  ORDER BY ${positionMeters} ASC
`;
