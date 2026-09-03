import {
  isCanonicalRailwayLineCode,
  RailwaySectionKey,
} from "@/features/map-features/railway-section-key";
import type { Milestone } from "@/features/milestones/milestone";
import type { MilestoneLoadState } from "@/features/milestones/milestones";
import {
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
} from "@/types/value-validation";

export interface RailwaySearchCatalogEntry {
  readonly lineCode: string;
  readonly name: string;
  readonly sectionRank: number;
}

export interface MilestoneSearchSection {
  readonly maximumLabel: string;
  readonly milestones: readonly Milestone[];
  readonly minimumLabel: string;
  readonly rank: number;
}

export interface MilestoneSearchLine {
  readonly code: string;
  readonly name: string;
  readonly sections: readonly MilestoneSearchSection[];
}

export type MilestoneSearchState =
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | { readonly status: "error" }
  | {
      readonly lines: readonly MilestoneSearchLine[];
      readonly status: "ready";
    };

export type MilestoneResolution =
  | { readonly status: "incomplete" }
  | { readonly message: string; readonly status: "error" }
  | { readonly milestone: Milestone; readonly status: "ready" };

interface MutableMilestoneSearchLine {
  readonly name: string;
  readonly sections: MilestoneSearchSection[];
}

function isCatalogEntry(value: unknown): value is RailwaySearchCatalogEntry {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCanonicalRailwayLineCode(value.lineCode) &&
    isNonEmptyString(value.name) &&
    isPositiveInteger(value.sectionRank)
  );
}

function parseCatalog(value: unknown): readonly RailwaySearchCatalogEntry[] {
  if (!Array.isArray(value) || !value.every(isCatalogEntry)) {
    throw new Error("Invalid railway search catalog");
  }

  return value;
}

function normalizeSearchQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
}

function milestoneMeters(milestone: Milestone): number {
  const match = /^(\d+)\+(\d{3})$/.exec(milestone.label);
  if (match === null) {
    return milestone.kilometer * 1000;
  }

  return Number(match[1]) * 1000 + Number(match[2]);
}

function catalogSectionId(entry: RailwaySearchCatalogEntry): string {
  return new RailwaySectionKey(entry.lineCode, entry.sectionRank).id;
}

function indexCatalogBySection(
  catalog: readonly RailwaySearchCatalogEntry[],
): ReadonlyMap<string, RailwaySearchCatalogEntry> {
  return new Map(catalog.map((entry) => [catalogSectionId(entry), entry]));
}

function groupMilestonesBySection(
  milestones: readonly Milestone[],
): ReadonlyMap<string, readonly Milestone[]> {
  const grouped = new Map<string, Milestone[]>();

  for (const milestone of milestones) {
    const section = grouped.get(milestone.key.id) ?? [];
    section.push(milestone);
    grouped.set(milestone.key.id, section);
  }

  return grouped;
}

function createSearchSection(
  unsortedMilestones: readonly Milestone[],
): MilestoneSearchSection | undefined {
  const milestones = [...unsortedMilestones].sort(
    (left, right) => milestoneMeters(left) - milestoneMeters(right),
  );
  const first = milestones[0];
  const last = milestones.at(-1);
  if (first === undefined || last === undefined) {
    return undefined;
  }

  return {
    maximumLabel: last.label,
    milestones,
    minimumLabel: first.label,
    rank: first.sectionRank,
  };
}

function addSectionToLine(
  lines: Map<string, MutableMilestoneSearchLine>,
  catalogBySection: ReadonlyMap<string, RailwaySearchCatalogEntry>,
  sectionId: string,
  section: MilestoneSearchSection,
): void {
  const firstMilestone = section.milestones[0];
  if (firstMilestone === undefined) {
    return;
  }

  const metadata = catalogBySection.get(sectionId);
  const line = lines.get(firstMilestone.lineCode) ?? {
    name: metadata?.name ?? `Ligne ${firstMilestone.lineCode}`,
    sections: [],
  };
  line.sections.push(section);
  lines.set(firstMilestone.lineCode, line);
}

function createSearchLines(
  milestones: readonly Milestone[],
  catalog: readonly RailwaySearchCatalogEntry[],
): readonly MilestoneSearchLine[] {
  const catalogBySection = indexCatalogBySection(catalog);
  const milestonesBySection = groupMilestonesBySection(milestones);
  const lines = new Map<string, MutableMilestoneSearchLine>();

  for (const [sectionId, sectionMilestones] of milestonesBySection) {
    const section = createSearchSection(sectionMilestones);
    if (section !== undefined) {
      addSectionToLine(lines, catalogBySection, sectionId, section);
    }
  }

  return [...lines.entries()]
    .map(([code, line]) => ({
      code,
      name: line.name,
      sections: line.sections.sort((left, right) => left.rank - right.rank),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));
}

export function createMilestoneSearchState(
  loadState: MilestoneLoadState,
  catalogValue: unknown,
): MilestoneSearchState {
  if (loadState.status !== "ready") {
    return loadState;
  }

  return {
    lines: createSearchLines(loadState.milestones, parseCatalog(catalogValue)),
    status: "ready",
  };
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
  line: MilestoneSearchLine,
  normalizedQuery: string,
  codeQuery: boolean,
): boolean {
  if (codeQuery) {
    return line.code.startsWith(normalizedQuery);
  }

  return normalizeSearchQuery(line.name).includes(normalizedQuery);
}

function compareLineSearchResults(
  left: MilestoneSearchLine,
  right: MilestoneSearchLine,
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

export function searchMilestoneLines(
  lines: readonly MilestoneSearchLine[],
  query: string,
  limit = 20,
): readonly MilestoneSearchLine[] {
  if (!isMilestoneLineQueryReady(query)) {
    return [];
  }

  const normalizedQuery = normalizeSearchQuery(query);
  const codeQuery = isCodeQuery(normalizedQuery);
  return lines
    .filter((line) => lineMatchesQuery(line, normalizedQuery, codeQuery))
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

function emptySectionResolution(): MilestoneResolution {
  return {
    message: "Aucun repère disponible dans cette section.",
    status: "error",
  };
}

function outOfRangeResolution(
  section: MilestoneSearchSection,
): MilestoneResolution {
  return {
    message: `Repère hors section. Saisissez une valeur entre ${section.minimumLabel} et ${section.maximumLabel}.`,
    status: "error",
  };
}

function unavailableMilestoneResolution(
  kilometerInput: string,
  metricInput: string,
): MilestoneResolution {
  return {
    message: `Le repère ${kilometerInput}+${metricInput} n’est pas disponible dans cette section.`,
    status: "error",
  };
}

export function resolveMilestone(
  section: MilestoneSearchSection | undefined,
  kilometerInput: string,
  metricInput: string,
): MilestoneResolution {
  if (
    section === undefined ||
    kilometerInput.length === 0 ||
    metricInput.length < 3
  ) {
    return { status: "incomplete" };
  }

  const minimum = section.milestones[0];
  const maximum = section.milestones.at(-1);
  if (minimum === undefined || maximum === undefined) {
    return emptySectionResolution();
  }

  const meters = milestoneInputMeters(kilometerInput, metricInput);
  if (meters < milestoneMeters(minimum) || meters > milestoneMeters(maximum)) {
    return outOfRangeResolution(section);
  }

  const milestone = section.milestones.find(
    (candidate) => milestoneMeters(candidate) === meters,
  );
  if (milestone === undefined) {
    return unavailableMilestoneResolution(kilometerInput, metricInput);
  }

  return { milestone, status: "ready" };
}
