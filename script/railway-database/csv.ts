import {
  canonicalLineCode,
  milestonePositionMeters,
  requireCoordinate,
  requirePositiveInteger,
} from "./validation";
import { milestoneId } from "../../shared/railway-reference/values";
import type { Milestone, ParsedMilestones, SkippedMilestone } from "./types";

const EXPECTED_HEADER = Object.freeze([
  "TYPE_REPER",
  "PK",
  "LIGNE",
  "CODE_LIGNE",
  "RG_TRONCON",
  "latitude",
  "longitude",
]);
const LINE_REFERENCE = /^(\d{6})-(\d+)$/;
const SKIPPED_LABELS = new Set(["D+000"]);

function parseDecimal(value: string, context: string): number {
  if (!/^-?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?$/i.test(value)) {
    throw new Error(`${context} must be a decimal number`);
  }
  return Number(value.replace(",", "."));
}

function parseLineReference(
  value: string,
  context: string,
): Readonly<{ code: string; rank: number }> {
  const match = LINE_REFERENCE.exec(value);
  if (match === null) {
    throw new Error(`${context} must use the six-digit-code-rank format`);
  }
  return {
    code: match[1],
    rank: requirePositiveInteger(Number(match[2]), `${context} rank`),
  };
}

function parseMilestone(
  fields: readonly string[],
  lineNumber: number,
): Milestone {
  const context = `Milestone CSV line ${lineNumber}`;
  const [
    ,
    label,
    lineReferenceValue,
    codeValue,
    rankValue,
    latitude,
    longitude,
  ] = fields;
  if (!/^\d{1,6}$/.test(codeValue)) {
    throw new Error(`${context} CODE_LIGNE must contain one to six digits`);
  }

  const code = canonicalLineCode(Number(codeValue), `${context} CODE_LIGNE`);
  const lineReference = parseLineReference(
    lineReferenceValue,
    `${context} LIGNE`,
  );
  if (lineReference.code !== code) {
    throw new Error(
      `${context} LIGNE and CODE_LIGNE must identify the same line`,
    );
  }

  const rank =
    rankValue === ""
      ? lineReference.rank
      : requirePositiveInteger(Number(rankValue), `${context} RG_TRONCON`);
  if (rank !== lineReference.rank) {
    throw new Error(
      `${context} LIGNE and RG_TRONCON must identify the same rank`,
    );
  }

  return Object.freeze({
    code,
    label,
    latitude: requireCoordinate(
      parseDecimal(latitude, `${context} latitude`),
      -90,
      90,
      `${context} latitude`,
    ),
    longitude: requireCoordinate(
      parseDecimal(longitude, `${context} longitude`),
      -180,
      180,
      `${context} longitude`,
    ),
    positionMeters: milestonePositionMeters(label, `${context} PK`),
    rank,
  });
}

export function parseMilestoneCsv(buffer: Uint8Array): ParsedMilestones {
  const text = Buffer.from(buffer).toString("latin1");
  const lines = text.split(/\r?\n/);
  const header = lines.shift()?.split(";");
  if (JSON.stringify(header) !== JSON.stringify(EXPECTED_HEADER)) {
    throw new Error("Milestone CSV header does not match the expected format");
  }

  const milestones: Milestone[] = [];
  const skipped: SkippedMilestone[] = [];
  const ids = new Set<string>();
  for (const [index, line] of lines.entries()) {
    if (line === "") {
      continue;
    }
    const lineNumber = index + 2;
    const fields = line.split(";");
    if (fields.length !== EXPECTED_HEADER.length) {
      throw new Error(
        `Milestone CSV line ${lineNumber} must contain ${EXPECTED_HEADER.length} columns`,
      );
    }
    if (fields[0] !== "Kilomètre") {
      continue;
    }
    if (SKIPPED_LABELS.has(fields[1])) {
      skipped.push(Object.freeze({ label: fields[1], lineNumber }));
      continue;
    }

    const milestone = parseMilestone(fields, lineNumber);
    const id = milestoneId(
      milestone.code,
      milestone.rank,
      milestone.positionMeters,
    );
    if (ids.has(id)) {
      throw new Error(`Duplicate milestone ${id} at CSV line ${lineNumber}`);
    }
    ids.add(id);
    milestones.push(milestone);
  }

  milestones.sort(
    (left, right) =>
      left.code.localeCompare(right.code) ||
      left.rank - right.rank ||
      left.positionMeters - right.positionMeters,
  );
  return Object.freeze({
    milestones: Object.freeze(milestones),
    skipped: Object.freeze(skipped),
  });
}
