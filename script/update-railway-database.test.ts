/** @jest-environment node */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { runInThisContext } from "node:vm";

import { parseMilestoneCsv } from "./railway-database/csv";
import { normalizeRailwayGeoJson } from "./railway-database/geojson";
import { normalizeMilestoneGeoJson } from "./railway-database/milestone-geojson";
import { downloadResource } from "./railway-database/resources";
import { setupRailwayDatabase } from "./railway-database/setup";
import { validateRailwayAssets } from "./railway-database/asset-validation";
import type {
  FetchImplementation,
  GenerationLogger,
  RailwayResources,
  RailwayResource,
  SetupOptions,
} from "./railway-database/types";

// The Expo preset installs native-app networking globals even in Node tests.
// These host build-script tests need Node's actual fetch and stream primitives.
beforeAll(() => {
  Object.assign(
    globalThis,
    runInThisContext(
      "({ fetch, Response, ReadableStream, AbortController, AbortSignal })",
    ),
  );
});

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

const RAW_MILESTONE_GEOJSON = {
  features: [
    {
      geometry: { coordinates: [2, 48], type: "Point" },
      id: "001000:1:1000",
      properties: {
        label: "001+000",
        lineCode: "001000",
        positionMeters: 1000,
        sectionRank: 1,
      },
      type: "Feature",
    },
    {
      geometry: { coordinates: [1.25, 47.5], type: "Point" },
      id: "008000:2:2000",
      properties: {
        label: "2+000",
        lineCode: "008000",
        positionMeters: 2000,
        sectionRank: 2,
      },
      type: "Feature",
    },
  ],
  type: "FeatureCollection",
} as const;

function milestoneGeojsonWithMismatchedLabel() {
  return {
    ...RAW_MILESTONE_GEOJSON,
    features: [
      {
        ...RAW_MILESTONE_GEOJSON.features[0],
        properties: {
          ...RAW_MILESTONE_GEOJSON.features[0].properties,
          label: "002+000",
        },
      },
      RAW_MILESTONE_GEOJSON.features[1],
    ],
  };
}

interface RailwayFixtures {
  readonly buffers: ReadonlyMap<string, Uint8Array>;
  readonly manifest: RailwayResources;
}

function checksum(buffer: Uint8Array): string {
  return createHash("sha256").update(buffer).digest("hex");
}

describe("bounded resource downloads", () => {
  let directory: string;
  let destination: string;
  const data = Buffer.from("valid resource");

  function resource(overrides: Partial<RailwayResource> = {}): RailwayResource {
    return {
      name: "resource.csv",
      url: "https://example.test/resource",
      sha256: checksum(data),
      maxBytes: data.length,
      timeoutMs: 1000,
      ...overrides,
    } as RailwayResource;
  }

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "arow-download-"));
    destination = join(directory, "download");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(directory, { force: true, recursive: true });
  });

  test.each([
    { maxBytes: 0 },
    { maxBytes: -1 },
    { maxBytes: 1.5 },
    { maxBytes: NaN },
    { maxBytes: Infinity },
    { maxBytes: Number.MAX_SAFE_INTEGER + 1 },
    { timeoutMs: 0 },
    { timeoutMs: -1 },
    { timeoutMs: 1.5 },
    { timeoutMs: NaN },
    { timeoutMs: Infinity },
    { timeoutMs: 2_147_483_648 },
  ])("rejects invalid limits before fetch: %j", async (limits) => {
    const fetchImplementation = jest.fn<
      ReturnType<FetchImplementation>,
      Parameters<FetchImplementation>
    >();
    await expect(
      downloadResource(resource(limits), destination, fetchImplementation),
    ).rejects.toThrow("resource.csv");
    expect(fetchImplementation).not.toHaveBeenCalled();
    expect(existsSync(destination)).toBe(false);
  });

  test.each([0, 1])(
    "accepts valid data with %i bytes of headroom and clears its timer",
    async (headroom) => {
      const startTimer = jest.spyOn(globalThis, "setTimeout");
      const clearTimer = jest.spyOn(globalThis, "clearTimeout");
      const fetchImplementation = jest.fn<
        ReturnType<FetchImplementation>,
        Parameters<FetchImplementation>
      >(async () => new Response(data));
      await downloadResource(
        resource({ maxBytes: data.length + headroom }),
        destination,
        fetchImplementation,
      );
      expect(readFileSync(destination)).toEqual(data);
      const signal = fetchImplementation.mock.calls[0]?.[1]?.signal;
      expect(signal).toBeInstanceOf(AbortSignal);
      expect(signal?.aborted).toBe(false);
      expect(clearTimer).toHaveBeenCalledWith(startTimer.mock.results[0].value);
    },
  );

  test.each([undefined, "1", "999999"])(
    "rejects excessive streaming bytes with Content-Length %s",
    async (length) => {
      let bytesOnDisk = -1;
      const cancel = jest.fn(() => {
        bytesOnDisk = readFileSync(destination).length;
      });
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(Buffer.from("ok"));
          controller.enqueue(Buffer.alloc(100));
        },
        cancel,
      });
      const fetchImplementation: FetchImplementation = async () =>
        new Response(body, {
          headers: length === undefined ? {} : { "content-length": length },
        });
      await expect(
        downloadResource(
          resource({ maxBytes: 2 }),
          destination,
          fetchImplementation,
        ),
      ).rejects.toThrow("resource.csv: download exceeds 2 byte limit");
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(bytesOnDisk).toBeGreaterThanOrEqual(0);
      expect(bytesOnDisk).toBeLessThanOrEqual(2);
      expect(existsSync(destination)).toBe(false);
    },
  );

  test("rejects a single oversized chunk before writing any bytes", async () => {
    let bytesOnDisk = -1;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(Buffer.alloc(100));
      },
      cancel() {
        bytesOnDisk = readFileSync(destination).length;
      },
    });
    await expect(
      downloadResource(
        resource({ maxBytes: 2 }),
        destination,
        async () => new Response(body),
      ),
    ).rejects.toThrow("byte limit");
    expect(bytesOnDisk).toBe(0);
    expect(existsSync(destination)).toBe(false);
  });

  test("aborts fetch before headers and clears its timer", async () => {
    const startTimer = jest.spyOn(globalThis, "setTimeout");
    const clearTimer = jest.spyOn(globalThis, "clearTimeout");
    let signal: AbortSignal | undefined;
    const fetchImplementation: FetchImplementation = (_input, init) =>
      new Promise((_resolve, reject) => {
        signal = init?.signal ?? undefined;
        signal?.addEventListener("abort", () => reject(signal?.reason), {
          once: true,
        });
      });
    await expect(
      downloadResource(
        resource({ timeoutMs: 20 }),
        destination,
        fetchImplementation,
      ),
    ).rejects.toThrow("resource.csv: download timed out after 20 ms");
    expect(signal?.aborted).toBe(true);
    expect(clearTimer).toHaveBeenCalledWith(startTimer.mock.results[0].value);
    expect(existsSync(destination)).toBe(false);
  });

  test.each([false, true])(
    "enforces the overall deadline on a body (keeps producing: %s)",
    async (keepsProducing) => {
      let interval: ReturnType<typeof setInterval> | undefined;
      let produced = 0;
      const cancel = jest.fn(() => clearInterval(interval));
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(Buffer.from("x"));
          if (keepsProducing)
            interval = setInterval(() => {
              produced++;
              controller.enqueue(Buffer.from("x"));
            }, 5);
        },
        cancel,
      });
      const startTimer = jest.spyOn(globalThis, "setTimeout");
      const clearTimer = jest.spyOn(globalThis, "clearTimeout");
      try {
        await expect(
          downloadResource(
            resource({ maxBytes: 1000, timeoutMs: 40 }),
            destination,
            async () => new Response(body),
          ),
        ).rejects.toThrow("timed out after 40 ms");
        expect(cancel).toHaveBeenCalledTimes(1);
        if (keepsProducing) expect(produced).toBeGreaterThan(0);
        expect(clearTimer).toHaveBeenCalledWith(
          startTimer.mock.results[0].value,
        );
        expect(existsSync(destination)).toBe(false);
      } finally {
        clearInterval(interval);
      }
    },
  );

  test.each(["checksum", "HTTP", "HTML", "missing body", "stream", "fetch"])(
    "cleans up a %s failure and clears its timer",
    async (failure) => {
      const startTimer = jest.spyOn(globalThis, "setTimeout");
      const clearTimer = jest.spyOn(globalThis, "clearTimeout");
      const cancel = jest.fn();
      let signal: AbortSignal | undefined;
      const fetchImplementation: FetchImplementation = async (_input, init) => {
        signal = init?.signal ?? undefined;
        if (failure === "fetch") throw new Error("network failed");
        if (failure === "missing body") return new Response(null);
        if (failure === "stream")
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.error(new Error("stream failed"));
              },
            }),
          );
        if (failure === "checksum") return new Response(data);
        const body = new ReadableStream({ cancel });
        return new Response(
          body,
          failure === "HTTP"
            ? { status: 503 }
            : { headers: { "content-type": "text/html" } },
        );
      };
      const message = {
        checksum: "checksum mismatch",
        HTTP: "HTTP 503",
        HTML: "returned HTML",
        "missing body": "empty response body",
        stream: "stream failed",
        fetch: "Could not download",
      }[failure]!;
      await expect(
        downloadResource(
          resource({ sha256: "0".repeat(64) }),
          destination,
          fetchImplementation,
        ),
      ).rejects.toThrow(message);
      expect(signal?.aborted).toBe(true);
      if (failure === "HTTP" || failure === "HTML")
        expect(cancel).toHaveBeenCalledTimes(1);
      expect(clearTimer).toHaveBeenCalledWith(startTimer.mock.results[0].value);
      expect(existsSync(destination)).toBe(false);
    },
  );

  test("preserves an existing destination and cancels the unused response", async () => {
    writeFileSync(destination, "existing output");
    const cancel = jest.fn();
    const body = new ReadableStream({ cancel });
    await expect(
      downloadResource(resource(), destination, async () => new Response(body)),
    ).rejects.toThrow("EEXIST");
    expect(readFileSync(destination, "utf8")).toBe("existing output");
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  test.each(["headers", "body"])(
    "real Node fetch cancels a stalled %s response",
    async (phase) => {
      let markClosed!: () => void;
      const connectionClosed = new Promise<void>((resolve) => {
        markClosed = resolve;
      });
      let markStarted!: () => void;
      const requestStarted = new Promise<void>((resolve) => {
        markStarted = resolve;
      });
      const server = createServer((_request, response) => {
        response.on("close", markClosed);
        if (phase === "body") {
          response.writeHead(200);
          response.write("partial");
        }
        markStarted();
      });
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      try {
        const address = server.address() as AddressInfo;
        const download = downloadResource(
          resource({
            url: `http://127.0.0.1:${address.port}/`,
            timeoutMs: 250,
          }),
          destination,
        );
        const rejection = expect(download).rejects.toThrow(
          "timed out after 250 ms",
        );
        await requestStarted;
        await rejection;
        await connectionClosed;
        expect(existsSync(destination)).toBe(false);
      } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
    },
  );
});

function fixtureResources(
  milestoneGeojson = Buffer.from(JSON.stringify(RAW_MILESTONE_GEOJSON)),
): RailwayFixtures {
  const geojson = Buffer.from(JSON.stringify(RAW_GEOJSON));
  const milestones = Buffer.from(RAW_CSV, "latin1");
  return {
    buffers: new Map([
      ["https://example.test/railways", geojson],
      ["https://example.test/milestone-geojson", milestoneGeojson],
      ["https://example.test/milestones", milestones],
    ]),
    manifest: {
      railwayGeojson: {
        maxBytes: geojson.length,
        timeoutMs: 1000,
        name: "railways.geojson",
        sha256: checksum(geojson),
        url: "https://example.test/railways",
      },
      milestoneGeojson: {
        maxBytes: milestoneGeojson.length,
        timeoutMs: 1000,
        name: "milestones.geojson",
        sha256: checksum(milestoneGeojson),
        url: "https://example.test/milestone-geojson",
      },
      milestones: {
        maxBytes: milestones.length,
        timeoutMs: 1000,
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
  let milestoneGeojsonPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "arow-railway-database-"));
    databasePath = join(directory, "railway_reference.sqlite");
    geojsonPath = join(directory, "lignes-par-type.geojson");
    milestoneGeojsonPath = join(directory, "milestones.geojson");
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
      milestoneGeojsonPath,
      resources: manifest,
    };
  }

  async function generateValidFixtureAssets(): Promise<void> {
    await setupRailwayDatabase(fixtureSetupOptions());
  }

  async function expectSetupFailurePreservesOutputs(
    fixtures: RailwayFixtures,
    expectedMessage: string,
    fetchImplementation: FetchImplementation = fixtureFetch(fixtures.buffers),
  ): Promise<void> {
    writeFileSync(geojsonPath, "existing geojson");
    writeFileSync(milestoneGeojsonPath, "existing milestone geojson");
    writeFileSync(databasePath, "existing database");

    await expect(
      setupRailwayDatabase({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        fetchImplementation,
        geojsonPath,
        milestoneGeojsonPath,
        resources: fixtures.manifest,
      }),
    ).rejects.toThrow(expectedMessage);
    expect(readFileSync(geojsonPath, "utf8")).toBe("existing geojson");
    expect(readFileSync(milestoneGeojsonPath, "utf8")).toBe(
      "existing milestone geojson",
    );
    expect(readFileSync(databasePath, "utf8")).toBe("existing database");
    expect(
      readdirSync(directory).some((name) =>
        name.startsWith(".railway-database-"),
      ),
    ).toBe(false);
  }

  test("downloads, validates, and deterministically prepares all assets", async () => {
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
    const milestoneGeojson = normalizeMilestoneGeoJson(
      JSON.parse(readFileSync(milestoneGeojsonPath, "utf8")),
    );
    expect(readFileSync(milestoneGeojsonPath)).toEqual(
      Buffer.from(JSON.stringify(RAW_MILESTONE_GEOJSON)),
    );
    expect(
      milestoneGeojson.features.map(({ id, properties }) => ({
        id,
        properties,
      })),
    ).toEqual([
      {
        id: "001000:1:1000",
        properties: {
          label: "001+000",
          lineCode: "001000",
          positionMeters: 1000,
          sectionRank: 1,
        },
      },
      {
        id: "008000:2:2000",
        properties: {
          label: "2+000",
          lineCode: "008000",
          positionMeters: 2000,
          sectionRank: 2,
        },
      },
    ]);

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
    const firstMilestoneGeojson = readFileSync(milestoneGeojsonPath);
    const firstDatabase = readFileSync(databasePath);
    await setupRailwayDatabase(options);
    expect(readFileSync(geojsonPath)).toEqual(firstGeojson);
    expect(readFileSync(milestoneGeojsonPath)).toEqual(firstMilestoneGeojson);
    expect(readFileSync(databasePath)).toEqual(firstDatabase);
    expect(fetchImplementation).toHaveBeenCalledTimes(6);
  });

  test("validates prepared railway assets without modifying them", async () => {
    await generateValidFixtureAssets();
    const originalGeojson = readFileSync(geojsonPath);
    const originalMilestoneGeojson = readFileSync(milestoneGeojsonPath);
    const originalDatabase = readFileSync(databasePath);

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath,
      }),
    ).not.toThrow();
    expect(readFileSync(geojsonPath)).toEqual(originalGeojson);
    expect(readFileSync(milestoneGeojsonPath)).toEqual(
      originalMilestoneGeojson,
    );
    expect(readFileSync(databasePath)).toEqual(originalDatabase);
  });

  test("reports a missing GeoJSON asset with setup guidance", async () => {
    await generateValidFixtureAssets();

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath: join(directory, "missing.geojson"),
        milestoneGeojsonPath,
      }),
    ).toThrow(
      "Railway GeoJSON asset is missing or invalid. ENOENT: no such file or directory",
    );
    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath: join(directory, "missing.geojson"),
        milestoneGeojsonPath,
      }),
    ).toThrow("Run `npm run database:setup`");
  });

  test("reports a missing milestone GeoJSON asset with setup guidance", async () => {
    await generateValidFixtureAssets();

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath: join(directory, "missing-milestones.geojson"),
      }),
    ).toThrow("Milestone GeoJSON asset is missing or invalid");
  });

  test("reports a missing SQLite asset with setup guidance", async () => {
    await generateValidFixtureAssets();

    expect(() =>
      validateRailwayAssets({
        databasePath: join(directory, "missing.sqlite"),
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath,
      }),
    ).toThrow("Railway SQLite asset is missing or invalid");
    expect(() =>
      validateRailwayAssets({
        databasePath: join(directory, "missing.sqlite"),
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath,
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
        milestoneGeojsonPath,
      }),
    ).toThrow("Railway GeoJSON asset is missing or invalid");

    await generateValidFixtureAssets();
    writeFileSync(databasePath, "not SQLite");
    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath,
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
        milestoneGeojsonPath,
      }),
    ).toThrow(
      "Railway GeoJSON asset is missing or invalid. Expected 2 railway features, received 1",
    );

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: { ...FIXTURE_SNAPSHOT, milestoneCount: 3 },
        geojsonPath,
        milestoneGeojsonPath,
      }),
    ).toThrow(
      "Milestone GeoJSON asset is missing or invalid. Expected 3 milestone features, received 2",
    );
  });

  test("rejects a milestone asset with a mismatched label and position", async () => {
    await generateValidFixtureAssets();
    writeFileSync(
      milestoneGeojsonPath,
      JSON.stringify(milestoneGeojsonWithMismatchedLabel()),
    );

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath,
      }),
    ).toThrow(
      "Milestone GeoJSON asset is missing or invalid. Milestone GeoJSON contains an invalid feature",
    );
  });

  test("rejects a database built with the previous schema version", async () => {
    await generateValidFixtureAssets();
    const database = new DatabaseSync(databasePath);
    try {
      database.exec("PRAGMA user_version = 1");
    } finally {
      database.close();
    }

    expect(() =>
      validateRailwayAssets({
        databasePath,
        expectedSnapshot: FIXTURE_SNAPSHOT,
        geojsonPath,
        milestoneGeojsonPath,
      }),
    ).toThrow("Generated database schema version must be 2");
  });

  test("preserves existing outputs when a download checksum fails", async () => {
    const { buffers, manifest } = fixtureResources();
    const invalidManifest: RailwayResources = {
      ...manifest,
      milestoneGeojson: {
        ...manifest.milestoneGeojson,
        sha256: "0".repeat(64),
      },
    };

    await expectSetupFailurePreservesOutputs(
      { buffers, manifest: invalidManifest },
      "checksum mismatch",
    );
  });

  test.each(["size", "timeout", "stream"])(
    "preserves outputs and waits for siblings after %s failure",
    async (failure) => {
      const fixtures = fixtureResources();
      let siblingFinished = false;
      let failedBodyCancelled = false;
      const manifest: RailwayResources = {
        ...fixtures.manifest,
        milestoneGeojson: {
          ...fixtures.manifest.milestoneGeojson,
          maxBytes: 1,
          timeoutMs: 20,
        },
      };
      const fetchImplementation: FetchImplementation = async (input) => {
        if (input.toString() === manifest.milestoneGeojson.url) {
          return new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                if (failure === "size")
                  controller.enqueue(Buffer.from("too big"));
                if (failure === "stream")
                  controller.error(new Error("fixture stream failed"));
              },
              cancel() {
                failedBodyCancelled = true;
              },
            }),
          );
        }
        if (input.toString() === manifest.milestones.url) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          siblingFinished = true;
        }
        return new Response(
          Uint8Array.from(fixtures.buffers.get(input.toString())!).buffer,
        );
      };
      await expectSetupFailurePreservesOutputs(
        { ...fixtures, manifest },
        failure === "size"
          ? "byte limit"
          : failure === "timeout"
            ? "timed out"
            : "fixture stream failed",
        fetchImplementation,
      );
      expect(siblingFinished).toBe(true);
      if (failure !== "stream") expect(failedBodyCancelled).toBe(true);
    },
  );

  test("rejects malformed, invalid, and incomplete milestone GeoJSON", async () => {
    await expectSetupFailurePreservesOutputs(
      fixtureResources(Buffer.from("not JSON")),
      "Unexpected token",
    );

    const invalidFeature = {
      ...RAW_MILESTONE_GEOJSON,
      features: [
        { ...RAW_MILESTONE_GEOJSON.features[0], id: "wrong-id" },
        RAW_MILESTONE_GEOJSON.features[1],
      ],
    };
    await expectSetupFailurePreservesOutputs(
      fixtureResources(Buffer.from(JSON.stringify(invalidFeature))),
      "Milestone GeoJSON feature has invalid id wrong-id",
    );

    await expectSetupFailurePreservesOutputs(
      fixtureResources(
        Buffer.from(JSON.stringify(milestoneGeojsonWithMismatchedLabel())),
      ),
      "Milestone GeoJSON contains an invalid feature",
    );

    const wrongCount = {
      ...RAW_MILESTONE_GEOJSON,
      features: RAW_MILESTONE_GEOJSON.features.slice(0, 1),
    };
    await expectSetupFailurePreservesOutputs(
      fixtureResources(Buffer.from(JSON.stringify(wrongCount))),
      "Expected 2 milestone features, received 1",
    );
  });

  test("rejects an HTML milestone GeoJSON response transactionally", async () => {
    const fixtures = fixtureResources();
    const fetchImplementation = fixtureFetch(fixtures.buffers);
    fetchImplementation.mockImplementation(async (input: string | URL) => {
      if (input.toString() === "https://example.test/milestone-geojson") {
        return new Response("<html></html>", {
          headers: { "content-type": "text/html" },
        });
      }
      const body = fixtures.buffers.get(input.toString());
      return body === undefined
        ? new Response("Not found", { status: 404 })
        : new Response(Uint8Array.from(body).buffer);
    });
    await expectSetupFailurePreservesOutputs(
      fixtures,
      "Google Drive returned HTML instead of the resource",
      fetchImplementation,
    );
  });

  test("rejects HTML responses instead of saving a Drive error page", async () => {
    const destinationPath = join(directory, "download");
    await expect(
      downloadResource(
        {
          maxBytes: 100,
          timeoutMs: 1000,
          name: "resource.csv",
          sha256: "unused",
          url: "test",
        },
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
