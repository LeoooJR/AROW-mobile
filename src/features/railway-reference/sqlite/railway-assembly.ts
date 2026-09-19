import type { SearchableRailwaySectionRow } from "@/features/railway-reference/sqlite/searchable-section-row";
import { Railway } from "@/features/railways/railway";
import type { RailwaySectionInput } from "@/features/railways/railway-section";

class RailwayRowGroup {
  readonly #name: string;
  readonly #sections: RailwaySectionInput[] = [];

  public constructor(name: string) {
    this.#name = name;
  }

  public add(row: SearchableRailwaySectionRow): void {
    if (row.lineName !== this.#name) {
      throw new Error(`Conflicting names for railway line ${row.lineCode}`);
    }
    this.#sections.push(row.toRailwaySectionInput());
  }

  public toRailway(code: string): Railway {
    return new Railway({ code, name: this.#name, sections: this.#sections });
  }
}

export function searchableSectionRowsToRailways(
  rows: readonly SearchableRailwaySectionRow[],
): readonly Railway[] {
  const groups = new Map<string, RailwayRowGroup>();
  rows.forEach((row) => {
    const group = groups.get(row.lineCode) ?? new RailwayRowGroup(row.lineName);
    group.add(row);
    groups.set(row.lineCode, group);
  });

  return [...groups.entries()]
    .map(([code, group]) => group.toRailway(code))
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));
}
