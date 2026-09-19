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
  return database;
}

const VALID_SECTION = [
  "893000",
  1,
  "gaia-id",
  "Ligne de test",
  "Ligne",
  "499+752",
  "511+605",
  1,
] as const;
const VALID_POINT = [
  "893000",
  1,
  509_000,
  "509+000",
  45.74744,
  4.85933,
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
      .prepare("INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...VALID_SECTION);
    database
      .prepare("INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run("008000", 1, null, "Ligne 008000", null, null, null, 0);
    database
      .prepare("INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?)")
      .run(...VALID_POINT);
    expect(database.prepare("PRAGMA integrity_check").get()).toEqual({
      integrity_check: "ok",
    });
  });

  test.each([
    ["line code", ["89300", ...VALID_SECTION.slice(1)]],
    ["section rank", [VALID_SECTION[0], 0, ...VALID_SECTION.slice(2)]],
    [
      "line name",
      [...VALID_SECTION.slice(0, 3), "", ...VALID_SECTION.slice(4)],
    ],
    ["geometry flag", [...VALID_SECTION.slice(0, 7), 2]],
    [
      "partial geometry",
      [...VALID_SECTION.slice(0, 2), null, ...VALID_SECTION.slice(3)],
    ],
  ])("rejects invalid section %s", (_description, values) => {
    expect(() =>
      database
        .prepare("INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(...values),
    ).toThrow();
  });

  test.each([
    ["line code", ["89300", ...VALID_POINT.slice(1)]],
    ["section rank", [VALID_POINT[0], 0, ...VALID_POINT.slice(2)]],
    ["position", [...VALID_POINT.slice(0, 2), -1, ...VALID_POINT.slice(3)]],
    ["label", [...VALID_POINT.slice(0, 3), "", ...VALID_POINT.slice(4)]],
    ["latitude", [...VALID_POINT.slice(0, 4), 91, VALID_POINT[5]]],
    ["longitude", [...VALID_POINT.slice(0, 5), 181]],
  ])("rejects invalid point %s", (_description, values) => {
    database
      .prepare("INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(...VALID_SECTION);
    expect(() =>
      database
        .prepare("INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?)")
        .run(...values),
    ).toThrow();
  });

  test("enforces composite keys and the section foreign key", () => {
    const insertSection = database.prepare(
      "INSERT INTO railway_sections VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    insertSection.run(...VALID_SECTION);
    expect(() => insertSection.run(...VALID_SECTION)).toThrow();

    const insertPoint = database.prepare(
      "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?)",
    );
    insertPoint.run(...VALID_POINT);
    expect(() => insertPoint.run(...VALID_POINT)).toThrow();
    expect(() => insertPoint.run("001000", 1, 1_000, "1+000", 45, 4)).toThrow();
  });
});
