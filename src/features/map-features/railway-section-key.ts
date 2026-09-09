const LINE_CODE_LENGTH = 6;
const MAX_NUMERIC_LINE_CODE = 10 ** LINE_CODE_LENGTH - 1;

export function isCanonicalRailwayLineCode(value: unknown): value is string {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

export function canonicalRailwayLineCode(value: string | number): string {
  if (typeof value === "string") {
    if (isCanonicalRailwayLineCode(value)) {
      return value;
    }

    throw new Error("Railway line code must contain exactly six digits");
  }

  if (!Number.isInteger(value) || value < 0 || value > MAX_NUMERIC_LINE_CODE) {
    throw new Error("Numeric railway line code must be between 0 and 999999");
  }

  return String(value).padStart(LINE_CODE_LENGTH, "0");
}

export class RailwaySectionKey {
  readonly #lineCode: string;
  readonly #sectionRank: number;

  public constructor(lineCode: string | number, sectionRank: number) {
    if (!Number.isInteger(sectionRank) || sectionRank <= 0) {
      throw new Error("Railway section rank must be a positive integer");
    }

    this.#lineCode = canonicalRailwayLineCode(lineCode);
    this.#sectionRank = sectionRank;
  }

  public get id(): string {
    return `${this.#lineCode}:${this.#sectionRank}`;
  }

  public get lineCode(): string {
    return this.#lineCode;
  }

  public get sectionRank(): number {
    return this.#sectionRank;
  }
}
