import {
  canonicalRailwayLineCode,
  isCanonicalRailwayLineCode,
  isKilometricPosition,
  isMilestoneLabelForPosition,
  isRailwayLatitude,
  isRailwayLongitude,
  isRailwaySectionRank,
  milestoneId,
  parseMilestoneLabel,
  railwaySectionId,
  RailwaySectionKey,
} from "./values";

describe("railway reference values", () => {
  test.each([
    ["001000", true],
    ["1000", false],
    [1000, false],
    ["ABC000", false],
  ] as const)("validates canonical railway code %p", (lineCode, expected) => {
    expect(isCanonicalRailwayLineCode(lineCode)).toBe(expected);
  });

  test("normalizes codes and builds canonical identifiers", () => {
    expect(canonicalRailwayLineCode(1000)).toBe("001000");
    expect(railwaySectionId(1000, 2)).toBe("001000:2");
    expect(milestoneId("001000", 2, 241_000)).toBe("001000:2:241000");

    const key = new RailwaySectionKey(1000, 2);
    expect(key.lineCode).toBe("001000");
    expect(key.sectionRank).toBe(2);
    expect(key.id).toBe("001000:2");
  });

  test.each([-1, 1.5, 1_000_000, "1000", "ABC000"])(
    "rejects invalid railway line code %p",
    (lineCode) => {
      expect(() => canonicalRailwayLineCode(lineCode)).toThrow();
    },
  );

  test.each([0, -1, 1.5])("rejects invalid section rank %p", (rank) => {
    expect(() => railwaySectionId("001000", rank)).toThrow(
      "Railway section rank must be a positive integer",
    );
  });

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
    "compares milestone label %s with position %s",
    (label, positionMeters, expected) => {
      expect(isMilestoneLabelForPosition(label, positionMeters)).toBe(expected);
    },
  );

  test("validates railway ranks, positions, and coordinate limits", () => {
    expect(isRailwaySectionRank(1)).toBe(true);
    expect(isRailwaySectionRank(0)).toBe(false);
    expect(isKilometricPosition(0)).toBe(true);
    expect(isKilometricPosition(-1)).toBe(false);
    expect(isRailwayLatitude(-90)).toBe(true);
    expect(isRailwayLatitude(90.1)).toBe(false);
    expect(isRailwayLongitude(180)).toBe(true);
    expect(isRailwayLongitude(-180.1)).toBe(false);
  });
});
