import {
  isKilometricPosition,
  isMilestoneLabelForPosition,
  parseMilestoneLabel,
} from "./kilometric-position";

test("parses canonical milestone labels", () => {
  expect(parseMilestoneLabel("241+007")).toEqual({
    kilometer: "241",
    metric: "007",
    positionMeters: 241_007,
  });
  expect(parseMilestoneLabel("D+000")).toBeUndefined();
  expect(parseMilestoneLabel("241+07")).toBeUndefined();
});

test.each([
  ["001+000", 1_000, true],
  ["0+000", 0, true],
  ["509+000", 509_000, true],
  ["509+000", 508_000, false],
  ["509+00", 509_000, false],
  ["D+000", 0, false],
  ["0+000", -1, false],
] as const)(
  "compares label %s with position %s",
  (label, position, expected) => {
    expect(isMilestoneLabelForPosition(label, position)).toBe(expected);
  },
);

test("accepts zero and rejects negative PK positions", () => {
  expect(isKilometricPosition(0)).toBe(true);
  expect(isKilometricPosition(-1)).toBe(false);
});
