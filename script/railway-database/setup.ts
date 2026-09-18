import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { parseMilestoneCsv } from "./csv";
import {
  completeRailwaySections,
  createRailwayDatabase,
  validateRailwayDatabase,
} from "./database";
import { normalizeRailwayGeoJson } from "./geojson";
import { downloadResource, RAILWAY_RESOURCES } from "./resources";
import {
  createStagingWorkspace,
  promoteStagedOutputs,
  removeStagingWorkspace,
} from "./staging";
import type {
  GenerationLogger,
  GenerationSummary,
  Milestone,
  RailwayFeatureCollection,
  RailwayResources,
  RailwaySection,
  RailwaySectionWithGeometry,
  SetupOptions,
  SkippedMilestone,
  StagingWorkspace,
} from "./types";

const DEFAULT_GEOJSON_PATH = resolve("src/statics/lignes-par-type.geojson");
const DEFAULT_DATABASE_PATH = resolve("src/statics/railway_reference.sqlite");
const EXPECTED_SNAPSHOT: GenerationSummary = Object.freeze({
  fallbackSectionCount: 2,
  geometryCount: 1043,
  geometryWithoutMilestoneCount: 27,
  milestoneCount: 36812,
  railwaySectionCount: 1045,
  skippedMilestoneCount: 1,
});
const SUMMARY_KEYS = [
  "fallbackSectionCount",
  "geometryCount",
  "geometryWithoutMilestoneCount",
  "milestoneCount",
  "railwaySectionCount",
  "skippedMilestoneCount",
] as const satisfies readonly (keyof GenerationSummary)[];

interface RailwaySources {
  readonly geojson: RailwayFeatureCollection;
  readonly geojsonSections: readonly RailwaySectionWithGeometry[];
  readonly milestones: readonly Milestone[];
  readonly skipped: readonly SkippedMilestone[];
}

interface GenerationResult {
  readonly skipped: readonly SkippedMilestone[];
  readonly summary: GenerationSummary;
}

async function downloadRailwaySources(
  workspace: StagingWorkspace,
  resources: RailwayResources,
  fetchImplementation: NonNullable<SetupOptions["fetchImplementation"]>,
): Promise<void> {
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

function readRailwaySources(workspace: StagingWorkspace): RailwaySources {
  const rawGeojson: unknown = JSON.parse(
    readFileSync(workspace.rawGeojsonPath, "utf8"),
  );
  const { geojson, sections: geojsonSections } =
    normalizeRailwayGeoJson(rawGeojson);
  const { milestones, skipped } = parseMilestoneCsv(
    readFileSync(workspace.rawMilestonesPath),
  );
  return Object.freeze({ geojson, geojsonSections, milestones, skipped });
}

function summarizeRailwayData(
  geojsonSections: readonly RailwaySectionWithGeometry[],
  sections: readonly RailwaySection[],
  milestones: readonly Milestone[],
  skipped: readonly SkippedMilestone[],
): GenerationSummary {
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

function validateExpectedSnapshot(
  summary: GenerationSummary,
  expectedSnapshot: GenerationSummary | undefined,
): void {
  if (expectedSnapshot === undefined) {
    return;
  }
  for (const key of SUMMARY_KEYS) {
    const expectedValue = expectedSnapshot[key];
    if (summary[key] !== expectedValue) {
      throw new Error(
        `Generated ${key} does not match the pinned snapshot: expected ${expectedValue}, received ${summary[key]}`,
      );
    }
  }
}

function buildStagedAssets(
  workspace: StagingWorkspace,
  expectedSnapshot: GenerationSummary | undefined,
): GenerationResult {
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

function reportGeneration(
  { skipped, summary }: GenerationResult,
  logger: GenerationLogger,
): void {
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
}: SetupOptions = {}): Promise<GenerationSummary> {
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
