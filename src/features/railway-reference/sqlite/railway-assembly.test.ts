import { Railway } from "@/features/railways/railway";

import { searchableSectionRowsToRailways } from "./railway-assembly";

const BASE_ROW = {
  code_ligne: "893000",
  has_geometry: 1,
  idgaia: "gaia-id",
  lib_ligne: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
  maximum_label: "511+000",
  maximum_position_m: 511_000,
  minimum_label: "508+000",
  minimum_position_m: 508_000,
  pkd: "499+752",
  pkf: "511+605",
  rg_troncon: 2,
  type_ligne: "Ligne",
} as const;

function row(overrides: Partial<Record<keyof typeof BASE_ROW, unknown>> = {}) {
  return { ...BASE_ROW, ...overrides };
}

describe("railway assembly", () => {
  test("decodes raw rows into sorted Railway aggregates", () => {
    const railways = searchableSectionRowsToRailways([
      row(),
      row({
        maximum_label: "509+000",
        maximum_position_m: 509_000,
        minimum_label: "499+000",
        minimum_position_m: 499_000,
        rg_troncon: 1,
      }),
      row({
        code_ligne: "008000",
        lib_ligne: "Ligne A",
        maximum_label: "1+100",
        maximum_position_m: 1_100,
        minimum_label: "1+100",
        minimum_position_m: 1_100,
        rg_troncon: 1,
      }),
    ]);

    expect(railways.map((railway) => railway.name)).toEqual([
      "Ligne A",
      "Ligne de Collonges-Fontaines à Lyon-Guillotière",
    ]);

    const railway = railways.find(({ code }) => code === "893000");
    expect(railway).toBeInstanceOf(Railway);
    expect(railway?.sections.map((section) => section.sectionRank)).toEqual([
      1, 2,
    ]);
    expect(railway?.sections[0]?.railway).toBe(railway);
    expect(railway?.sections[1]?.geometry).toEqual({
      endMilestone: "511+605",
      gaiaId: "gaia-id",
      railwayType: "Ligne",
      startMilestone: "499+752",
      status: "present",
    });
    expect(railway?.sections[1]?.milestoneRange).toEqual({
      maximumLabel: "511+000",
      maximumPositionMeters: 511_000,
      minimumLabel: "508+000",
      minimumPositionMeters: 508_000,
    });
  });

  test("constructs sections with absent geometry", () => {
    const [railway] = searchableSectionRowsToRailways([
      row({
        code_ligne: "008000",
        has_geometry: 0,
        idgaia: null,
        lib_ligne: "Ligne 008000",
        maximum_label: "1+100",
        maximum_position_m: 1_100,
        minimum_label: "1+100",
        minimum_position_m: 1_100,
        pkd: null,
        pkf: null,
        rg_troncon: 1,
        type_ligne: null,
      }),
    ]);

    expect(railway?.sections[0]?.geometry).toEqual({ status: "absent" });
    expect(railway?.sections[0]?.milestoneRange).toEqual({
      maximumLabel: "1+100",
      maximumPositionMeters: 1_100,
      minimumLabel: "1+100",
      minimumPositionMeters: 1_100,
    });
  });

  test.each([
    ["an invalid range", row({ minimum_position_m: -1 })],
    ["partial present geometry", row({ idgaia: null })],
    ["partial absent geometry", row({ has_geometry: 0, idgaia: null })],
  ])("rejects %s with its row index", (_description, value) => {
    expect(() =>
      searchableSectionRowsToRailways([row({ rg_troncon: 1 }), value]),
    ).toThrow("Invalid searchable railway section at row 1");
  });

  test("rejects line-name conflicts and duplicate section ranks", () => {
    expect(() =>
      searchableSectionRowsToRailways([
        row(),
        row({ lib_ligne: "Conflicting name", rg_troncon: 1 }),
      ]),
    ).toThrow("Conflicting names for railway line 893000");

    expect(() => searchableSectionRowsToRailways([row(), row()])).toThrow(
      "Railway 893000 contains duplicate section ranks",
    );
  });
});
