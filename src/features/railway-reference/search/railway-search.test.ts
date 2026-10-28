import { Railway } from "@shared/railway-domain/railway";

import { isRailwayQueryReady, searchRailways } from "./railway-search";

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
    expect(isRailwayQueryReady(query)).toBe(ready);
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

  test.each(["lyon", "  LYÓN  ", "lyo\u0301n"])(
    "preserves stable name ties and original objects for query %p",
    (query) => {
      const first = createRailway("003000", "Lyon à Grenoble");
      const substring = createRailway("002000", "Grande ligne de Lyon");
      const tied = createRailway("001000", "Lyon à Grenoble");
      const railways = Object.freeze([first, substring, tied]);

      const matches = searchRailways(railways, query);

      expect(matches).toEqual([first, tied, substring]);
      expect(matches[0]).toBe(first);
      expect(matches[1]).toBe(tied);
      expect(railways).toEqual([first, substring, tied]);
    },
  );

  test("keeps code ordering independent of names and respects zero results", () => {
    const first = createRailway("003000", "Lyon");
    const second = createRailway("001000", "Paris");
    const railways = Object.freeze([first, second]);

    expect(searchRailways(railways, "00")).toEqual([second, first]);
    expect(searchRailways(railways, "00", 0)).toEqual([]);
    expect(searchRailways(railways, "lyon", 0)).toEqual([]);
    expect(searchRailways(railways, "Marseille")).toEqual([]);
    expect(railways).toEqual([first, second]);
  });
});
