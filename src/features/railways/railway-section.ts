import { AbstractRailwaySectionFeature } from "@/features/map-features/abstract-railway-section-feature";
import type { Railway } from "@/features/railways/railway";
import { isNonEmptyString, isUnsignedInteger } from "@/types/value-validation";

export type RailwaySectionGeometry =
  | {
      readonly endMilestone: string;
      readonly gaiaId: string;
      readonly railwayType: string;
      readonly startMilestone: string;
      readonly status: "present";
    }
  | { readonly status: "absent" };

export interface RailwayMilestoneRange {
  readonly maximumLabel: string;
  readonly maximumPositionMeters: number;
  readonly minimumLabel: string;
  readonly minimumPositionMeters: number;
}

export interface RailwaySectionInput {
  readonly geometry: RailwaySectionGeometry;
  readonly milestoneRange?: RailwayMilestoneRange;
  readonly sectionRank: number;
}

function validateGeometry(
  geometry: RailwaySectionGeometry,
): RailwaySectionGeometry {
  if (geometry.status === "absent") {
    if (
      "gaiaId" in geometry ||
      "railwayType" in geometry ||
      "startMilestone" in geometry ||
      "endMilestone" in geometry
    ) {
      throw new Error(
        "Railway section without geometry must not contain geometry metadata",
      );
    }
    return Object.freeze({ status: "absent" });
  }

  if (
    !isNonEmptyString(geometry.gaiaId) ||
    !isNonEmptyString(geometry.railwayType) ||
    !isNonEmptyString(geometry.startMilestone) ||
    !isNonEmptyString(geometry.endMilestone)
  ) {
    throw new Error("Railway section geometry metadata must be complete");
  }
  return Object.freeze({ ...geometry });
}

function validateMilestoneRange(
  range: RailwayMilestoneRange | undefined,
): RailwayMilestoneRange | undefined {
  if (range === undefined) {
    return undefined;
  }
  if (
    !isNonEmptyString(range.minimumLabel) ||
    !isNonEmptyString(range.maximumLabel) ||
    !isUnsignedInteger(range.minimumPositionMeters) ||
    !isUnsignedInteger(range.maximumPositionMeters) ||
    range.minimumPositionMeters > range.maximumPositionMeters
  ) {
    throw new Error("Railway section milestone range is invalid");
  }
  return Object.freeze({ ...range });
}

export class RailwaySection extends AbstractRailwaySectionFeature<"railway"> {
  public readonly kind = "railway";

  readonly #geometry: RailwaySectionGeometry;
  readonly #milestoneRange: RailwayMilestoneRange | undefined;
  readonly #railway: Railway;

  public constructor(railway: Railway, input: RailwaySectionInput) {
    super(railway.code, input.sectionRank);
    this.#railway = railway;
    this.#geometry = validateGeometry(input.geometry);
    this.#milestoneRange = validateMilestoneRange(input.milestoneRange);
  }

  public get geometry(): RailwaySectionGeometry {
    return this.#geometry;
  }

  public get id(): string {
    return this.key.id;
  }

  public get milestoneRange(): RailwayMilestoneRange | undefined {
    return this.#milestoneRange;
  }

  public get name(): string {
    return this.#railway.name;
  }

  public get railway(): Railway {
    return this.#railway;
  }
}
