/** @jest-environment node */

import { DatabaseSync } from "node:sqlite";

import {
  createTableSql,
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
} from "./schema";

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(createTableSql(RAILWAY_SECTIONS_TABLE));
  database.exec(createTableSql(KILOMETRIC_POINTS_TABLE));
  database.exec("BEGIN");
  return database;
}

const VALID_SECTION = [
  "893000",
  1,
  "gaia-id",
  "Ligne de test",
  "Ligne",
  0,
  509_000,
  1,
  3,
] as const;
const VALID_POINT = [
  "893000",
  1,
  509_000,
  "509+000",
  45.74744,
  4.85933,
  3,
  0,
] as const;

describe("generated railway reference DDL", () => {
  let database: DatabaseSync;

  beforeEach(() => {
    database = createDatabase();
  });

  afterEach(() => {
    database.close();
  });

  test("accepts geometric and fallback sections with valid points", () => {
    database
      .prepare(
        "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...VALID_SECTION);
    database
      .prepare(
        "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run("008000", 1, null, "Ligne 008000", null, null, null, 0, 0);
    database
      .prepare("INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...VALID_POINT);
    database
      .prepare("INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run("893000", 1, 1_000, "001+000", 45.74744, 4.85933, 2, 0);
    database
      .prepare("INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run("893000", 1, 0, "0+000", 45.74744, 4.85933, 1, 0);
    expect(database.prepare("PRAGMA integrity_check").get()).toEqual({
      integrity_check: "ok",
    });
    expect(() => database.exec("COMMIT")).not.toThrow();
    expect(database.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  });

  test.each([
    ["line code", ["89300", ...VALID_SECTION.slice(1)]],
    ["section rank", [VALID_SECTION[0], 0, ...VALID_SECTION.slice(2)]],
    [
      "line name",
      [...VALID_SECTION.slice(0, 3), "", ...VALID_SECTION.slice(4)],
    ],
    ["geometry flag", [...VALID_SECTION.slice(0, 7), 2, VALID_SECTION[8]]],
    ["negative count", [...VALID_SECTION.slice(0, 8), -1]],
    ["null count", [...VALID_SECTION.slice(0, 8), null]],
    [
      "partial geometry",
      [...VALID_SECTION.slice(0, 2), null, ...VALID_SECTION.slice(3)],
    ],
  ])("rejects invalid section %s", (_description, values) => {
    expect(() =>
      database
        .prepare(
          "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(...values),
    ).toThrow();
  });

  test.each([
    ["line code", ["89300", ...VALID_POINT.slice(1)]],
    ["section rank", [VALID_POINT[0], 0, ...VALID_POINT.slice(2)]],
    ["position", [...VALID_POINT.slice(0, 2), -1, ...VALID_POINT.slice(3)]],
    ["label", [...VALID_POINT.slice(0, 3), "", ...VALID_POINT.slice(4)]],
    [
      "mismatched label",
      [...VALID_POINT.slice(0, 3), "508+000", ...VALID_POINT.slice(4)],
    ],
    [
      "malformed nonempty label",
      [...VALID_POINT.slice(0, 3), "509+00", ...VALID_POINT.slice(4)],
    ],
    [
      "mismatched position",
      [...VALID_POINT.slice(0, 2), 508_000, ...VALID_POINT.slice(3)],
    ],
    ["latitude", [...VALID_POINT.slice(0, 4), 91, ...VALID_POINT.slice(5)]],
    ["longitude", [...VALID_POINT.slice(0, 5), 181, ...VALID_POINT.slice(6)]],
    ["zero ordinal", [...VALID_POINT.slice(0, 6), 0, VALID_POINT[7]]],
    ["null ordinal", [...VALID_POINT.slice(0, 6), null, VALID_POINT[7]]],
    ["negative class", [...VALID_POINT.slice(0, 7), -1]],
    ["oversized class", [...VALID_POINT.slice(0, 7), 4]],
    ["null class", [...VALID_POINT.slice(0, 7), null]],
    ["fractional class", [...VALID_POINT.slice(0, 7), 0.5]],
  ])("rejects invalid point %s", (_description, values) => {
    database
      .prepare(
        "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(...VALID_SECTION);
    expect(() =>
      database
        .prepare(
          "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(...values),
    ).toThrow();
  });

  test("enforces composite keys and the section foreign key", () => {
    const insertSection = database.prepare(
      "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    insertSection.run(...VALID_SECTION);
    expect(() => insertSection.run(...VALID_SECTION)).toThrow();

    const insertPoint = database.prepare(
      "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    insertPoint.run(...VALID_POINT);
    expect(() => insertPoint.run(...VALID_POINT)).toThrow();
    expect(() =>
      insertPoint.run("001000", 1, 1_000, "1+000", 45, 4, 1, 0),
    ).toThrow();
  });

  test.each([
    ["missing", "893000", 1, 999_000],
    ["different line", "894000", 1, 509_000],
    ["different rank", "893000", 2, 509_000],
  ])(
    "rejects a %s endpoint at commit and allows rollback",
    (_kind, code, rank, position) => {
      database
        .prepare(
          "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run("893000", 1, "gaia", "Test", "Ligne", 509000, 509000, 1, 1);
      if (code !== "893000" || rank !== 1) {
        database
          .prepare(
            "INSERT INTO railway_sections VALUES (?, ?, NULL, ?, NULL, NULL, NULL, 0, 0)",
          )
          .run(code, rank, "Other section");
      }
      database
        .prepare(
          "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, 45, 4, 1, 0)",
        )
        .run(
          code,
          rank,
          position,
          `${Math.floor(Number(position) / 1000)}+000`,
        );
      expect(() => database.exec("COMMIT")).toThrow(/FOREIGN KEY/);
      database.exec("ROLLBACK");
      expect(database.prepare("SELECT * FROM railway_sections").all()).toEqual(
        [],
      );
    },
  );

  test.each([
    [null, 509000, 3],
    [0, null, 3],
    [1000, 0, 3],
    [-1, 1000, 3],
    [0, 1000, 0],
    [0, 1000, 1],
  ])(
    "rejects inconsistent endpoints %j / %j with count %j",
    (first, last, count) => {
      expect(() =>
        database
          .prepare(
            "INSERT INTO railway_sections VALUES ('893000', 1, NULL, 'Test', NULL, ?, ?, 0, ?)",
          )
          .run(first, last, count),
      ).toThrow();
    },
  );
});
