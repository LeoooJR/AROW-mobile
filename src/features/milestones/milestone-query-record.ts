import { isCanonicalRailwayLineCode } from "@/features/map-features/railway-section-key";
import { Milestone } from "@/features/milestones/milestone";
import {
  isLatitude,
  isLongitude,
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isUnsignedInteger,
} from "@/types/value-validation";

export class MilestoneRecord {
  readonly #label: string;
  readonly #latitude: number;
  readonly #lineCode: string;
  readonly #longitude: number;
  readonly #positionMeters: number;
  readonly #sectionRank: number;

  private constructor(
    lineCode: string,
    sectionRank: number,
    positionMeters: number,
    label: string,
    latitude: number,
    longitude: number,
  ) {
    this.#lineCode = lineCode;
    this.#sectionRank = sectionRank;
    this.#positionMeters = positionMeters;
    this.#label = label;
    this.#latitude = latitude;
    this.#longitude = longitude;
    Object.freeze(this);
  }

  public static fromUnknown(value: unknown, context: string): MilestoneRecord {
    if (
      !isRecord(value) ||
      !isCanonicalRailwayLineCode(value.code_ligne) ||
      !isPositiveInteger(value.rg_troncon) ||
      !isUnsignedInteger(value.position_m) ||
      !isNonEmptyString(value.label) ||
      !isLatitude(value.latitude) ||
      !isLongitude(value.longitude)
    ) {
      throw new Error(`Invalid milestone ${context}`);
    }

    return new MilestoneRecord(
      value.code_ligne,
      value.rg_troncon,
      value.position_m,
      value.label,
      value.latitude,
      value.longitude,
    );
  }

  public get label(): string {
    return this.#label;
  }

  public get latitude(): number {
    return this.#latitude;
  }

  public get lineCode(): string {
    return this.#lineCode;
  }

  public get longitude(): number {
    return this.#longitude;
  }

  public get positionMeters(): number {
    return this.#positionMeters;
  }

  public get sectionRank(): number {
    return this.#sectionRank;
  }

  public toMilestone(): Milestone {
    return new Milestone({
      coordinates: {
        latitude: this.#latitude,
        longitude: this.#longitude,
      },
      label: this.#label,
      lineCode: this.#lineCode,
      positionMeters: this.#positionMeters,
      sectionRank: this.#sectionRank,
    });
  }
}
