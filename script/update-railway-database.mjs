import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { parseMilestoneCsv } from "./railway-database/csv.mjs";
import {
  completeRailwaySections,
  createRailwayDatabase,
  validateRailwayDatabase,
} from "./railway-database/database.mjs";
import { normalizeRailwayGeoJson } from "./railway-database/geojson.mjs";
import {
  downloadResource,
  RAILWAY_RESOURCES,
} from "./railway-database/resources.mjs";
import {
  createStagingWorkspace,
  promoteStagedOutputs,
  removeStagingWorkspace,
} from "./railway-database/staging.mjs";

const DEFAULT_GEOJSON_PATH = resolve("src/statics/lignes-par-type.geojson");
const DEFAULT_DATABASE_PATH = resolve("src/statics/railway_reference.sqlite");
const EXPECTED_SNAPSHOT = Object.freeze({
  fallbackSectionCount: 2,
  geometryCount: 1043,
  geometryWithoutMilestoneCount: 27,
  milestoneCount: 36812,
  railwaySectionCount: 1045,
  skippedMilestoneCount: 1,
});

async function downloadRailwaySources(
  workspace,
  resources,
  fetchImplementation,
) {
  const results = await Promise.allSettled([
    downloadResource(
      resources.geojson,
      workspace.rawGeojsonPath,
      fetchImplementation,
    ),
    downloadResource(
      resources.milestones,
      workspace.rawMilestonesPath,
      fetchImplementation,
    ),
  ]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure !== undefined) {
    throw failure.reason;
  }
}

function readRailwaySources(workspace) {
  const rawGeojson = JSON.parse(readFileSync(workspace.rawGeojsonPath, "utf8"));
  const { geojson, sections: geojsonSections } =
    normalizeRailwayGeoJson(rawGeojson);
  const { milestones, skipped } = parseMilestoneCsv(
    readFileSync(workspace.rawMilestonesPath),
  );
  return Object.freeze({ geojson, geojsonSections, milestones, skipped });
}

function summarizeRailwayData(geojsonSections, sections, milestones, skipped) {
  const milestoneSectionIds = new Set(
    milestones.map((milestone) => `${milestone.code}:${milestone.rank}`),
  );
  return Object.freeze({
    fallbackSectionCount: sections.length - geojsonSections.length,
    geometryCount: geojsonSections.length,
    geometryWithoutMilestoneCount: geojsonSections.filter(
      (section) => !milestoneSectionIds.has(`${section.code}:${section.rank}`),
    ).length,
    milestoneCount: milestones.length,
    railwaySectionCount: sections.length,
    skippedMilestoneCount: skipped.length,
  });
}

function validateExpectedSnapshot(summary, expectedSnapshot) {
  if (expectedSnapshot === undefined) {
    return;
  }
  for (const [key, expectedValue] of Object.entries(expectedSnapshot)) {
    if (summary[key] !== expectedValue) {
      throw new Error(
        `Generated ${key} does not match the pinned snapshot: expected ${expectedValue}, received ${summary[key]}`,
      );
    }
  }
}

function buildStagedAssets(workspace, expectedSnapshot) {
  const { geojson, geojsonSections, milestones, skipped } =
    readRailwaySources(workspace);
  const sections = completeRailwaySections(geojsonSections, milestones);
  const summary = summarizeRailwayData(
    geojsonSections,
    sections,
    milestones,
    skipped,
  );
  validateExpectedSnapshot(summary, expectedSnapshot);

  writeFileSync(workspace.stagedGeojsonPath, JSON.stringify(geojson));
  createRailwayDatabase(workspace.stagedDatabasePath, sections, milestones);
  validateRailwayDatabase(workspace.stagedDatabasePath, summary);
  return Object.freeze({ skipped, summary });
}

function reportGeneration({ skipped, summary }, logger) {
  for (const skippedMilestone of skipped) {
    logger.warn(
      `Skipped unsupported milestone ${skippedMilestone.label} at CSV line ${skippedMilestone.lineNumber}`,
    );
  }
  logger.log(
    `Generated ${summary.railwaySectionCount} railway sections and ${summary.milestoneCount} milestones`,
  );
}

export async function setupRailwayDatabase({
  databasePath = DEFAULT_DATABASE_PATH,
  expectedSnapshot = EXPECTED_SNAPSHOT,
  fetchImplementation = fetch,
  geojsonPath = DEFAULT_GEOJSON_PATH,
  logger = console,
  resources = RAILWAY_RESOURCES,
} = {}) {
  const workspace = createStagingWorkspace({
    databasePath,
    geojsonPath,
    resources,
  });
  try {
    await downloadRailwaySources(workspace, resources, fetchImplementation);
    const result = buildStagedAssets(workspace, expectedSnapshot);
    promoteStagedOutputs(workspace);
    reportGeneration(result, logger);
    return result.summary;
  } finally {
    removeStagingWorkspace(workspace);
  }
}

async function main() {
  await setupRailwayDatabase();
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((cause) => {
    console.error(cause instanceof Error ? cause.message : cause);
    process.exitCode = 1;
  });
}
