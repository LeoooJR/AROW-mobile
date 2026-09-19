/** @jest-environment node */

import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { parseMilestoneCsv } from "./railway-database/csv";
import { normalizeRailwayGeoJson } from "./railway-database/geojson";
import { downloadResource } from "./railway-database/resources";
import { setupRailwayDatabase } from "./railway-database/setup";
import { validateRailwayAssets } from "./railway-database/asset-validation";
import type {
  FetchImplementation,
  GenerationLogger,
  RailwayResources,
  SetupOptions,
} from "./railway-database/types";

const FIXTURE_SNAPSHOT = Object.freeze({
  fallbackSectionCount: 1,
  geometryCount: 1,
  geometryWithoutMilestoneCount: 0,
  milestoneCount: 2,
  railwaySectionCount: 2,
  skippedMilestoneCount: 1,
});

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

interface RailwayFixtures {
  readonly buffers: ReadonlyMap<string, Uint8Array>;
  readonly manifest: RailwayResources;
}

function checksum(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function fixtureResources(): RailwayFixtures {
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

function fixtureFetch(
  buffers: ReadonlyMap<string, Uint8Array>,
): jest.MockedFunction<FetchImplementation> {
  return jest.fn(async (input: string | URL) => {
    const body = buffers.get(input.toString());
    if (body === undefined) {
      return new Response("Not found", { status: 404 });
    }
    return new Response(Uint8Array.from(body).buffer, {
      headers: { "content-type": "application/octet-stream" },
    });
  });
}

describe("railway database setup", () => {
  let directory: string;
  let databasePath: string;
  let geojsonPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "arow-railway-database-"));
    databasePath = join(directory, "railway_reference.sqlite");
    geojsonPath = join(directory, "lignes-par-type.geojson");
  });

  afterEach(() => {
    rmSync(directory, { force: true, recursive: true });
  });

  function fixtureSetupOptions(
    logger: GenerationLogger = { log: () => undefined, warn: () => undefined },
  ): SetupOptions {
    const { buffers, manifest } = fixtureResources();
    return {
      databasePath,
      expectedSnapshot: FIXTURE_SNAPSHOT,
      fetchImplementation: fixtureFetch(buffers),
      geojsonPath,
      logger,
      resources: manifest,
    };
  }

  async function generateValidFixtureAssets(): Promise<void> {
    await setupRailwayDatabase(fixtureSetupOptions());
  }

  test("downloads, normalizes, and deterministically rebuilds both assets", async () => {
    const logger = {
      log: jest.fn<void, [string]>(),
      warn: jest.fn<void, [string]>(),
    } satisfies GenerationLogger;
    const options = fixtureSetupOptions(logger);
    const fetchImplementation = options.fetchImplementation;

    await expect(setupRailwayDatabase(options)).resolves.toEqual(
      FIXTURE_SNAPSHOT,
    );
    expect(logger.warn).toHaveBeenCalledWith(
      "Skipped unsupported milestone D+000 at CSV line 4",
    );

    const { geojson } = normalizeRailwayGeoJson(
      JSON.parse(readFileSync(geojsonPath, "utf8")),
    );
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

  test("validates generated railway assets without modifying them", async () => {
    await generateValidFixtureAssets();
    const originalGeojson = readFileSync(geojsonPath);
    const originalDatabase = readFileSync(databasePath);

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
      }),
    ).not.toThrow();
    expect(readFileSync(geojsonPath)).toEqual(originalGeojson);
    expect(readFileSync(databasePath)).toEqual(originalDatabase);
  });

  test("reports a missing GeoJSON asset with setup guidance", async () => {
    await generateValidFixtureAssets();

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath: join(directory, "missing.geojson"),
      }),
    ).toThrow(
      "Railway GeoJSON asset is missing or invalid. ENOENT: no such file or directory",
    );
    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath: join(directory, "missing.geojson"),
      }),
    ).toThrow("Run `npm run database:setup`");
  });

  test("reports a missing SQLite asset with setup guidance", async () => {
    await generateValidFixtureAssets();

    expect(() =>
      validateRailwayAssets({
        databasePath: join(directory, "missing.sqlite"),
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
      }),
    ).toThrow("Railway SQLite asset is missing or invalid");
    expect(() =>
      validateRailwayAssets({
        databasePath: join(directory, "missing.sqlite"),
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
      }),
    ).toThrow("Run `npm run database:setup`");
  });

  test("rejects malformed GeoJSON and corrupt SQLite assets", async () => {
    await generateValidFixtureAssets();
    writeFileSync(geojsonPath, "not JSON");

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
      }),
    ).toThrow("Railway GeoJSON asset is missing or invalid");

    await generateValidFixtureAssets();
    writeFileSync(databasePath, "not SQLite");
    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
      }),
    ).toThrow("Railway SQLite asset is missing or invalid");
  });

  test("rejects assets whose counts do not match the expected snapshot", async () => {
    await generateValidFixtureAssets();

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: { ...FIXTURE_SNAPSHOT, geometryCount: 2 },
        geojsonPath,
      }),
    ).toThrow(
      "Railway GeoJSON asset is missing or invalid. Expected 2 railway features, received 1",
    );

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: { ...FIXTURE_SNAPSHOT, milestoneCount: 3 },
        geojsonPath,
      }),
    ).toThrow(
      "Railway SQLite asset is missing or invalid. Generated database row counts do not match their sources",
    );
  });

  test("preserves existing outputs when a download checksum fails", async () => {
    const { buffers, manifest } = fixtureResources();
    writeFileSync(geojsonPath, "existing geojson");
    writeFileSync(databasePath, "existing database");
    const invalidManifest: RailwayResources = {
      ...manifest,
      milestones: {
        ...manifest.milestones,
        sha256: "0".repeat(64),
      },
    };

    await expect(
      setupRailwayDatabase({
        databasePath,
        expectedSnapshot: undefined,
        fetchImplementation: fixtureFetch(buffers),
        geojsonPath,
        resources: invalidManifest,
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
    const rawGeojson = {
      ...structuredClone(RAW_GEOJSON),
      features: RAW_GEOJSON.features.map((feature, index) =>
        index === 0
          ? {
              ...feature,
              properties: { ...feature.properties, unexpected: true },
            }
          : feature,
      ),
    };
    expect(() => normalizeRailwayGeoJson(rawGeojson)).toThrow(
      "contains unexpected property unexpected",
    );
  });
});
