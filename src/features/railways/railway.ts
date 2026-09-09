import { canonicalRailwayLineCode } from "@/features/map-features/railway-section-key";
import {
  RailwaySection,
  type RailwaySectionInput,
} from "@/features/railways/railway-section";
import { isNonEmptyString } from "@/types/value-validation";

export interface RailwayInput {
  readonly code: string | number;
  readonly name: string;
  readonly sections: readonly RailwaySectionInput[];
}

export class Railway {
  readonly #code: string;
  readonly #name: string;
  readonly #sections: readonly RailwaySection[];

  public constructor(input: RailwayInput) {
    if (!isNonEmptyString(input.name)) {
      throw new Error("Railway name must not be empty");
    }
    if (input.sections.length === 0) {
      throw new Error("Railway must contain at least one section");
    }

    this.#code = canonicalRailwayLineCode(input.code);
    this.#name = input.name;
    const sections = input.sections
      .map((section) => new RailwaySection(this, section))
      .sort((left, right) => left.sectionRank - right.sectionRank);
    const ranks = new Set(sections.map((section) => section.sectionRank));
    if (ranks.size !== sections.length) {
      throw new Error(`Railway ${this.#code} contains duplicate section ranks`);
    }
    this.#sections = Object.freeze(sections);
  }

  public get code(): string {
    return this.#code;
  }

  public get name(): string {
    return this.#name;
  }

  public get sections(): readonly RailwaySection[] {
    return this.#sections;
  }
}
