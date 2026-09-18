import type {
  RailwayMilestoneRange,
  RailwaySectionGeometry,
  RailwaySectionInput,
} from "@/features/railways/railway-section";
import {
  isNonEmptyString,
  isRecord,
  isUnsignedInteger,
} from "@shared/value-validation";
import {
  decodeRailwaySectionDatabaseRow,
  type RailwaySectionDatabaseRow,
} from "@shared/railway-reference/records";

type GeometryRecord =
  | {
      readonly endMilestone: string;
      readonly gaiaId: string;
      readonly railwayType: string;
      readonly startMilestone: string;
      readonly status: "present";
    }
  | { readonly status: "absent" };

export class SearchableRailwaySectionRow {
  readonly #geometry: GeometryRecord;
  readonly #lineCode: string;
  readonly #lineName: string;
  readonly #milestoneRange: RailwayMilestoneRange;
  readonly #sectionRank: number;

  private constructor(
    lineCode: string,
    lineName: string,
    sectionRank: number,
    geometry: GeometryRecord,
    milestoneRange: RailwayMilestoneRange,
  ) {
    this.#lineCode = lineCode;
    this.#lineName = lineName;
    this.#sectionRank = sectionRank;
    this.#geometry = Object.freeze(geometry);
    this.#milestoneRange = Object.freeze(milestoneRange);
    Object.freeze(this);
  }

  public static fromUnknown(
    value: unknown,
    context: string,
  ): SearchableRailwaySectionRow {
    if (
      !isRecord(value) ||
      !isUnsignedInteger(value.minimum_position_m) ||
      !isNonEmptyString(value.minimum_label) ||
      !isUnsignedInteger(value.maximum_position_m) ||
      !isNonEmptyString(value.maximum_label) ||
      value.minimum_position_m > value.maximum_position_m
    ) {
      throw new Error(`Invalid searchable railway section ${context}`);
    }

    let section: RailwaySectionDatabaseRow;
    try {
      section = decodeRailwaySectionDatabaseRow(value, context);
    } catch {
      throw new Error(`Invalid searchable railway section ${context}`);
    }

    return new SearchableRailwaySectionRow(
      section.code_ligne,
      section.lib_ligne,
      section.rg_troncon,
      SearchableRailwaySectionRow.geometryFrom(section),
      {
        maximumLabel: value.maximum_label,
        maximumPositionMeters: value.maximum_position_m,
        minimumLabel: value.minimum_label,
        minimumPositionMeters: value.minimum_position_m,
      },
    );
  }

  private static geometryFrom(
    value: RailwaySectionDatabaseRow,
  ): GeometryRecord {
    if (value.has_geometry === 0) {
      return { status: "absent" };
    }

    return {
      endMilestone: value.pkf,
      gaiaId: value.idgaia,
      railwayType: value.type_ligne,
      startMilestone: value.pkd,
      status: "present",
    };
  }

  public get geometry(): RailwaySectionGeometry {
    return this.#geometry;
  }

  public get lineCode(): string {
    return this.#lineCode;
  }

  public get lineName(): string {
    return this.#lineName;
  }

  public get milestoneRange(): RailwayMilestoneRange {
    return this.#milestoneRange;
  }

  public get sectionRank(): number {
    return this.#sectionRank;
  }

  public toRailwaySectionInput(): RailwaySectionInput {
    return {
      geometry: this.#geometry,
      milestoneRange: this.#milestoneRange,
      sectionRank: this.#sectionRank,
    };
  }
}
