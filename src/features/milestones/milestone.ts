import { AbstractRailwaySectionFeature } from "@/features/map-features/abstract-railway-section-feature";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";
import {
  isLatitude,
  isLongitude,
  isUnsignedInteger,
} from "@/types/value-validation";

export interface MilestoneInput {
  readonly coordinates: GeographicCoordinates;
  readonly label: string;
  readonly lineCode: string | number;
  readonly positionMeters: number;
  readonly sectionRank: number;
}

function validatedCoordinates(
  coordinates: GeographicCoordinates,
): GeographicCoordinates {
  const { latitude, longitude } = coordinates;
  if (!isLatitude(latitude) || !isLongitude(longitude)) {
    throw new Error("Milestone coordinates are invalid");
  }

  return Object.freeze({ latitude, longitude });
}

export class Milestone extends AbstractRailwaySectionFeature<"milestone"> {
  public readonly kind = "milestone";

  readonly #coordinates: GeographicCoordinates;
  readonly #label: string;
  readonly #positionMeters: number;

  public constructor(input: MilestoneInput) {
    super(input.lineCode, input.sectionRank);

    if (!isUnsignedInteger(input.positionMeters)) {
      throw new Error("Milestone position must be a non-negative metre value");
    }
    if (input.label.length === 0) {
      throw new Error("Milestone label must not be empty");
    }

    this.#coordinates = validatedCoordinates(input.coordinates);
    this.#label = input.label;
    this.#positionMeters = input.positionMeters;
  }

  public get coordinates(): GeographicCoordinates {
    return this.#coordinates;
  }

  public get id(): string {
    return `${this.key.id}:${this.#positionMeters}`;
  }

  public get kilometer(): number {
    return Math.floor(this.#positionMeters / 1000);
  }

  public get label(): string {
    return this.#label;
  }

  public get positionMeters(): number {
    return this.#positionMeters;
  }
}
