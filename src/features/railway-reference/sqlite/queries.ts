import {
  columnReference,
  KILOMETRIC_POINTS_TABLE,
  projection,
  RAILWAY_SECTIONS_TABLE,
} from "@shared/railway-reference/schema";
import type { MilestoneVisibilityClass } from "@shared/railway-reference/milestone-visibility-class";

const railwayAlias = "railway";

const milestoneColumns = [
  "code_ligne",
  "rg_troncon",
  "position_m",
  "label",
  "latitude",
  "longitude",
  "position_in_section",
  "visibility_class",
] as const;

const milestoneProjection = projection(
  KILOMETRIC_POINTS_TABLE,
  milestoneColumns,
);
const lineCode = "code_ligne";
const sectionRank = "rg_troncon";
const positionMeters = "position_m";

export const LOAD_SEARCHABLE_RAILWAYS_QUERY = `
  SELECT
    ${projection(RAILWAY_SECTIONS_TABLE, ["code_ligne", "lib_ligne", "rg_troncon", "has_geometry", "idgaia", "type_ligne", "first_recorded_position_m", "last_recorded_position_m", "milestone_count"], railwayAlias)},
    railway.first_recorded_position_m AS minimum_position_m,
    minimum_point.label AS minimum_label,
    railway.last_recorded_position_m AS maximum_position_m,
    maximum_point.label AS maximum_label
  FROM railway_sections AS railway
  INNER JOIN kilometric_points AS minimum_point
    ON minimum_point.code_ligne = railway.code_ligne
    AND minimum_point.rg_troncon = railway.rg_troncon
    AND minimum_point.position_m = railway.first_recorded_position_m
  INNER JOIN kilometric_points AS maximum_point
    ON maximum_point.code_ligne = railway.code_ligne
    AND maximum_point.rg_troncon = railway.rg_troncon
    AND maximum_point.position_m = railway.last_recorded_position_m
  ORDER BY railway.lib_ligne, railway.code_ligne, railway.rg_troncon
`;

export const FIND_MILESTONE_QUERY = `
  SELECT ${milestoneProjection}
  FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE ${lineCode} = ? AND ${sectionRank} = ? AND ${positionMeters} = ?
  LIMIT 1
`;

export function visibleMilestonesQuery(
  classes: readonly MilestoneVisibilityClass[],
  wrapped: boolean,
): string {
  return `
  SELECT ${milestoneProjection} FROM ${KILOMETRIC_POINTS_TABLE.name}
  WHERE latitude BETWEEN ? AND ? AND ${wrapped ? "(longitude >= ? OR longitude <= ?)" : "longitude BETWEEN ? AND ?"}
    AND visibility_class IN (${classes.map(() => "?").join(", ")})
  ORDER BY ${lineCode}, ${sectionRank}, ${positionMeters}
`;
}

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
  SELECT ${projection(KILOMETRIC_POINTS_TABLE, milestoneColumns, "point")}
  FROM railway_sections AS section
  INNER JOIN kilometric_points AS point
    ON point.code_ligne = section.code_ligne
    AND point.rg_troncon = section.rg_troncon
    AND point.position_m IN (section.first_recorded_position_m, section.last_recorded_position_m)
  WHERE section.code_ligne = ? AND section.rg_troncon = ?
  ORDER BY point.position_m ASC
`;
