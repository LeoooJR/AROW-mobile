import { Railway } from "@/features/railways/railway";
import type {
  RailwaySectionGeometry,
  RailwaySectionInput,
} from "@/features/railways/railway-section";
import {
  isNonEmptyString,
  isRecord,
  isUnsignedInteger,
} from "@shared/value-validation";
import { decodeRailwaySectionDatabaseRow } from "@shared/railway-reference/records";

interface DecodedSearchableRailwaySection {
  readonly lineCode: string;
  readonly lineName: string;
  readonly section: RailwaySectionInput;
}

interface RailwayAccumulator {
  readonly name: string;
  readonly sections: RailwaySectionInput[];
}

function geometryFromDatabaseRow(
  row: ReturnType<typeof decodeRailwaySectionDatabaseRow>,
): RailwaySectionGeometry {
  if (row.has_geometry === 0) {
    return { status: "absent" };
  }

  return {
    endMilestone: row.pkf,
    gaiaId: row.idgaia,
    railwayType: row.type_ligne,
    startMilestone: row.pkd,
    status: "present",
  };
}

function decodeSearchableRailwaySection(
  value: unknown,
  index: number,
): DecodedSearchableRailwaySection {
  const context = `at row ${index}`;

  try {
    if (
      !isRecord(value) ||
      !isUnsignedInteger(value.minimum_position_m) ||
      !isNonEmptyString(value.minimum_label) ||
      !isUnsignedInteger(value.maximum_position_m) ||
      !isNonEmptyString(value.maximum_label) ||
      value.minimum_position_m > value.maximum_position_m
    ) {
      throw new Error("Invalid milestone range");
    }

    const row = decodeRailwaySectionDatabaseRow(value, context);

    return {
      lineCode: row.code_ligne,
      lineName: row.lib_ligne,
      section: {
        geometry: geometryFromDatabaseRow(row),
        milestoneRange: {
          maximumLabel: value.maximum_label,
          maximumPositionMeters: value.maximum_position_m,
          minimumLabel: value.minimum_label,
          minimumPositionMeters: value.minimum_position_m,
        },
        sectionRank: row.rg_troncon,
      },
    };
  } catch {
    throw new Error(`Invalid searchable railway section ${context}`);
  }
}

export function searchableSectionRowsToRailways(
  rows: readonly unknown[],
): readonly Railway[] {
  const railways = new Map<string, RailwayAccumulator>();

  rows.forEach((value, index) => {
    const row = decodeSearchableRailwaySection(value, index);
    const railway = railways.get(row.lineCode);
    if (railway !== undefined && railway.name !== row.lineName) {
      throw new Error(`Conflicting names for railway line ${row.lineCode}`);
    }

    const accumulator = railway ?? { name: row.lineName, sections: [] };
    accumulator.sections.push(row.section);
    railways.set(row.lineCode, accumulator);
  });

  return [...railways.entries()]
    .map(([code, { name, sections }]) => new Railway({ code, name, sections }))
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));
}
