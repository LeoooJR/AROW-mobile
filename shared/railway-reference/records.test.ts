import {
  decodeKilometricPointDatabaseRow,
  decodeRailwaySectionDatabaseRow,
} from "./records";

const MILESTONE = {
  code_ligne: "001000",
  label: "241+000",
  latitude: 45.74491,
  longitude: 4.86234,
  position_m: 241_000,
  rg_troncon: 1,
};

const SECTION = {
  code_ligne: "893000",
  has_geometry: 1,
  idgaia: "gaia-id",
  lib_ligne: "Ligne de test",
  pkd: "499+752",
  pkf: "511+605",
  rg_troncon: 1,
  type_ligne: "Ligne",
} as const;

describe("railway reference database rows", () => {
  test("decodes milestones and ignores additional projected fields", () => {
    const row = decodeKilometricPointDatabaseRow(
      { ...MILESTONE, aggregate: 1 },
      "at row 0",
    );
    expect(row).toEqual(MILESTONE);
    expect(Object.isFrozen(row)).toBe(true);
  });

  test.each([
    { ...MILESTONE, label: undefined },
    { ...MILESTONE, position_m: -1 },
    { ...MILESTONE, latitude: 91 },
    { ...MILESTONE, longitude: -181 },
  ])("rejects malformed milestone %#", (value) => {
    expect(() => decodeKilometricPointDatabaseRow(value, "at row 0")).toThrow(
      "Invalid milestone at row 0",
    );
  });

  test("decodes geometric and fallback sections", () => {
    expect(
      decodeRailwaySectionDatabaseRow({ ...SECTION, aggregate: 1 }, "at row 0"),
    ).toEqual(SECTION);
    expect(
      decodeRailwaySectionDatabaseRow(
        {
          code_ligne: "008000",
          has_geometry: 0,
          idgaia: null,
          lib_ligne: "Ligne 008000",
          pkd: null,
          pkf: null,
          rg_troncon: 1,
          type_ligne: null,
        },
        "at row 1",
      ),
    ).toMatchObject({ has_geometry: 0, idgaia: null });
  });

  test.each([
    { ...SECTION, idgaia: null },
    { ...SECTION, has_geometry: 0, idgaia: null },
    { ...SECTION, lib_ligne: "" },
  ])("rejects malformed section %#", (value) => {
    expect(() => decodeRailwaySectionDatabaseRow(value, "at row 0")).toThrow(
      "Invalid railway section at row 0",
    );
  });
});
