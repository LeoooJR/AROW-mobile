/** @jest-environment node */

const { createHash } = require("node:crypto");
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { pathToFileURL } = require("node:url");
const { DatabaseSync } = require("node:sqlite");

const SCRIPT_DIRECTORY = join(process.cwd(), "script");

const RAW_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [2, 48],
          [2.1, 48.1],
        ],
      },
      properties: {
        type_ligne: "Ligne",
        idgaia: "gaia-1",
        code_ligne: "001000",
        lib_ligne: "Ligne de test",
        rg_troncon: 1,
        pkd: "001+000",
        pkf: "002+000",
        x_d_l93: 1,
        y_d_l93: 2,
        x_f_l93: 3,
        y_f_l93: 4,
        x_d_wgs84: 2,
        y_d_wgs84: 48,
        x_f_wgs84: 2.1,
        y_f_wgs84: 48.1,
        c_geo_d: "48,2",
        c_geo_f: { lat: 48.1, lon: 2.1 },
        geo_point_2d: { lat: 48.05, lon: 2.05 },
      },
    },
  ],
};

const RAW_CSV = [
  "TYPE_REPER;PK;LIGNE;CODE_LIGNE;RG_TRONCON;latitude;longitude",
  "Hectomètre;001+100;001000-1;1000;1;48.01;2.01",
  "Kilomètre;001+000;001000-1;1000;1;48.0;2.0",
  "Kilomètre;D+000;001000-1;1000;1;48.1;2.1",
  "Kilomètre;2+000;008000-2;8000;;47,5;1,25",
  "",
].join("\n");

function checksum(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fixtureResources() {
  const geojson = Buffer.from(JSON.stringify(RAW_GEOJSON));
  const milestones = Buffer.from(RAW_CSV, "latin1");
  return {
    buffers: new Map([
      ["https://example.test/railways", geojson],
      ["https://example.test/milestones", milestones],
    ]),
    manifest: {
      geojson: {
        name: "railways.geojson",
        sha256: checksum(geojson),
        url: "https://example.test/railways",
      },
      milestones: {
        name: "milestones.csv",
        sha256: checksum(milestones),
        url: "https://example.test/milestones",
      },
    },
  };
}

function fixtureFetch(buffers) {
  return jest.fn(async (url) => {
    const body = buffers.get(url);
    if (body === undefined) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(body, {
      headers: { "content-type": "application/octet-stream" },
    });
  });
}

describe("railway database setup", () => {
  let directory;
  let databasePath;
  let geojsonPath;
  let parseMilestoneCsv;
  let normalizeRailwayGeoJson;
  let downloadResource;
  let setupRailwayDatabase;

  beforeAll(async () => {
    ({ parseMilestoneCsv } = await import(
      pathToFileURL(join(SCRIPT_DIRECTORY, "railway-database/csv.mjs")).href
    ));
    ({ normalizeRailwayGeoJson } = await import(
      pathToFileURL(join(SCRIPT_DIRECTORY, "railway-database/geojson.mjs")).href
    ));
    ({ downloadResource } = await import(
      pathToFileURL(join(SCRIPT_DIRECTORY, "railway-database/resources.mjs"))
        .href
    ));
    ({ setupRailwayDatabase } = await import(
      pathToFileURL(join(SCRIPT_DIRECTORY, "update-railway-database.mjs")).href
    ));
  });

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "arow-railway-database-"));
    databasePath = join(directory, "railway_reference.sqlite");
    geojsonPath = join(directory, "lignes-par-type.geojson");
  });

  afterEach(() => {
    rmSync(directory, { force: true, recursive: true });
  });

  test("downloads, normalizes, and deterministically rebuilds both assets", async () => {
    const { buffers, manifest } = fixtureResources();
    const fetchImplementation = fixtureFetch(buffers);
    const logger = { log: jest.fn(), warn: jest.fn() };
    const options = {
      databasePath,
      expectedSnapshot: {
        fallbackSectionCount: 1,
        geometryCount: 1,
        geometryWithoutMilestoneCount: 0,
        milestoneCount: 2,
        railwaySectionCount: 2,
        skippedMilestoneCount: 1,
      },
      fetchImplementation,
      geojsonPath,
      logger,
      resources: manifest,
    };

    await expect(setupRailwayDatabase(options)).resolves.toEqual({
      fallbackSectionCount: 1,
      geometryCount: 1,
      geometryWithoutMilestoneCount: 0,
      milestoneCount: 2,
      railwaySectionCount: 2,
      skippedMilestoneCount: 1,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "Skipped unsupported milestone D+000 at CSV line 4",
    );

    const geojson = JSON.parse(readFileSync(geojsonPath, "utf8"));
    expect(geojson.features[0]).toMatchObject({ id: "001000:1" });
    expect(geojson.features[0].properties).not.toHaveProperty("x_d_l93");

    const database = new DatabaseSync(databasePath, { readOnly: true });
    expect(
      database.prepare("SELECT COUNT(*) AS count FROM railway_sections").get(),
    ).toEqual({ count: 2 });
    expect(
      database.prepare("SELECT COUNT(*) AS count FROM kilometric_points").get(),
    ).toEqual({ count: 2 });
    expect(
      database
        .prepare(
          `SELECT code_ligne, rg_troncon, position_m, latitude, longitude
           FROM kilometric_points
           WHERE code_ligne = '008000'`,
        )
        .get(),
    ).toEqual({
      code_ligne: "008000",
      latitude: 47.5,
      longitude: 1.25,
      position_m: 2000,
      rg_troncon: 2,
    });
    expect(database.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    database.close();

    const firstGeojson = readFileSync(geojsonPath);
    const firstDatabase = readFileSync(databasePath);
    await setupRailwayDatabase(options);
    expect(readFileSync(geojsonPath)).toEqual(firstGeojson);
    expect(readFileSync(databasePath)).toEqual(firstDatabase);
    expect(fetchImplementation).toHaveBeenCalledTimes(4);
  });

  test("preserves existing outputs when a download checksum fails", async () => {
    const { buffers, manifest } = fixtureResources();
    writeFileSync(geojsonPath, "existing geojson");
    writeFileSync(databasePath, "existing database");
    manifest.milestones.sha256 = "0".repeat(64);

    await expect(
      setupRailwayDatabase({
        databasePath,
        expectedSnapshot: undefined,
        fetchImplementation: fixtureFetch(buffers),
        geojsonPath,
        resources: manifest,
      }),
    ).rejects.toThrow("checksum mismatch");
    expect(readFileSync(geojsonPath, "utf8")).toBe("existing geojson");
    expect(readFileSync(databasePath, "utf8")).toBe("existing database");
  });

  test("rejects HTML responses instead of saving a Drive error page", async () => {
    const destinationPath = join(directory, "download");
    await expect(
      downloadResource(
        { name: "resource.csv", sha256: "unused", url: "test" },
        destinationPath,
        async () =>
          new Response("<html></html>", {
            headers: { "content-type": "text/html" },
          }),
      ),
    ).rejects.toThrow("returned HTML instead of the resource");
  });

  test("rejects duplicate and unexpected malformed milestone rows", () => {
    const duplicate = Buffer.from(
      `${RAW_CSV.trim()}\nKilomètre;001+000;001000-1;1000;1;48;2\n`,
      "latin1",
    );
    expect(() => parseMilestoneCsv(duplicate)).toThrow(
      "Duplicate milestone 001000:1:1000",
    );

    const malformed = Buffer.from(
      RAW_CSV.replace("D+000", "unknown"),
      "latin1",
    );
    expect(() => parseMilestoneCsv(malformed)).toThrow(
      "PK must use the kilometre+metric format",
    );
  });

  test("rejects unexpected GeoJSON properties", () => {
    const rawGeojson = structuredClone(RAW_GEOJSON);
    rawGeojson.features[0].properties.unexpected = true;
    expect(() => normalizeRailwayGeoJson(rawGeojson)).toThrow(
      "contains unexpected property unexpected",
    );
  });
});
