import { readFileSync, writeFileSync } from "node:fs";

import {
  DEFAULT_RAILWAY_DATABASE_PATH,
  DEFAULT_RAILWAY_GEOJSON_PATH,
  EXPECTED_RAILWAY_SNAPSHOT,
} from "./configuration";
import { parseMilestoneCsv } from "./csv";
import {
  completeRailwaySections,
  createRailwayDatabase,
  validateRailwayDatabase,
} from "./database";
import { normalizeRailwayGeoJson } from "./geojson";
import { validateImportedMilestones } from "./asset-consistency";
import {
  createImportReport,
  duplicateFilterWarning,
  validateImportReport,
} from "./import-report";
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
  ParsedMilestones,
  RailwayFeatureCollection,
  RailwayResources,
  RailwaySection,
  RailwaySectionWithGeometry,
  SetupOptions,
  SkippedMilestone,
  StagingWorkspace,
} from "./types";

const SUMMARY_KEYS = [
  "duplicateMilestoneCount",
  "fallbackSectionCount",
  "geometryCount",
  "geometryWithoutMilestoneCount",
  "milestoneCount",
  "railwaySectionCount",
  "skippedMilestoneCount",
] as const satisfies readonly (keyof GenerationSummary)[];

interface RailwaySources extends ParsedMilestones {
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
      resources.railwayGeojson,
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
  const parsed = parseMilestoneCsv(readFileSync(workspace.rawMilestonesPath));
  return Object.freeze({ geojson, geojsonSections, ...parsed });
}

function summarizeRailwayData(
  geojsonSections: readonly RailwaySectionWithGeometry[],
  sections: readonly RailwaySection[],
  milestones: readonly Milestone[],
  skipped: readonly SkippedMilestone[],
  duplicateCount: number,
): GenerationSummary {
  const milestoneSectionIds = new Set(
    milestones.map((milestone) => `${milestone.code}:${milestone.rank}`),
  );
  return Object.freeze({
    duplicateMilestoneCount: duplicateCount,
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
  const sources = readRailwaySources(workspace);
  const { geojson, geojsonSections, milestones, skipped, duplicates } = sources;
  const sections = completeRailwaySections(geojsonSections, milestones);
  const summary = summarizeRailwayData(
    geojsonSections,
    sections,
    milestones,
    skipped,
    duplicates.length,
  );
  validateExpectedSnapshot(summary, expectedSnapshot);

  writeFileSync(workspace.stagedGeojsonPath, JSON.stringify(geojson));
  writeFileSync(
    workspace.stagedImportReportPath,
    JSON.stringify(createImportReport(workspace, sources, summary), null, 2) +
      "\n",
  );
  createRailwayDatabase(workspace.stagedDatabasePath, sections, milestones);
  validateRailwayDatabase(workspace.stagedDatabasePath, summary);
  validateImportedMilestones(workspace.stagedDatabasePath, milestones);
  validateImportReport(workspace.stagedImportReportPath, summary);
  return Object.freeze({ skipped, summary });
}

function reportGeneration(
  { skipped, summary }: GenerationResult,
  logger: GenerationLogger,
  reportPath: string,
): void {
  logger.warn(
    duplicateFilterWarning(summary.duplicateMilestoneCount, reportPath),
  );
  for (const skippedMilestone of skipped) {
    logger.warn(
      `Skipped unsupported milestone ${skippedMilestone.label} at CSV line ${skippedMilestone.lineNumber}`,
    );
  }
  logger.log(
    `Prepared ${summary.railwaySectionCount} railway sections and ${summary.milestoneCount} milestones`,
  );
}

export async function setupRailwayDatabase({
  databasePath = DEFAULT_RAILWAY_DATABASE_PATH,
  expectedSnapshot = EXPECTED_RAILWAY_SNAPSHOT,
  fetchImplementation = fetch,
  geojsonPath = DEFAULT_RAILWAY_GEOJSON_PATH,
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
    reportGeneration(result, logger, workspace.targetImportReportPath);
    return result.summary;
  } finally {
    removeStagingWorkspace(workspace);
  }
}
