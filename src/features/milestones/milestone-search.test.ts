import { Milestone } from "@/features/milestones/milestone";

import {
  createMilestoneSearchState,
  isMilestoneLineQueryReady,
  parsePastedMilestone,
  resolveMilestone,
  searchMilestoneLines,
} from "./milestone-search";

function createMilestone(
  kilometer: number,
  lineCode = "893000",
  sectionRank = 1,
): Milestone {
  return new Milestone({
    coordinates: {
      latitude: 45.7 + kilometer / 100_000,
      longitude: 4.8,
    },
    kilometer,
    label: `${String(kilometer).padStart(3, "0")}+000`,
    lineCode,
    sectionRank,
  });
}

const catalog = [
  {
    lineCode: "893000",
    name: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
    sectionRank: 1,
  },
] as const;

describe("milestone search", () => {
  test.each([
    ["", false],
    [" ", false],
    ["l", false],
    ["ly", true],
    ["é", false],
    ["1", true],
  ] as const)("reports whether query %p can be searched", (query, ready) => {
    expect(isMilestoneLineQueryReady(query)).toBe(ready);
  });

  test("merges searchable sections with railway names and sorted milestones", () => {
    const state = createMilestoneSearchState(
      {
        milestones: [createMilestone(509), createMilestone(508)],
        status: "ready",
      },
      catalog,
    );

    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("Expected ready search state");
    }
    expect(state.lines[0]).toMatchObject({
      code: "893000",
      name: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
      sections: [{ maximumLabel: "509+000", minimumLabel: "508+000" }],
    });
  });

  test("keeps catalog-missing milestones searchable by canonical code", () => {
    const state = createMilestoneSearchState(
      {
        milestones: [createMilestone(1, "008000")],
        status: "ready",
      },
      catalog,
    );

    expect(state).toMatchObject({
      lines: [{ code: "008000", name: "Ligne 008000" }],
      status: "ready",
    });
  });

  test.each([
    [{ lineCode: "89300", name: "Invalid code", sectionRank: 1 }],
    [{ lineCode: "893000", name: "", sectionRank: 1 }],
    [{ lineCode: "893000", name: "Invalid section", sectionRank: 0 }],
  ])("rejects a malformed railway catalog entry", (entry) => {
    expect(() =>
      createMilestoneSearchState(
        { milestones: [createMilestone(509)], status: "ready" },
        [entry],
      ),
    ).toThrow("Invalid railway search catalog");
  });

  test("searches accent-insensitive names and code prefixes with a result cap", () => {
    const lines = Array.from({ length: 25 }, (_, index) => ({
      code: `893${String(index).padStart(3, "0")}`,
      name: `Ligne de Lyon numéro ${index}`,
      sections: [],
    }));

    expect(searchMilestoneLines(lines, "l")).toEqual([]);
    expect(searchMilestoneLines(lines, "LYON")).toHaveLength(20);
    expect(searchMilestoneLines(lines, "8930", 3)).toHaveLength(3);
  });

  test("parses pasted production PK values", () => {
    expect(parsePastedMilestone("PK 509+000")).toEqual({
      kilometer: "509",
      metric: "000",
    });
    expect(parsePastedMilestone("509+00")).toBeUndefined();
  });

  test("resolves only exact milestones and reports range and availability errors", () => {
    const milestones = [createMilestone(508), createMilestone(509)];
    const section = {
      maximumLabel: "509+000",
      milestones,
      minimumLabel: "508+000",
      rank: 1,
    };

    expect(resolveMilestone(section, "509", "000")).toEqual({
      milestone: milestones[1],
      status: "ready",
    });
    expect(resolveMilestone(section, "507", "000")).toMatchObject({
      status: "error",
    });
    expect(resolveMilestone(section, "508", "500")).toEqual({
      message: "Le repère 508+500 n’est pas disponible dans cette section.",
      status: "error",
    });
    expect(resolveMilestone(section, "509", "00")).toEqual({
      status: "incomplete",
    });
  });

  test("preserves non-ready database states", () => {
    expect(createMilestoneSearchState({ status: "loading" }, catalog)).toEqual({
      status: "loading",
    });
    expect(createMilestoneSearchState({ status: "error" }, catalog)).toEqual({
      status: "error",
    });
  });
});
