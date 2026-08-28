import {
  canonicalRailwayLineCode,
  milestoneId,
  railwaySectionId,
  railwaySectionKey,
} from "./map-features";
import type { MapFeature } from "@/types/map-feature";

describe("map feature identities", () => {
  test("normalizes numeric railway line codes without losing leading zeroes", () => {
    expect(canonicalRailwayLineCode(1000)).toBe("001000");
    expect(canonicalRailwayLineCode("001000")).toBe("001000");
  });

  test.each([-1, 1.5, 1_000_000, "1000", "ABC000"])(
    "rejects invalid railway line code %p",
    (value) => {
      expect(() => canonicalRailwayLineCode(value)).toThrow();
    },
  );

  test("builds related section and milestone IDs", () => {
    const milestone = {
      coordinates: { latitude: 48.89, longitude: 2.36 },
      kilometer: 1,
      kind: "milestone",
      label: "001+000",
      lineCode: "001000",
      sectionRank: 1,
    } as const;

    expect(railwaySectionId(milestone)).toBe("001000:1");
    expect(milestoneId(milestone)).toBe("001000:1:1");
  });

  test.each<MapFeature>([
    {
      endMilestone: "137+980",
      gaiaId: "gaia-id",
      kind: "railway",
      lineCode: "340311",
      name: "Raccordement de Rouen-Martainville",
      railwayType: "Raccordement",
      sectionRank: 1,
      startMilestone: "136+772",
    },
    {
      coordinates: { latitude: 48.89, longitude: 2.36 },
      kilometer: 1,
      kind: "milestone",
      label: "001+000",
      lineCode: "001000",
      sectionRank: 1,
    },
  ])("extracts the parent section from a $kind feature", (feature) => {
    expect(railwaySectionKey(feature)).toEqual({
      lineCode: feature.lineCode,
      sectionRank: feature.sectionRank,
    });
  });
});
