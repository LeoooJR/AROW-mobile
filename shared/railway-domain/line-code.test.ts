import {
  canonicalRailwayLineCode,
  isCanonicalRailwayLineCode,
} from "./line-code";

test.each([
  ["001000", true],
  ["1000", false],
  [1000, false],
  ["ABC000", false],
] as const)("validates canonical railway code %p", (code, expected) => {
  expect(isCanonicalRailwayLineCode(code)).toBe(expected);
});

test("normalizes numeric codes without changing canonical strings", () => {
  expect(canonicalRailwayLineCode(1000)).toBe("001000");
  expect(canonicalRailwayLineCode("001000")).toBe("001000");
});

test.each([-1, 1.5, 1_000_000, "1000", "ABC000"])(
  "rejects invalid code %p",
  (code) => {
    expect(() => canonicalRailwayLineCode(code)).toThrow();
  },
);
