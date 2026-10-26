import { AbstractRailwayNetworkFeature } from "./abstract-railway-network-feature";
import type { Railway } from "./railway";
import type { RailwayMilestoneRange } from "./railway-milestone-range";
import { isNonEmptyString, isUnsignedInteger } from "../value-validation";
import { isMilestoneLabelForPosition } from "./kilometric-position";
import { RailwaySectionId } from "./railway-section-id";

/** Geometry availability and infrastructure metadata, independent of recorded points. */
export type RailwaySectionGeometry =
  | {
      readonly gaiaId: string;
      readonly railwayType: string;
      readonly status: "present";
    }
  | { readonly status: "absent" };

export interface RailwaySectionInput {
  readonly geometry: RailwaySectionGeometry;
  readonly milestoneRange?: RailwayMilestoneRange;
  readonly sectionRank: number;
}

function validateGeometry(
  geometry: RailwaySectionGeometry,
): RailwaySectionGeometry {
  if (geometry.status === "absent") {
    if ("gaiaId" in geometry || "railwayType" in geometry) {
      throw new Error(
        "Railway section without geometry must not contain geometry metadata",
      );
    }
    return Object.freeze({ status: "absent" });
  }

  if (
    !isNonEmptyString(geometry.gaiaId) ||
    !isNonEmptyString(geometry.railwayType)
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
    !isMilestoneLabelForPosition(
      range.minimumLabel,
      range.minimumPositionMeters,
    ) ||
    !isMilestoneLabelForPosition(
      range.maximumLabel,
      range.maximumPositionMeters,
    ) ||
    range.minimumPositionMeters > range.maximumPositionMeters
  ) {
    throw new Error("Railway section milestone range is invalid");
  }
  return Object.freeze({ ...range });
}

export class RailwaySection extends AbstractRailwayNetworkFeature<
  "railway-section",
  RailwaySectionId
> {
  public readonly kind = "railway-section";

  readonly #geometry: RailwaySectionGeometry;
  readonly #milestoneRange: RailwayMilestoneRange | undefined;
  readonly #railway: Railway;

  public constructor(railway: Railway, input: RailwaySectionInput) {
    super(new RailwaySectionId(railway.code, input.sectionRank));
    this.#railway = railway;
    this.#geometry = validateGeometry(input.geometry);
    this.#milestoneRange = validateMilestoneRange(input.milestoneRange);
  }

  public get geometry(): RailwaySectionGeometry {
    return this.#geometry;
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
