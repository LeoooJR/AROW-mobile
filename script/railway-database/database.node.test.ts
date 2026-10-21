/** @jest-environment node */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { FIND_CURRENT_MILESTONE_QUERY } from "../../src/features/railway-reference/sqlite/queries";
import {
  completeRailwaySections,
  createRailwayDatabase,
  validateRailwayDatabase,
} from "./database";
import type {
  GenerationSummary,
  Milestone,
  RailwaySectionWithGeometry,
} from "./types";

const geometrySections: readonly RailwaySectionWithGeometry[] = [1, 2, 3].map(
  (rank) => ({
    code: "001000",
    endMilestone: "150+000",
    gaiaId: `gaia-${rank}`,
    hasGeometry: 1,
    name: "Test railway",
    railwayType: "Ligne",
    rank,
    startMilestone: "99+000",
  }),
);

function point(code: string, rank: number, positionMeters: number): Milestone {
  return Object.freeze({
    code,
    label: `${Math.floor(positionMeters / 1000)}+${String(positionMeters % 1000).padStart(3, "0")}`,
    latitude: 45,
    longitude: 4,
    positionMeters,
    rank,
  });
}

const milestones = Object.freeze([
  point("001000", 1, 150_000),
  point("002000", 1, 99_500),
  point("001000", 1, 99_000),
  point("001000", 2, 100_000),
  point("001000", 1, 100_000),
]);
const sections = completeRailwaySections(geometrySections, milestones);
const summary: GenerationSummary = {
  fallbackSectionCount: 1,
  geometryCount: 3,
  geometryWithoutMilestoneCount: 1,
  milestoneCount: 5,
  railwaySectionCount: 4,
  skippedMilestoneCount: 0,
};

describe("generated section milestone metadata", () => {
  let directory: string;
  let path: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "arow-section-metadata-"));
    path = join(directory, "reference.sqlite");
    createRailwayDatabase(path, sections, milestones);
  });

  afterEach(() => rmSync(directory, { recursive: true, force: true }));

  test("counts exact sections and assigns numeric ordinals without mutating unsorted input", () => {
    const database = new DatabaseSync(path, { readOnly: true });
    try {
      expect(database.prepare("PRAGMA user_version").get()).toEqual({
        user_version: 3,
      });
      expect(
        database
          .prepare(
            "SELECT code_ligne, rg_troncon, milestone_count FROM railway_sections ORDER BY code_ligne, rg_troncon",
          )
          .all(),
      ).toEqual([
        { code_ligne: "001000", rg_troncon: 1, milestone_count: 3 },
        { code_ligne: "001000", rg_troncon: 2, milestone_count: 1 },
        { code_ligne: "001000", rg_troncon: 3, milestone_count: 0 },
        { code_ligne: "002000", rg_troncon: 1, milestone_count: 1 },
      ]);
      expect(
        database
          .prepare(
            "SELECT position_m, position_in_section FROM kilometric_points WHERE code_ligne = '001000' AND rg_troncon = 1 ORDER BY position_m",
          )
          .all(),
      ).toEqual([
        { position_m: 99_000, position_in_section: 1 },
        { position_m: 100_000, position_in_section: 2 },
        { position_m: 150_000, position_in_section: 3 },
      ]);
      expect(milestones[0].positionMeters).toBe(150_000);
      expect(() => validateRailwayDatabase(path, summary)).not.toThrow();
    } finally {
      database.close();
    }
  });

  test.each([
    [
      "count",
      "UPDATE railway_sections SET milestone_count = 1 WHERE code_ligne = '001000' AND rg_troncon = 3",
    ],
    [
      "count",
      "UPDATE railway_sections SET milestone_count = CASE rg_troncon WHEN 1 THEN 2 WHEN 2 THEN 2 ELSE milestone_count END WHERE code_ligne = '001000'",
    ],
    [
      "position",
      "UPDATE kilometric_points SET position_in_section = 4 - position_in_section WHERE code_ligne = '001000' AND rg_troncon = 1",
    ],
    [
      "position",
      "UPDATE kilometric_points SET position_in_section = 1 WHERE code_ligne = '001000' AND rg_troncon = 1",
    ],
  ])(
    "rejects corrupt %s metadata independently of snapshot totals",
    (kind, sql) => {
      const database = new DatabaseSync(path);
      database.exec(sql);
      database.close();
      expect(() => validateRailwayDatabase(path, summary)).toThrow(
        kind === "count"
          ? "invalid section milestone count"
          : "invalid milestone section position",
      );
    },
  );

  test("rejects duplicate points and rolls back generated tables", () => {
    const duplicatePath = join(directory, "duplicate.sqlite");
    expect(() =>
      createRailwayDatabase(duplicatePath, sections, [
        ...milestones,
        milestones[0],
      ]),
    ).toThrow();
    const database = new DatabaseSync(duplicatePath, { readOnly: true });
    try {
      expect(
        database
          .prepare("SELECT name FROM sqlite_schema WHERE type = 'table'")
          .all(),
      ).toEqual([]);
    } finally {
      database.close();
    }
  });

  test("reads stored metadata using two primary-key searches without aggregates", () => {
    const database = new DatabaseSync(path, { readOnly: true });
    try {
      expect(
        database
          .prepare(FIND_CURRENT_MILESTONE_QUERY)
          .get("001000", 1, 100_000),
      ).toMatchObject({ position_in_section: 2, total: 3 });
      expect(FIND_CURRENT_MILESTONE_QUERY).not.toMatch(/COUNT\s*\(/i);
      const plan = database
        .prepare(`EXPLAIN QUERY PLAN ${FIND_CURRENT_MILESTONE_QUERY}`)
        .all("001000", 1, 100_000);
      expect(plan.map((row) => row.detail)).toEqual(
        expect.arrayContaining([
          expect.stringContaining("SEARCH current USING PRIMARY KEY"),
          expect.stringContaining("SEARCH section USING PRIMARY KEY"),
        ]),
      );
      expect(plan.some((row) => /SCAN|SUBQUERY/.test(String(row.detail)))).toBe(
        false,
      );
    } finally {
      database.close();
    }
  });
});
