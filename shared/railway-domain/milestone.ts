import { AbstractRailwayNetworkFeature } from "./abstract-railway-network-feature";
import {
  createGeographicCoordinates,
  type GeographicCoordinates,
} from "../geographic-coordinates";
import { isMilestoneLabelForPosition } from "./kilometric-position";
import type { MilestoneId } from "./milestone-id";

export interface MilestoneInput {
  readonly coordinates: GeographicCoordinates;
  readonly label: string;
  readonly id: MilestoneId;
}

export class Milestone extends AbstractRailwayNetworkFeature<
  "milestone",
  MilestoneId
> {
  public readonly kind = "milestone";

  readonly #coordinates: GeographicCoordinates;
  readonly #label: string;

  public constructor(input: MilestoneInput) {
    super(input.id);
    if (input.label.length === 0) {
      throw new Error("Milestone label must not be empty");
    }
    if (!isMilestoneLabelForPosition(input.label, input.id.positionMeters)) {
      throw new Error("Milestone label and position must agree");
    }

    this.#coordinates = createGeographicCoordinates(
      input.coordinates,
      "Milestone coordinates",
    );
    this.#label = input.label;
  }

  public get coordinates(): GeographicCoordinates {
    return this.#coordinates;
  }

  public get kilometer(): number {
    return Math.floor(this.id.positionMeters / 1000);
  }

  public get label(): string {
    return this.#label;
  }

  public get positionMeters(): number {
    return this.id.positionMeters;
  }
}
