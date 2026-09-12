/** @jest-environment node */

const { execFileSync } = require("node:child_process");
const {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATABASE_SOURCE = join(process.cwd(), "src/statics/pk.sqlite");
const GEOJSON_SOURCE = join(
  process.cwd(),
  "src/statics/lignes-par-type.geojson",
);
const UPDATE_SCRIPT = join(process.cwd(), "script/update-railway-database.mjs");

function runGenerator(databasePath, geojsonPath = GEOJSON_SOURCE) {
  execFileSync(process.execPath, [UPDATE_SCRIPT, databasePath, geojsonPath], {
    stdio: "pipe",
  });
}

describe("railway database generator", () => {
  let directory;
  let databasePath;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "arow-railway-database-"));
    databasePath = join(directory, "pk.sqlite");
    copyFileSync(DATABASE_SOURCE, databasePath);
  });

  afterEach(() => {
    rmSync(directory, { force: true, recursive: true });
  });

  test("builds the relational railway reference database", () => {
    runGenerator(databasePath);
    const database = new DatabaseSync(databasePath, { readOnly: true });
    const geojson = JSON.parse(readFileSync(GEOJSON_SOURCE, "utf8"));

    expect(
      database.prepare("SELECT COUNT(*) AS count FROM railway_sections").get(),
    ).toEqual({ count: 1045 });
    expect(
      database
        .prepare(
          "SELECT COUNT(*) AS count FROM railway_sections WHERE has_geometry = 1",
        )
        .get(),
    ).toEqual({ count: 1043 });
    expect(
      database.prepare("SELECT COUNT(*) AS count FROM kilometric_points").get(),
    ).toEqual({ count: 36812 });
    expect(database.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(database.prepare("PRAGMA integrity_check").get()).toEqual({
      integrity_check: "ok",
    });
    expect(
      database
        .prepare(
          `SELECT code_ligne || ':' || rg_troncon AS id
           FROM railway_sections
           WHERE has_geometry = 1
           ORDER BY id`,
        )
        .all()
        .map(({ id }) => id),
    ).toEqual(geojson.features.map(({ id }) => id).sort());
    database.close();
  });

  test("keeps empty geometry sections and adds milestone fallback parents", () => {
    runGenerator(databasePath);
    const database = new DatabaseSync(databasePath, { readOnly: true });

    expect(
      database
        .prepare(
          `SELECT COUNT(*) AS count
           FROM railway_sections AS railway
           WHERE railway.has_geometry = 1
             AND NOT EXISTS (
               SELECT 1 FROM kilometric_points AS point
               WHERE point.code_ligne = railway.code_ligne
                 AND point.rg_troncon = railway.rg_troncon
             )`,
        )
        .get(),
    ).toEqual({ count: 27 });
    expect(
      database
        .prepare(
          `SELECT code_ligne, rg_troncon, lib_ligne, has_geometry
           FROM railway_sections
           WHERE has_geometry = 0
           ORDER BY code_ligne`,
        )
        .all(),
    ).toEqual([
      {
        code_ligne: "008000",
        has_geometry: 0,
        lib_ligne: "Ligne 008000",
        rg_troncon: 1,
      },
      {
        code_ligne: "830341",
        has_geometry: 0,
        lib_ligne: "Ligne 830341",
        rg_troncon: 2,
      },
    ]);
    database.close();
  });

  test("derives exact metre positions and supports idempotent reruns", () => {
    rmSync(databasePath);
    const legacyDatabase = new DatabaseSync(databasePath);
    legacyDatabase.exec(`
      CREATE TABLE kilometric_points (
        ligne TEXT NOT NULL,
        code_ligne INTEGER NOT NULL,
        km INTEGER NOT NULL,
        label TEXT NOT NULL,
        rg_troncon INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        PRIMARY KEY (code_ligne, rg_troncon, km)
      ) STRICT;
      INSERT INTO kilometric_points
      VALUES ('984000-1', 984000, 1, '1+100', 1, 48.0, 2.0);
    `);
    legacyDatabase.close();

    runGenerator(databasePath);
    const firstGeneration = readFileSync(databasePath);
    runGenerator(databasePath);
    expect(readFileSync(databasePath)).toEqual(firstGeneration);
    const database = new DatabaseSync(databasePath, { readOnly: true });

    expect(
      database
        .prepare(
          `SELECT position_m, label
           FROM kilometric_points
           WHERE code_ligne = '984000' AND rg_troncon = 1`,
        )
        .get(),
    ).toEqual({ label: "1+100", position_m: 1100 });
    expect(database.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    database.close();
  });

  test("does not replace the database when source validation fails", () => {
    const invalidGeojsonPath = join(directory, "invalid.geojson");
    const geojson = JSON.parse(readFileSync(GEOJSON_SOURCE, "utf8"));
    geojson.features[0].id = "invalid";
    writeFileSync(invalidGeojsonPath, JSON.stringify(geojson));
    const original = readFileSync(databasePath);

    expect(() => runGenerator(databasePath, invalidGeojsonPath)).toThrow();
    expect(readFileSync(databasePath)).toEqual(original);
  });
});
