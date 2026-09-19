import { AbstractMapFeature } from "@/features/map-features/abstract-map-feature";

import { Milestone } from "./milestone";

const INPUT = {
  coordinates: { latitude: 45.74491, longitude: 4.86234 },
  label: "241+000",
  lineCode: 1000,
  positionMeters: 241_000,
  sectionRank: 1,
} as const;

describe("Milestone", () => {
  test("encapsulates milestone identity and values", () => {
    const milestone = new Milestone(INPUT);

    expect(milestone).toBeInstanceOf(AbstractMapFeature);
    expect(milestone.kind).toBe("milestone");
    expect(milestone.id).toBe("001000:1:241000");
    expect(milestone.key.id).toBe("001000:1");
    expect(milestone.lineCode).toBe("001000");
    expect(milestone.sectionRank).toBe(1);
    expect(milestone.kilometer).toBe(241);
    expect(milestone.positionMeters).toBe(241_000);
    expect(milestone.label).toBe("241+000");
    expect(milestone.coordinates).toEqual(INPUT.coordinates);
    expect(Object.isFrozen(milestone.coordinates)).toBe(true);
  });

  test.each([
    ["negative metre position", { ...INPUT, positionMeters: -1 }],
    ["fractional metre position", { ...INPUT, positionMeters: 1.5 }],
    ["infinite metre position", { ...INPUT, positionMeters: Infinity }],
    ["empty label", { ...INPUT, label: "" }],
    [
      "invalid latitude",
      { ...INPUT, coordinates: { latitude: 91, longitude: 0 } },
    ],
    [
      "invalid longitude",
      { ...INPUT, coordinates: { latitude: 0, longitude: 181 } },
    ],
  ])("rejects an invalid %s", (_description, input) => {
    expect(() => new Milestone(input)).toThrow();
  });

  test.each([
    [-90, -180],
    [90, 180],
  ])("accepts boundary coordinates %s, %s", (latitude, longitude) => {
    expect(
      new Milestone({ ...INPUT, coordinates: { latitude, longitude } })
        .coordinates,
    ).toEqual({ latitude, longitude });
  });
});
