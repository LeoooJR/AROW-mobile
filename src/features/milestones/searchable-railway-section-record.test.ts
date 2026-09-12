import { Railway } from "@/features/railways/railway";

import {
  SearchableRailwaySectionRecord,
  searchableRailwaySectionRecordsToRailways,
} from "./searchable-railway-section-record";

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

function records(values = SECTION_RECORDS) {
  return values.map((value, index) =>
    SearchableRailwaySectionRecord.fromUnknown(value, `at row ${index}`),
  );
}

describe("SearchableRailwaySectionRecord", () => {
  test("exposes validated joined values and converts to section input", () => {
    const record = records()[0];

    expect(record?.lineCode).toBe("893000");
    expect(record?.lineName).toBe(
      "Ligne de Collonges-Fontaines à Lyon-Guillotière",
    );
    expect(record?.sectionRank).toBe(2);
    expect(record?.geometry).toEqual({
      endMilestone: "511+605",
      gaiaId: "gaia-id",
      railwayType: "Ligne",
      startMilestone: "499+752",
      status: "present",
    });
    expect(record?.milestoneRange.maximumPositionMeters).toBe(511_000);
    expect(record?.toRailwaySectionInput().sectionRank).toBe(2);
    expect(Object.isFrozen(record)).toBe(true);
  });

  test("groups records into sorted Railway aggregates", () => {
    const [railway] = searchableRailwaySectionRecordsToRailways(records());

    expect(railway).toBeInstanceOf(Railway);
    expect(railway?.sections.map((section) => section.sectionRank)).toEqual([
      1, 2,
    ]);
    expect(railway?.sections[0]?.railway).toBe(railway);
  });

  test("constructs fallback records with absent geometry", () => {
    const record = SearchableRailwaySectionRecord.fromUnknown(
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
      "at row 0",
    );

    expect(record.geometry).toEqual({ status: "absent" });
    expect(record.toRailwaySectionInput().milestoneRange).toEqual({
      maximumLabel: "1+100",
      maximumPositionMeters: 1_100,
      minimumLabel: "1+100",
      minimumPositionMeters: 1_100,
    });
  });

  test.each([
    ["an invalid range", { ...SECTION_RECORDS[0], minimum_position_m: -1 }],
    ["partial present geometry", { ...SECTION_RECORDS[0], idgaia: null }],
    [
      "partial absent geometry",
      { ...SECTION_RECORDS[0], has_geometry: 0, idgaia: null },
    ],
  ])("rejects %s", (_description, value) => {
    expect(() =>
      SearchableRailwaySectionRecord.fromUnknown(value, "at row 0"),
    ).toThrow("Invalid searchable railway section at row 0");
  });

  test("rejects line-name conflicts and duplicate section ranks", () => {
    const first = records();
    const conflicting = SearchableRailwaySectionRecord.fromUnknown(
      { ...SECTION_RECORDS[1], lib_ligne: "Conflicting name" },
      "at row 2",
    );
    expect(() =>
      searchableRailwaySectionRecordsToRailways([first[0], conflicting]),
    ).toThrow("Conflicting names for railway line 893000");

    const duplicate = SearchableRailwaySectionRecord.fromUnknown(
      { ...SECTION_RECORDS[1], rg_troncon: 2 },
      "at row 2",
    );
    expect(() =>
      searchableRailwaySectionRecordsToRailways([first[0], duplicate]),
    ).toThrow("Railway 893000 contains duplicate section ranks");
  });
});
