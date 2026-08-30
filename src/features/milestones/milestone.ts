import { AbstractRailwaySectionFeature } from "@/features/map-features/abstract-railway-section-feature";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export interface MilestoneInput {
  readonly coordinates: GeographicCoordinates;
  readonly kilometer: number;
  readonly label: string;
  readonly lineCode: string | number;
  readonly sectionRank: number;
}

function validatedCoordinates(
  coordinates: GeographicCoordinates,
): GeographicCoordinates {
  const { latitude, longitude } = coordinates;
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Milestone coordinates are invalid");
  }

  return Object.freeze({ latitude, longitude });
}

export class Milestone extends AbstractRailwaySectionFeature<"milestone"> {
  public readonly kind = "milestone";

  readonly #coordinates: GeographicCoordinates;
  readonly #kilometer: number;
  readonly #label: string;

  public constructor(input: MilestoneInput) {
    super(input.lineCode, input.sectionRank);

    if (!Number.isInteger(input.kilometer) || input.kilometer < 0) {
      throw new Error("Milestone kilometer must be a non-negative integer");
    }
    if (input.label.length === 0) {
      throw new Error("Milestone label must not be empty");
    }

    this.#coordinates = validatedCoordinates(input.coordinates);
    this.#kilometer = input.kilometer;
    this.#label = input.label;
  }

  public get coordinates(): GeographicCoordinates {
    return this.#coordinates;
  }

  public get id(): string {
    return `${this.key.id}:${this.#kilometer}`;
  }

  public get kilometer(): number {
    return this.#kilometer;
  }

  public get label(): string {
    return this.#label;
  }
}
