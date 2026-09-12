import {
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
} from "@/features/milestones/railway-reference-schema";

const railwayAlias = "railway";
const boundsAlias = "bounds";
const minimumPointAlias = "minimum_point";
const maximumPointAlias = "maximum_point";

const milestoneColumns = [
  KILOMETRIC_POINTS_TABLE.column("code_ligne"),
  KILOMETRIC_POINTS_TABLE.column("rg_troncon"),
  KILOMETRIC_POINTS_TABLE.column("position_m"),
  KILOMETRIC_POINTS_TABLE.column("label"),
  KILOMETRIC_POINTS_TABLE.column("latitude"),
  KILOMETRIC_POINTS_TABLE.column("longitude"),
] as const;

const milestoneProjection =
  KILOMETRIC_POINTS_TABLE.projection(milestoneColumns);
const lineCode = KILOMETRIC_POINTS_TABLE.column("code_ligne");
const sectionRank = KILOMETRIC_POINTS_TABLE.column("rg_troncon");
const positionMeters = KILOMETRIC_POINTS_TABLE.column("position_m");

export const LOAD_MILESTONES_QUERY = `
  SELECT ${milestoneProjection}
  FROM ${KILOMETRIC_POINTS_TABLE.name}
`;

export const LOAD_SEARCHABLE_RAILWAYS_QUERY = `
  WITH section_bounds AS (
    SELECT
      ${lineCode.name},
      ${sectionRank.name},
      MIN(${positionMeters.name}) AS minimum_position_m,
      MAX(${positionMeters.name}) AS maximum_position_m
    FROM ${KILOMETRIC_POINTS_TABLE.name}
    GROUP BY ${lineCode.name}, ${sectionRank.name}
  )
  SELECT
    ${RAILWAY_SECTIONS_TABLE.column("code_ligne").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("lib_ligne").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("rg_troncon").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("has_geometry").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("idgaia").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("type_ligne").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("pkd").reference(railwayAlias)},
    ${RAILWAY_SECTIONS_TABLE.column("pkf").reference(railwayAlias)},
    ${boundsAlias}.minimum_position_m,
    ${KILOMETRIC_POINTS_TABLE.column("label").reference(minimumPointAlias)} AS minimum_label,
    ${boundsAlias}.maximum_position_m,
    ${KILOMETRIC_POINTS_TABLE.column("label").reference(maximumPointAlias)} AS maximum_label
  FROM ${RAILWAY_SECTIONS_TABLE.name} AS ${railwayAlias}
  INNER JOIN section_bounds AS ${boundsAlias}
    USING (${lineCode.name}, ${sectionRank.name})
  INNER JOIN ${KILOMETRIC_POINTS_TABLE.name} AS ${minimumPointAlias}
    ON ${lineCode.reference(minimumPointAlias)} = ${lineCode.reference(boundsAlias)}
    AND ${sectionRank.reference(minimumPointAlias)} = ${sectionRank.reference(boundsAlias)}
    AND ${positionMeters.reference(minimumPointAlias)} = ${boundsAlias}.minimum_position_m
  INNER JOIN ${KILOMETRIC_POINTS_TABLE.name} AS ${maximumPointAlias}
    ON ${lineCode.reference(maximumPointAlias)} = ${lineCode.reference(boundsAlias)}
    AND ${sectionRank.reference(maximumPointAlias)} = ${sectionRank.reference(boundsAlias)}
    AND ${positionMeters.reference(maximumPointAlias)} = ${boundsAlias}.maximum_position_m
  ORDER BY ${RAILWAY_SECTIONS_TABLE.column("lib_ligne").reference(railwayAlias)}, ${lineCode.reference(railwayAlias)}, ${sectionRank.reference(railwayAlias)}
`;

export const FIND_MILESTONE_QUERY = `
  SELECT ${milestoneProjection}
  FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE ${lineCode.name} = ? AND ${sectionRank.name} = ? AND ${positionMeters.name} = ?
  LIMIT 1
`;
