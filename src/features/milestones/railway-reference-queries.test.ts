import {
  FIND_MILESTONE_QUERY,
  LOAD_MILESTONES_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "./railway-reference-queries";

describe("railway reference queries", () => {
  test("uses the same complete milestone projection for loading and lookup", () => {
    const columns =
      "code_ligne, rg_troncon, position_m, label, latitude, longitude";

    expect(LOAD_MILESTONES_QUERY).toContain(`SELECT ${columns}`);
    expect(FIND_MILESTONE_QUERY).toContain(`SELECT ${columns}`);
  });

  test("loads searchable section bounds with geometry metadata", () => {
    expect(LOAD_SEARCHABLE_RAILWAYS_QUERY).toContain(
      "INNER JOIN section_bounds",
    );
    expect(LOAD_SEARCHABLE_RAILWAYS_QUERY).toContain("railway.has_geometry");
    expect(LOAD_SEARCHABLE_RAILWAYS_QUERY).toContain("railway.idgaia");
  });

  test("looks up exact composite milestone identity with placeholders", () => {
    expect(FIND_MILESTONE_QUERY).toContain(
      "code_ligne = ? AND rg_troncon = ? AND position_m = ?",
    );
  });
});
