import {
  isLatitude,
  isLongitude,
  isPositiveInteger,
  isUnsignedInteger,
} from "../value-validation";

const LINE_CODE_LENGTH = 6;
const MAX_NUMERIC_LINE_CODE = 10 ** LINE_CODE_LENGTH - 1;
const CANONICAL_LINE_CODE = /^\d{6}$/;
const MILESTONE_LABEL = /^(\d+)\+(\d{3})$/;

export interface ParsedMilestoneLabel {
  readonly kilometer: string;
  readonly metric: string;
  readonly positionMeters: number;
}

export function isCanonicalRailwayLineCode(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_LINE_CODE.test(value);
}

export function isRailwaySectionRank(value: unknown): value is number {
  return isPositiveInteger(value);
}

export function isKilometricPosition(value: unknown): value is number {
  return isUnsignedInteger(value);
}

export function isRailwayLatitude(value: unknown): value is number {
  return isLatitude(value);
}

export function isRailwayLongitude(value: unknown): value is number {
  return isLongitude(value);
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

export function parseMilestoneLabel(
  value: string,
): ParsedMilestoneLabel | undefined {
  const match = MILESTONE_LABEL.exec(value);
  if (match === null) {
    return undefined;
  }

  const kilometer = match[1];
  const metric = match[2];
  return Object.freeze({
    kilometer,
    metric,
    positionMeters: Number(kilometer) * 1000 + Number(metric),
  });
}

export function railwaySectionId(
  lineCode: string | number,
  sectionRank: number,
): string {
  if (!isRailwaySectionRank(sectionRank)) {
    throw new Error("Railway section rank must be a positive integer");
  }

  return `${canonicalRailwayLineCode(lineCode)}:${sectionRank}`;
}

export function milestoneId(
  lineCode: string | number,
  sectionRank: number,
  positionMeters: number,
): string {
  if (!isKilometricPosition(positionMeters)) {
    throw new Error("Milestone position must be a non-negative metre value");
  }

  return `${railwaySectionId(lineCode, sectionRank)}:${positionMeters}`;
}

export class RailwaySectionKey {
  readonly #lineCode: string;
  readonly #sectionRank: number;

  public constructor(lineCode: string | number, sectionRank: number) {
    if (!isRailwaySectionRank(sectionRank)) {
      throw new Error("Railway section rank must be a positive integer");
    }

    this.#lineCode = canonicalRailwayLineCode(lineCode);
    this.#sectionRank = sectionRank;
  }

  public get id(): string {
    return railwaySectionId(this.#lineCode, this.#sectionRank);
  }

  public get lineCode(): string {
    return this.#lineCode;
  }

  public get sectionRank(): number {
    return this.#sectionRank;
  }
}
