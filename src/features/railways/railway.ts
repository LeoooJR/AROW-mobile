import { AbstractRailwaySectionFeature } from "@/features/map-features/abstract-railway-section-feature";

export interface RailwayInput {
  readonly endMilestone: string;
  readonly gaiaId: string;
  readonly lineCode: string | number;
  readonly name: string;
  readonly railwayType: string;
  readonly sectionRank: number;
  readonly startMilestone: string;
}

function requireNonEmpty(value: string, field: string): string {
  if (value.length === 0) {
    throw new Error(`Railway ${field} must not be empty`);
  }

  return value;
}

export class Railway extends AbstractRailwaySectionFeature<"railway"> {
  public readonly kind = "railway";

  readonly #endMilestone: string;
  readonly #gaiaId: string;
  readonly #name: string;
  readonly #railwayType: string;
  readonly #startMilestone: string;

  public constructor(input: RailwayInput) {
    super(input.lineCode, input.sectionRank);
    this.#endMilestone = requireNonEmpty(input.endMilestone, "end milestone");
    this.#gaiaId = requireNonEmpty(input.gaiaId, "GAIA ID");
    this.#name = requireNonEmpty(input.name, "name");
    this.#railwayType = requireNonEmpty(input.railwayType, "type");
    this.#startMilestone = requireNonEmpty(
      input.startMilestone,
      "start milestone",
    );
  }

  public get endMilestone(): string {
    return this.#endMilestone;
  }

  public get gaiaId(): string {
    return this.#gaiaId;
  }

  public get id(): string {
    return this.key.id;
  }

  public get name(): string {
    return this.#name;
  }

  public get railwayType(): string {
    return this.#railwayType;
  }

  public get startMilestone(): string {
    return this.#startMilestone;
  }
}
