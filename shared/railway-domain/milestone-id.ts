import { isKilometricPosition } from "./kilometric-position";
import type { RailwaySectionId } from "./railway-section-id";

export class MilestoneId {
  readonly #sectionId: RailwaySectionId;
  readonly #positionMeters: number;

  public constructor(sectionId: RailwaySectionId, positionMeters: number) {
    if (!isKilometricPosition(positionMeters)) {
      throw new Error("Milestone position must be a non-negative metre value");
    }
    this.#sectionId = sectionId;
    this.#positionMeters = positionMeters;
  }

  public get sectionId(): RailwaySectionId {
    return this.#sectionId;
  }

  public get positionMeters(): number {
    return this.#positionMeters;
  }

  public get lineCode(): string {
    return this.#sectionId.lineCode;
  }

  public get sectionRank(): number {
    return this.#sectionId.sectionRank;
  }

  public get value(): string {
    return `${this.#sectionId.value}:${this.#positionMeters}`;
  }
}
