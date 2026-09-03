import {
  isFiniteNumberInRange,
  isNonEmptyString,
  isNonNegativeInteger,
  isPositiveInteger,
  isRecord,
  isString,
} from "./value-validation";

describe("value validation", () => {
  test("distinguishes records and strings", () => {
    expect(isRecord({ value: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isString("railway")).toBe(true);
    expect(isString(893000)).toBe(false);
    expect(isNonEmptyString("railway")).toBe(true);
    expect(isNonEmptyString("")).toBe(false);
  });

  test("validates integer signs", () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(1.5)).toBe(false);
  });

  test("validates finite inclusive coordinate ranges", () => {
    expect(isFiniteNumberInRange(-90, -90, 90)).toBe(true);
    expect(isFiniteNumberInRange(90, -90, 90)).toBe(true);
    expect(isFiniteNumberInRange(91, -90, 90)).toBe(false);
    expect(isFiniteNumberInRange(Number.NaN, -90, 90)).toBe(false);
  });
});
