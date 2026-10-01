import type { Railway } from "@/features/railways/railway";
import { normalizeSearchText } from "@/utils/search-text";

function isCodeQuery(query: string): boolean {
  return /^\d+$/.test(query);
}

export function isMilestoneLineQueryReady(query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
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

  return normalizeSearchText(railway.name).includes(normalizedQuery);
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

  const leftStarts = normalizeSearchText(left.name).startsWith(normalizedQuery);
  const rightStarts = normalizeSearchText(right.name).startsWith(
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

  const normalizedQuery = normalizeSearchText(query);
  const codeQuery = isCodeQuery(normalizedQuery);
  return railways
    .filter((railway) => lineMatchesQuery(railway, normalizedQuery, codeQuery))
    .sort((left, right) =>
      compareLineSearchResults(left, right, normalizedQuery, codeQuery),
    )
    .slice(0, limit);
}
