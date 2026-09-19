import type { Railway } from "@/features/railways/railway";

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
