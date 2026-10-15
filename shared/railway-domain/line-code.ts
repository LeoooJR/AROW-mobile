const LINE_CODE_LENGTH = 6;

const MAX_NUMERIC_LINE_CODE = 10 ** LINE_CODE_LENGTH - 1;

const CANONICAL_LINE_CODE = /^\d{6}$/;

export function isCanonicalRailwayLineCode(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_LINE_CODE.test(value);
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
