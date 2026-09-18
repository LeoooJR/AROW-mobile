import { Railway } from "@/features/railways/railway";

import { isMilestoneLineQueryReady, searchRailways } from "./railway-search";

function createRailway(code: string, name: string): Railway {
  return new Railway({
    code,
    name,
    sections: [
      {
        geometry: { status: "absent" },
        milestoneRange: {
          maximumLabel: "509+000",
          maximumPositionMeters: 509_000,
          minimumLabel: "508+000",
          minimumPositionMeters: 508_000,
        },
        sectionRank: 1,
      },
    ],
  });
}

describe("railway search", () => {
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

  test("searches accent-insensitive names and code prefixes with a result cap", () => {
    const railways = Array.from({ length: 25 }, (_, index) =>
      createRailway(
        `893${String(index).padStart(3, "0")}`,
        `Ligne de Lyón numéro ${index}`,
      ),
    );

    expect(searchRailways(railways, "l")).toEqual([]);
    expect(searchRailways(railways, "LYON")).toHaveLength(20);
    expect(searchRailways(railways, "8930", 3)).toHaveLength(3);
  });

  test("ranks name prefixes before substrings", () => {
    const railways = [
      createRailway("001000", "Grande ligne de Lyon"),
      createRailway("002000", "Lyon à Grenoble"),
    ];

    expect(searchRailways(railways, "lyon").map((line) => line.code)).toEqual([
      "002000",
      "001000",
    ]);
  });
});
