import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { styleText } from "node:util";

import { isRecord } from "../../shared/value-validation";
import { parseMilestoneLabel } from "../../shared/railway-domain/kilometric-position";
import type {
  GenerationSummary,
  MilestoneSourceRow,
  ParsedMilestones,
  StagingWorkspace,
} from "./types";

export const DUPLICATE_POLICY = "FIRST_CSV_OCCURRENCE_WINS";
export const SUPPORTED_PK_RULE =
  "digits+three-digits; non-negative safe integer metres";

function isSourceRow(value: unknown): value is MilestoneSourceRow {
  return (
    isRecord(value) &&
    typeof value.lineNumber === "number" &&
    Number.isSafeInteger(value.lineNumber) &&
    value.lineNumber >= 2 &&
    typeof value.label === "string" &&
    typeof value.type === "string" &&
    typeof value.latitude === "string" &&
    typeof value.longitude === "string"
  );
}

export function createImportReport(
  workspace: StagingWorkspace,
  parsed: ParsedMilestones,
  summary: GenerationSummary,
) {
  const checksum = (path: string) =>
    createHash("sha256").update(readFileSync(path)).digest("hex");
  return {
    formatVersion: 1,
    duplicatePolicy: DUPLICATE_POLICY,
    supportedPkRule: SUPPORTED_PK_RULE,
    sources: {
      csvSha256: checksum(workspace.rawMilestonesPath),
      railwayGeojsonSha256: checksum(workspace.rawGeojsonPath),
    },
    summary,
    unsupported: parsed.skipped,
    duplicates: parsed.duplicates,
  };
}

export function validateImportReport(
  path: string,
  summary: GenerationSummary,
): void {
  const report: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (
    !isRecord(report) ||
    report.formatVersion !== 1 ||
    report.duplicatePolicy !== DUPLICATE_POLICY ||
    report.supportedPkRule !== SUPPORTED_PK_RULE ||
    !isRecord(report.summary) ||
    !isRecord(report.sources) ||
    !Array.isArray(report.unsupported) ||
    !Array.isArray(report.duplicates)
  ) {
    throw new Error("Import report has an invalid format or filtering policy");
  }
  for (const hash of [
    report.sources.csvSha256,
    report.sources.railwayGeojsonSha256,
  ]) {
    if (typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash))
      throw new Error("Import report has invalid source hashes");
  }
  for (const key of Object.keys(summary) as (keyof GenerationSummary)[]) {
    if (report.summary[key] !== summary[key])
      throw new Error(`Import report ${key} does not match the snapshot`);
  }
  if (
    report.unsupported.length !== summary.skippedMilestoneCount ||
    report.duplicates.length !== summary.duplicateMilestoneCount
  ) {
    throw new Error("Import report filtering counts do not match its entries");
  }
  for (const entry of report.unsupported) {
    if (
      !isRecord(entry) ||
      typeof entry.lineNumber !== "number" ||
      !Number.isSafeInteger(entry.lineNumber) ||
      entry.lineNumber < 2 ||
      typeof entry.label !== "string" ||
      entry.reason !== "unsupported-pk"
    ) {
      throw new Error("Import report has an invalid unsupported-PK entry");
    }
  }
  for (const entry of report.duplicates) {
    if (
      !isRecord(entry) ||
      typeof entry.id !== "string" ||
      !/^\d{6}:[1-9]\d*:\d+$/.test(entry.id) ||
      !isSourceRow(entry.kept) ||
      !isSourceRow(entry.discarded) ||
      entry.kept.lineNumber >= entry.discarded.lineNumber
    ) {
      throw new Error(
        "Import report has an invalid first-occurrence audit entry",
      );
    }
    const position = Number(entry.id.split(":")[2]);
    if (
      !Number.isSafeInteger(position) ||
      [entry.kept, entry.discarded].some(
        (row) => parseMilestoneLabel(row.label)?.positionMeters !== position,
      )
    ) {
      throw new Error(
        "Import report duplicate identity disagrees with its labels",
      );
    }
  }
}

export function duplicateFilterWarning(
  count: number,
  reportPath: string,
  colors = process.env.NO_COLOR === undefined && Boolean(process.stderr.isTTY),
): string {
  const message = `WARNING: DUPLICATE FILTER APPLIED — FIRST CSV OCCURRENCE WINS. Discarded ${count} duplicate rows. Audit: ${reportPath}`;
  return colors && process.env.NO_COLOR === undefined
    ? styleText(["red", "bold"], message, { validateStream: false })
    : message;
}
