import { RailwaySectionId } from "../../shared/railway-domain/railway-section-id";
import { parseMilestoneLabel } from "../../shared/railway-domain/kilometric-position";
import {
  canonicalLineCode,
  milestonePositionMeters,
  requireCoordinate,
  requirePositiveInteger,
} from "./validation";
import { MilestoneId } from "../../shared/railway-domain/milestone-id";
import type {
  DuplicateMilestone,
  Milestone,
  MilestoneSourceRow,
  ParsedMilestones,
  SkippedMilestone,
} from "./types";

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

function parseMilestoneIdentity(
  fields: readonly string[],
  lineNumber: number,
): Pick<Milestone, "code" | "rank" | "label" | "positionMeters"> {
  const context = `Milestone CSV line ${lineNumber}`;
  const [, label, lineReferenceValue, codeValue, rankValue] = fields;
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
  const sources = new Map<string, MilestoneSourceRow>();
  const duplicates: DuplicateMilestone[] = [];
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
    const position = parseMilestoneLabel(fields[1])?.positionMeters;
    if (
      position === undefined ||
      !Number.isSafeInteger(position) ||
      position < 0
    ) {
      skipped.push(
        Object.freeze({
          label: fields[1],
          lineNumber,
          reason: "unsupported-pk",
        }),
      );
      continue;
    }

    const milestone = parseMilestoneIdentity(fields, lineNumber);
    const id = new MilestoneId(
      new RailwaySectionId(milestone.code, milestone.rank),
      milestone.positionMeters,
    ).value;
    const source = Object.freeze({
      lineNumber,
      label: fields[1],
      type: fields[0],
      latitude: fields[5],
      longitude: fields[6],
    });
    const kept = sources.get(id);
    // WARNING: DUPLICATE FILTER APPLIED — FIRST CSV OCCURRENCE WINS.
    // Preserve source order and the original coordinates; see the import report.
    if (kept !== undefined) {
      duplicates.push(Object.freeze({ id, kept, discarded: source }));
      continue;
    }
    const context = `Milestone CSV line ${lineNumber}`;
    milestones.push(
      Object.freeze({
        ...milestone,
        latitude: requireCoordinate(
          parseDecimal(fields[5], `${context} latitude`),
          -90,
          90,
          `${context} latitude`,
        ),
        longitude: requireCoordinate(
          parseDecimal(fields[6], `${context} longitude`),
          -180,
          180,
          `${context} longitude`,
        ),
      }),
    );
    sources.set(id, source);
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
    duplicates: Object.freeze(duplicates),
  });
}
