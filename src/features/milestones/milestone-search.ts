import type { Milestone } from "@/features/milestones/milestone";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

export type MilestoneSearchState =
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | { readonly status: "error" }
  | {
      readonly railways: readonly Railway[];
      readonly status: "ready";
    };

export interface MilestoneLookupInput {
  readonly lineCode: string;
  readonly positionMeters: number;
  readonly sectionRank: number;
}

export interface MilestoneSearchModel {
  readonly findMilestone: (
    input: MilestoneLookupInput,
  ) => Promise<Milestone | undefined>;
  readonly state: MilestoneSearchState;
}

export type MilestoneResolution =
  | { readonly status: "incomplete" }
  | { readonly status: "loading" }
  | { readonly message: string; readonly status: "error" }
  | { readonly milestone: Milestone; readonly status: "ready" };

export type MilestoneInputResolution =
  | { readonly status: "incomplete" }
  | { readonly message: string; readonly status: "error" }
  | { readonly positionMeters: number; readonly status: "ready" };

function normalizeSearchQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function isCodeQuery(query: string): boolean {
  return /^\d+$/.test(query);
}

export function isMilestoneLineQueryReady(query: string): boolean {
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length === 0) {
    return false;
  }

  return isCodeQuery(normalizedQuery) || normalizedQuery.length >= 2;
}

function lineMatchesQuery(
  railway: Railway,
  normalizedQuery: string,
  codeQuery: boolean,
): boolean {
  if (codeQuery) {
    return railway.code.startsWith(normalizedQuery);
  }

  return normalizeSearchQuery(railway.name).includes(normalizedQuery);
}

function compareLineSearchResults(
  left: Railway,
  right: Railway,
  normalizedQuery: string,
  codeQuery: boolean,
): number {
  if (codeQuery) {
    return left.code.localeCompare(right.code);
  }

  const leftStarts = normalizeSearchQuery(left.name).startsWith(
    normalizedQuery,
  );
  const rightStarts = normalizeSearchQuery(right.name).startsWith(
    normalizedQuery,
  );
  if (leftStarts === rightStarts) {
    return left.name.localeCompare(right.name, "fr");
  }

  return leftStarts ? -1 : 1;
}

export function searchRailways(
  railways: readonly Railway[],
  query: string,
  limit = 20,
): readonly Railway[] {
  if (!isMilestoneLineQueryReady(query)) {
    return [];
  }

  const normalizedQuery = normalizeSearchQuery(query);
  const codeQuery = isCodeQuery(normalizedQuery);
  return railways
    .filter((railway) => lineMatchesQuery(railway, normalizedQuery, codeQuery))
    .sort((left, right) =>
      compareLineSearchResults(left, right, normalizedQuery, codeQuery),
    )
    .slice(0, limit);
}

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
  const match = /^(?:PK\s*)?(\d+)\+(\d{3})$/i.exec(value.trim());
  if (match === null) {
    return undefined;
  }

  return { kilometer: match[1], metric: match[2] };
}

function milestoneInputMeters(
  kilometerInput: string,
  metricInput: string,
): number {
  return Number(kilometerInput) * 1000 + Number(metricInput);
}

function outOfRangeResolution(
  section: RailwaySection,
): MilestoneInputResolution {
  const range = section.milestoneRange;
  if (range === undefined) {
    return { status: "incomplete" };
  }
  return {
    message: `Repère hors section. Saisissez une valeur entre ${range.minimumLabel} et ${range.maximumLabel}.`,
    status: "error",
  };
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

  const positionMeters = milestoneInputMeters(kilometerInput, metricInput);
  if (
    positionMeters < range.minimumPositionMeters ||
    positionMeters > range.maximumPositionMeters
  ) {
    return outOfRangeResolution(section);
  }

  return { positionMeters, status: "ready" };
}

export function unavailableMilestoneResolution(
  kilometerInput: string,
  metricInput: string,
): MilestoneResolution {
  return {
    message: `Le repère ${kilometerInput}+${metricInput} n’est pas disponible dans cette section.`,
    status: "error",
  };
}

export function milestoneLookupErrorResolution(): MilestoneResolution {
  return {
    message: "La recherche de ce repère est momentanément indisponible.",
    status: "error",
  };
}
