/** @jest-environment node */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { validateImportedMilestones } from "./asset-consistency";
import type { Milestone } from "./types";

const POINTS: readonly Milestone[] = [
  {
    code: "001000",
    rank: 1,
    positionMeters: 100,
    label: "000+100",
    latitude: 48,
    longitude: 2,
  },
  {
    code: "001000",
    rank: 1,
    positionMeters: 200,
    label: "0+200",
    latitude: 49,
    longitude: 3,
  },
];

let directory: string;
let path: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "arow-source-consistency-"));
  path = join(directory, "reference.sqlite");
  const database = new DatabaseSync(path);
  try {
    database.exec(
      "CREATE TABLE kilometric_points(code_ligne TEXT, rg_troncon INTEGER, position_m INTEGER, label TEXT, latitude REAL, longitude REAL)",
    );
    const insert = database.prepare(
      "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?)",
    );
    for (const point of POINTS)
      insert.run(
        point.code,
        point.rank,
        point.positionMeters,
        point.label,
        point.latitude,
        point.longitude,
      );
  } finally {
    database.close();
  }
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

test("compares SQLite directly with accepted CSV identities, labels and coordinates", () => {
  expect(() =>
    validateImportedMilestones(path, [...POINTS].reverse()),
  ).not.toThrow();
});

test.each([
  [
    "latitude",
    "UPDATE kilometric_points SET latitude = 47 WHERE position_m = 100",
    "disagrees with accepted CSV milestone",
  ],
  [
    "longitude",
    "UPDATE kilometric_points SET longitude = 4 WHERE position_m = 100",
    "disagrees with accepted CSV milestone",
  ],
  [
    "label padding",
    "UPDATE kilometric_points SET label = '0+100' WHERE position_m = 100",
    "disagrees with accepted CSV milestone",
  ],
  [
    "identity",
    "UPDATE kilometric_points SET rg_troncon = 2 WHERE position_m = 100",
    "disagrees with accepted CSV milestone",
  ],
  [
    "missing point",
    "DELETE FROM kilometric_points WHERE position_m = 100",
    "different point counts",
  ],
  [
    "extra point",
    "INSERT INTO kilometric_points VALUES ('001000', 1, 300, '0+300', 48, 2)",
    "disagrees with accepted CSV milestone",
  ],
])("rejects an inconsistent %s", (_description, sql, message) => {
  const database = new DatabaseSync(path);
  try {
    database.exec(sql);
  } finally {
    database.close();
  }
  expect(() => validateImportedMilestones(path, POINTS)).toThrow(message);
});

test("rejects duplicate identities in accepted records", () => {
  expect(() =>
    validateImportedMilestones(path, [...POINTS, POINTS[0]]),
  ).toThrow("duplicate identities");
});
