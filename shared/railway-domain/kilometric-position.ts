import { isUnsignedInteger } from "../value-validation";

const MILESTONE_LABEL = /^(\d+)\+(\d{3})$/;

export interface ParsedMilestoneLabel {
  readonly kilometer: string;
  readonly metric: string;
  readonly positionMeters: number;
}

export function isKilometricPosition(value: unknown): value is number {
  return isUnsignedInteger(value);
}

export function parseMilestoneLabel(
  value: string,
): ParsedMilestoneLabel | undefined {
  const match = MILESTONE_LABEL.exec(value);
  if (match === null) {
    return undefined;
  }

  const kilometer = match[1];
  const metric = match[2];
  return Object.freeze({
    kilometer,
    metric,
    positionMeters: Number(kilometer) * 1000 + Number(metric),
  });
}

export function isMilestoneLabelForPosition(
  label: unknown,
  positionMeters: unknown,
): boolean {
  if (typeof label !== "string" || !isKilometricPosition(positionMeters)) {
    return false;
  }

  return parseMilestoneLabel(label)?.positionMeters === positionMeters;
}
