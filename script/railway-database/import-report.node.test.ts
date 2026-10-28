/** @jest-environment node */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { duplicateFilterWarning, validateImportReport } from "./import-report";
import {
  createStagingWorkspace,
  promoteStagedOutputs,
  removeStagingWorkspace,
} from "./staging";
import { RAILWAY_RESOURCES } from "./resources";
import { setupRailwayDatabase } from "./setup";

test("warns in red and bold, preserves plain output, and respects NO_COLOR", () => {
  const previous = process.env.NO_COLOR;
  try {
    delete process.env.NO_COLOR;
    const plain = duplicateFilterWarning(908, "/audit.json", false);
    expect(plain).toContain("WARNING: DUPLICATE FILTER APPLIED");
    expect(plain).toContain("908 duplicate rows. Audit: /audit.json");
    expect(plain).not.toContain("\u001b");
    const colored = duplicateFilterWarning(908, "/audit.json", true);
    expect(colored).toContain("\u001b[31m");
    expect(colored).toContain("\u001b[1m");
    process.env.NO_COLOR = "1";
    expect(duplicateFilterWarning(908, "/audit.json", true)).toBe(plain);
  } finally {
    if (previous === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = previous;
  }
});

test("rolls back all three outputs when promotion fails partway through", () => {
  const directory = mkdtempSync(join(tmpdir(), "arow-promotion-"));
  const workspace = createStagingWorkspace({
    databasePath: join(directory, "reference.sqlite"),
    geojsonPath: join(directory, "railways.geojson"),
    resources: RAILWAY_RESOURCES,
  });
  const outputs = [
    workspace.targetImportReportPath,
    workspace.targetGeojsonPath,
    workspace.targetDatabasePath,
  ];
  try {
    for (const path of outputs) writeFileSync(path, `previous:${path}`);
    writeFileSync(workspace.stagedImportReportPath, "new report");
    writeFileSync(workspace.stagedGeojsonPath, "new geometry");
    // The missing staged database fails after the first two promotions.
    expect(() => promoteStagedOutputs(workspace)).toThrow();
    for (const path of outputs)
      expect(readFileSync(path, "utf8")).toBe(`previous:${path}`);
  } finally {
    removeStagingWorkspace(workspace);
    rmSync(directory, { recursive: true, force: true });
  }
});

test("validates detailed audit counts and filtering policy", async () => {
  const directory = mkdtempSync(join(tmpdir(), "arow-report-"));
  try {
    const csv = Buffer.from(
      "TYPE_REPER;PK;LIGNE;CODE_LIGNE;RG_TRONCON;latitude;longitude\nAny;000+100;001000-1;1000;1;48;2\nOther;0+100;001000-1;1000;1;49;3\nOther;D+000;001000-1;1000;1;48;2\n",
    );
    const geojson = Buffer.from('{"type":"FeatureCollection","features":[]}');
    const { createHash } = await import("node:crypto");
    const resource = (name: string, data: Buffer) => ({
      name,
      url: `https://example.test/${name}`,
      sha256: createHash("sha256").update(data).digest("hex"),
      maxBytes: data.length,
      timeoutMs: 1000,
    });
    const summary = await setupRailwayDatabase({
      databasePath: join(directory, "reference.sqlite"),
      geojsonPath: join(directory, "railways.geojson"),
      expectedSnapshot: {
        duplicateMilestoneCount: 1,
        fallbackSectionCount: 1,
        geometryCount: 0,
        geometryWithoutMilestoneCount: 0,
        milestoneCount: 1,
        railwaySectionCount: 1,
        skippedMilestoneCount: 1,
      },
      resources: {
        milestones: resource("source.csv", csv),
        railwayGeojson: resource("source.geojson", geojson),
      },
      fetchImplementation: async (url) =>
        new Response(String(url).endsWith(".csv") ? csv : geojson),
      logger: { log: () => undefined, warn: () => undefined },
    });
    const path = join(directory, "railway_reference.import-report.json");
    const report = JSON.parse(readFileSync(path, "utf8"));
    expect(report).toMatchObject({
      formatVersion: 1,
      duplicatePolicy: "FIRST_CSV_OCCURRENCE_WINS",
      summary: {
        milestoneCount: 1,
        duplicateMilestoneCount: 1,
        skippedMilestoneCount: 1,
      },
      unsupported: [
        { label: "D+000", lineNumber: 4, reason: "unsupported-pk" },
      ],
      duplicates: [
        {
          id: "001000:1:100",
          kept: { lineNumber: 2, type: "Any", latitude: "48" },
          discarded: { lineNumber: 3, type: "Other", latitude: "49" },
        },
      ],
    });
    expect(() => validateImportReport(path, summary)).not.toThrow();
    writeFileSync(path, JSON.stringify({ ...report, duplicates: [] }));
    expect(() => validateImportReport(path, summary)).toThrow(
      "filtering counts",
    );
    writeFileSync(
      path,
      JSON.stringify({ ...report, duplicatePolicy: "last-wins" }),
    );
    expect(() => validateImportReport(path, summary)).toThrow(
      "filtering policy",
    );
    const reversed = structuredClone(report);
    reversed.duplicates[0].kept.lineNumber = 5;
    writeFileSync(path, JSON.stringify(reversed));
    expect(() => validateImportReport(path, summary)).toThrow(
      "first-occurrence",
    );
    const wrongPosition = structuredClone(report);
    wrongPosition.duplicates[0].discarded.label = "001+100";
    writeFileSync(path, JSON.stringify(wrongPosition));
    expect(() => validateImportReport(path, summary)).toThrow(
      "identity disagrees",
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
