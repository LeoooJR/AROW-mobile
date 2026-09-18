import { Railway } from "@/features/railways/railway";

import { searchableSectionRowsToRailways } from "./railway-assembly";
import { SearchableRailwaySectionRow } from "./searchable-section-row";

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

function row(
  overrides: Partial<Record<keyof typeof BASE_ROW, unknown>>,
  context: string,
): SearchableRailwaySectionRow {
  return SearchableRailwaySectionRow.fromUnknown(
    { ...BASE_ROW, ...overrides },
    context,
  );
}

describe("railway assembly", () => {
  test("groups rows into sorted Railway aggregates", () => {
    const rows = [
      row({}, "at row 0"),
      row(
        {
          maximum_label: "509+000",
          maximum_position_m: 509_000,
          minimum_label: "499+000",
          minimum_position_m: 499_000,
          rg_troncon: 1,
        },
        "at row 1",
      ),
    ];

    const [railway] = searchableSectionRowsToRailways(rows);
    expect(railway).toBeInstanceOf(Railway);
    expect(railway?.sections.map((section) => section.sectionRank)).toEqual([
      1, 2,
    ]);
    expect(railway?.sections[0]?.railway).toBe(railway);
  });

  test("rejects line-name conflicts and duplicate section ranks", () => {
    const original = row({}, "at row 0");
    const conflicting = row(
      { lib_ligne: "Conflicting name", rg_troncon: 1 },
      "at row 1",
    );
    expect(() =>
      searchableSectionRowsToRailways([original, conflicting]),
    ).toThrow("Conflicting names for railway line 893000");

    const duplicate = row({}, "at row 1");
    expect(() =>
      searchableSectionRowsToRailways([original, duplicate]),
    ).toThrow("Railway 893000 contains duplicate section ranks");
  });
});
