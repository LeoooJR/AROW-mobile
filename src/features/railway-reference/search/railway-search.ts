import type { Railway } from "@shared/railway-domain/railway";
import { normalizeSearchText } from "@/utils/search-text";

function isCodeQuery(query: string): boolean {
  return /^\d+$/.test(query);
}

function isNormalizedQueryReady(query: string): boolean {
  return query.length > 0 && (isCodeQuery(query) || query.length >= 2);
}

export function isRailwayQueryReady(query: string): boolean {
  return isNormalizedQueryReady(normalizeSearchText(query));
}

interface RailwayNameMatch {
  readonly railway: Railway;
  readonly startsWithQuery: boolean;
}

function compareNameMatches(
  left: RailwayNameMatch,
  right: RailwayNameMatch,
): number {
  if (left.startsWithQuery === right.startsWithQuery) {
    return left.railway.name.localeCompare(right.railway.name, "fr");
  }
  return left.startsWithQuery ? -1 : 1;
}

function findNameMatches(
  railways: readonly Railway[],
  normalizedQuery: string,
): RailwayNameMatch[] {
  const matches: RailwayNameMatch[] = [];
  for (const railway of railways) {
    const normalizedName = normalizeSearchText(railway.name);
    if (normalizedName.includes(normalizedQuery)) {
      matches.push({
        railway,
        startsWithQuery: normalizedName.startsWith(normalizedQuery),
      });
    }
  }
  return matches;
}

export function searchRailways(
  railways: readonly Railway[],
  query: string,
  limit = 20,
): readonly Railway[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!isNormalizedQueryReady(normalizedQuery)) {
    return [];
  }

  if (isCodeQuery(normalizedQuery)) {
    return railways
      .filter((railway) => railway.code.startsWith(normalizedQuery))
      .sort((left, right) => left.code.localeCompare(right.code))
      .slice(0, limit);
  }

  return findNameMatches(railways, normalizedQuery)
    .sort(compareNameMatches)
    .slice(0, limit)
    .map(({ railway }) => railway);
}
