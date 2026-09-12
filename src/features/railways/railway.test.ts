import { AbstractMapFeature } from "@/features/map-features/abstract-map-feature";

import { Railway } from "./railway";

const GEOMETRY = {
  endMilestone: "137+980",
  gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
  railwayType: "Raccordement",
  startMilestone: "136+772",
  status: "present",
} as const;

function createRailway(): Railway {
  return new Railway({
    code: "340311",
    name: "Raccordement de Rouen-Martainville",
    sections: [
      { geometry: { status: "absent" }, sectionRank: 2 },
      {
        geometry: GEOMETRY,
        milestoneRange: {
          maximumLabel: "137+000",
          maximumPositionMeters: 137_000,
          minimumLabel: "136+000",
          minimumPositionMeters: 136_000,
        },
        sectionRank: 1,
      },
    ],
  });
}

describe("Railway", () => {
  test("owns sorted sections with immutable parent relationships", () => {
    const railway = createRailway();
    const [first, second] = railway.sections;

    expect(railway.code).toBe("340311");
    expect(railway.name).toBe("Raccordement de Rouen-Martainville");
    expect(railway.sections.map((section) => section.sectionRank)).toEqual([
      1, 2,
    ]);
    expect(first).toBeInstanceOf(AbstractMapFeature);
    expect(first?.railway).toBe(railway);
    expect(second?.railway).toBe(railway);
    expect(first?.kind).toBe("railway");
    expect(first?.id).toBe("340311:1");
    expect(first?.geometry).toEqual(GEOMETRY);
    expect(second?.geometry).toEqual({ status: "absent" });
  });

  test("canonicalizes numeric line identity", () => {
    const railway = new Railway({
      code: 8_000,
      name: "Ligne 008000",
      sections: [{ geometry: { status: "absent" }, sectionRank: 1 }],
    });

    expect(railway.code).toBe("008000");
    expect(railway.sections[0]?.lineCode).toBe("008000");
  });

  test("rejects invalid aggregates and duplicate ranks", () => {
    expect(
      () => new Railway({ code: "340311", name: "", sections: [] }),
    ).toThrow("Railway name must not be empty");
    expect(
      () => new Railway({ code: "340311", name: "Ligne", sections: [] }),
    ).toThrow("Railway must contain at least one section");
    expect(
      () =>
        new Railway({
          code: "340311",
          name: "Ligne",
          sections: [
            { geometry: { status: "absent" }, sectionRank: 1 },
            { geometry: { status: "absent" }, sectionRank: 1 },
          ],
        }),
    ).toThrow("Railway 340311 contains duplicate section ranks");
  });

  test("validates geometry metadata and milestone ranges", () => {
    const absentGeometryWithMetadata = Object.assign(
      { status: "absent" as const },
      { gaiaId: "unexpected" },
    );
    expect(
      () =>
        new Railway({
          code: "340311",
          name: "Ligne",
          sections: [{ geometry: absentGeometryWithMetadata, sectionRank: 1 }],
        }),
    ).toThrow(
      "Railway section without geometry must not contain geometry metadata",
    );
    expect(
      () =>
        new Railway({
          code: "340311",
          name: "Ligne",
          sections: [
            {
              geometry: { ...GEOMETRY, gaiaId: "" },
              sectionRank: 1,
            },
          ],
        }),
    ).toThrow("Railway section geometry metadata must be complete");
    expect(
      () =>
        new Railway({
          code: "340311",
          name: "Ligne",
          sections: [
            {
              geometry: { status: "absent" },
              milestoneRange: {
                maximumLabel: "1+000",
                maximumPositionMeters: 1_000,
                minimumLabel: "2+000",
                minimumPositionMeters: 2_000,
              },
              sectionRank: 1,
            },
          ],
        }),
    ).toThrow("Railway section milestone range is invalid");
  });
});
