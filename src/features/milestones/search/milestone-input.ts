import { outOfRangeMilestoneResolution } from "@/features/milestones/search/resolution-messages";
import type { RailwaySection } from "@/features/railways/railway-section";
import { parseMilestoneLabel } from "@shared/railway-reference/values";

import type { MilestoneInputResolution } from "./contracts";

export function sanitizeMilestonePart(
  value: string,
  maximumLength?: number,
): string {
  const digits = value.replace(/\D/g, "");
  if (maximumLength === undefined) {
    return digits;
  }

  return digits.slice(0, maximumLength);
}

export function parsePastedMilestone(
  value: string,
): { readonly kilometer: string; readonly metric: string } | undefined {
  const normalized = value.trim().replace(/^PK\s*/i, "");
  const parsed = parseMilestoneLabel(normalized);
  if (parsed === undefined) {
    return undefined;
  }

  return { kilometer: parsed.kilometer, metric: parsed.metric };
}

export function validateMilestoneInput(
  section: RailwaySection | undefined,
  kilometerInput: string,
  metricInput: string,
): MilestoneInputResolution {
  if (
    section === undefined ||
    !/^\d+$/.test(kilometerInput) ||
    !/^\d{3}$/.test(metricInput)
  ) {
    return { status: "incomplete" };
  }

  const range = section.milestoneRange;
  if (range === undefined) {
    return { status: "incomplete" };
  }

  const parsed = parseMilestoneLabel(`${kilometerInput}+${metricInput}`);
  if (parsed === undefined) {
    return { status: "incomplete" };
  }
  const positionMeters = parsed.positionMeters;
  if (
    positionMeters < range.minimumPositionMeters ||
    positionMeters > range.maximumPositionMeters
  ) {
    return outOfRangeMilestoneResolution(range);
  }

  return { positionMeters, status: "ready" };
}
