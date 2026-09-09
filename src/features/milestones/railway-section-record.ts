import { isCanonicalRailwayLineCode } from "@/features/map-features/railway-section-key";
import { Railway } from "@/features/railways/railway";
import type {
  RailwaySectionGeometry,
  RailwaySectionInput,
} from "@/features/railways/railway-section";
import {
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isUnsignedInteger,
} from "@/types/value-validation";

interface SearchableRailwaySectionRecordBase {
  readonly code_ligne: string;
  readonly lib_ligne: string;
  readonly maximum_label: string;
  readonly maximum_position_m: number;
  readonly minimum_label: string;
  readonly minimum_position_m: number;
  readonly rg_troncon: number;
}

type SearchableRailwaySectionRecord = SearchableRailwaySectionRecordBase &
  (
    | {
        readonly has_geometry: 0;
        readonly idgaia: null;
        readonly pkd: null;
        readonly pkf: null;
        readonly type_ligne: null;
      }
    | {
        readonly has_geometry: 1;
        readonly idgaia: string;
        readonly pkd: string;
        readonly pkf: string;
        readonly type_ligne: string;
      }
  );

interface RailwayGroup {
  readonly name: string;
  readonly sections: RailwaySectionInput[];
}

function hasAbsentGeometryMetadata(value: Record<string, unknown>): boolean {
  return (
    value.idgaia === null &&
    value.type_ligne === null &&
    value.pkd === null &&
    value.pkf === null
  );
}

function hasPresentGeometryMetadata(value: Record<string, unknown>): boolean {
  return (
    isNonEmptyString(value.idgaia) &&
    isNonEmptyString(value.type_ligne) &&
    isNonEmptyString(value.pkd) &&
    isNonEmptyString(value.pkf)
  );
}

function isSearchableRailwaySectionRecord(
  value: unknown,
): value is SearchableRailwaySectionRecord {
  if (
    !isRecord(value) ||
    !isCanonicalRailwayLineCode(value.code_ligne) ||
    !isNonEmptyString(value.lib_ligne) ||
    !isPositiveInteger(value.rg_troncon) ||
    !isUnsignedInteger(value.minimum_position_m) ||
    !isNonEmptyString(value.minimum_label) ||
    !isUnsignedInteger(value.maximum_position_m) ||
    !isNonEmptyString(value.maximum_label) ||
    value.minimum_position_m > value.maximum_position_m
  ) {
    return false;
  }

  return (
    (value.has_geometry === 0 && hasAbsentGeometryMetadata(value)) ||
    (value.has_geometry === 1 && hasPresentGeometryMetadata(value))
  );
}

function geometryFromRecord(
  record: SearchableRailwaySectionRecord,
): RailwaySectionGeometry {
  if (record.has_geometry === 0) {
    return { status: "absent" };
  }

  return {
    endMilestone: record.pkf,
    gaiaId: record.idgaia,
    railwayType: record.type_ligne,
    startMilestone: record.pkd,
    status: "present",
  };
}

function sectionInputFromRecord(
  record: SearchableRailwaySectionRecord,
): RailwaySectionInput {
  return {
    geometry: geometryFromRecord(record),
    milestoneRange: {
      maximumLabel: record.maximum_label,
      maximumPositionMeters: record.maximum_position_m,
      minimumLabel: record.minimum_label,
      minimumPositionMeters: record.minimum_position_m,
    },
    sectionRank: record.rg_troncon,
  };
}

function addRecordToGroup(
  groups: Map<string, RailwayGroup>,
  record: SearchableRailwaySectionRecord,
): void {
  const existing = groups.get(record.code_ligne);
  if (existing !== undefined && existing.name !== record.lib_ligne) {
    throw new Error(`Conflicting names for railway line ${record.code_ligne}`);
  }

  const group = existing ?? { name: record.lib_ligne, sections: [] };
  group.sections.push(sectionInputFromRecord(record));
  groups.set(record.code_ligne, group);
}

export function railwaySectionRecordsToRailways(
  values: readonly unknown[],
): readonly Railway[] {
  const groups = new Map<string, RailwayGroup>();
  values.forEach((value, index) => {
    if (!isSearchableRailwaySectionRecord(value)) {
      throw new Error(`Invalid searchable railway section at row ${index}`);
    }
    addRecordToGroup(groups, value);
  });

  return [...groups.entries()]
    .map(
      ([code, group]) =>
        new Railway({ code, name: group.name, sections: group.sections }),
    )
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));
}
