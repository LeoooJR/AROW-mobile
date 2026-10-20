import { isPositiveInteger } from "../value-validation";
import { canonicalRailwayLineCode } from "./line-code";

export function isRailwaySectionRank(value: unknown): value is number {
  return isPositiveInteger(value);
}

export class RailwaySectionId {
  readonly #lineCode: string;
  readonly #sectionRank: number;

  public constructor(lineCode: string | number, sectionRank: number) {
    if (!isRailwaySectionRank(sectionRank)) {
      throw new Error("Railway section rank must be a positive integer");
    }

    this.#lineCode = canonicalRailwayLineCode(lineCode);
    this.#sectionRank = sectionRank;
  }

  public get value(): string {
    return `${this.#lineCode}:${this.#sectionRank}`;
  }

  public get lineCode(): string {
    return this.#lineCode;
  }

  public get sectionRank(): number {
    return this.#sectionRank;
  }
}
