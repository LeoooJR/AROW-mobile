import { Railway } from "@/features/railways/railway";

import { railwaySectionRecordsToRailways } from "./railway-section-record";

const GEOMETRY = {
  has_geometry: 1,
  idgaia: "gaia-id",
  pkd: "499+752",
  pkf: "511+605",
  type_ligne: "Ligne",
} as const;

const SECTION_RECORDS = [
  {
    ...GEOMETRY,
    code_ligne: "893000",
    lib_ligne: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
    maximum_label: "511+000",
    maximum_position_m: 511_000,
    minimum_label: "508+000",
    minimum_position_m: 508_000,
    rg_troncon: 2,
  },
  {
    ...GEOMETRY,
    code_ligne: "893000",
    lib_ligne: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
    maximum_label: "509+000",
    maximum_position_m: 509_000,
    minimum_label: "499+000",
    minimum_position_m: 499_000,
    rg_troncon: 1,
  },
] as const;

describe("railway section records", () => {
  test("groups records into Railway aggregates with sorted child sections", () => {
    const [railway] = railwaySectionRecordsToRailways(SECTION_RECORDS);

    expect(railway).toBeInstanceOf(Railway);
    expect(railway?.code).toBe("893000");
    expect(railway?.sections.map((section) => section.sectionRank)).toEqual([
      1, 2,
    ]);
    expect(railway?.sections[0]?.railway).toBe(railway);
    expect(railway?.sections[0]?.geometry).toEqual({
      endMilestone: "511+605",
      gaiaId: "gaia-id",
      railwayType: "Ligne",
      startMilestone: "499+752",
      status: "present",
    });
  });

  test("constructs searchable fallback sections without geometry", () => {
    const [railway] = railwaySectionRecordsToRailways([
      {
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
      },
    ]);

    expect(railway?.sections[0]?.geometry).toEqual({ status: "absent" });
    expect(railway?.sections[0]?.milestoneRange).toEqual({
      maximumLabel: "1+100",
      maximumPositionMeters: 1_100,
      minimumLabel: "1+100",
      minimumPositionMeters: 1_100,
    });
  });

  test("rejects malformed records, metadata conflicts, and duplicate ranks", () => {
    expect(() =>
      railwaySectionRecordsToRailways([
        { ...SECTION_RECORDS[0], minimum_position_m: -1 },
      ]),
    ).toThrow("Invalid searchable railway section at row 0");
    expect(() =>
      railwaySectionRecordsToRailways([
        SECTION_RECORDS[0],
        { ...SECTION_RECORDS[1], lib_ligne: "Conflicting name" },
      ]),
    ).toThrow("Conflicting names for railway line 893000");
    expect(() =>
      railwaySectionRecordsToRailways([
        SECTION_RECORDS[0],
        { ...SECTION_RECORDS[1], rg_troncon: 2 },
      ]),
    ).toThrow("Railway 893000 contains duplicate section ranks");
  });
});
