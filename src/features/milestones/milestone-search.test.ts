import { Railway } from "@/features/railways/railway";

import {
  isMilestoneLineQueryReady,
  parsePastedMilestone,
  searchRailways,
  validateMilestoneInput,
} from "./milestone-search";
import { unavailableMilestoneResolution } from "./milestone-search-messages";

function createRailway(
  code: string,
  name: string,
  minimumPositionMeters = 508_000,
  maximumPositionMeters = 509_000,
): Railway {
  return new Railway({
    code,
    name,
    sections: [
      {
        geometry: { status: "absent" },
        milestoneRange: {
          maximumLabel: "509+000",
          maximumPositionMeters,
          minimumLabel: "508+000",
          minimumPositionMeters,
        },
        sectionRank: 1,
      },
    ],
  });
}

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

  test("parses pasted production PK values", () => {
    expect(parsePastedMilestone("PK 509+000")).toEqual({
      kilometer: "509",
      metric: "000",
    });
    expect(parsePastedMilestone("509+00")).toBeUndefined();
  });

  test("validates complete inputs against section bounds", () => {
    const section = createRailway("893000", "Ligne test").sections[0];
    expect(section).toBeDefined();
    expect(validateMilestoneInput(section, "509", "000")).toEqual({
      positionMeters: 509_000,
      status: "ready",
    });
    expect(validateMilestoneInput(section, "507", "000")).toMatchObject({
      status: "error",
    });
    expect(validateMilestoneInput(section, "508", "500")).toEqual({
      positionMeters: 508_500,
      status: "ready",
    });
    expect(validateMilestoneInput(section, "509", "00")).toEqual({
      status: "incomplete",
    });
  });

  test("does not resolve sections without milestone availability", () => {
    const section = new Railway({
      code: "008000",
      name: "Ligne 008000",
      sections: [{ geometry: { status: "absent" }, sectionRank: 1 }],
    }).sections[0];

    expect(validateMilestoneInput(section, "1", "000")).toEqual({
      status: "incomplete",
    });
  });

  test("formats the exact-point unavailable error", () => {
    expect(unavailableMilestoneResolution("508", "500")).toEqual({
      message: "Le repère 508+500 n’est pas disponible dans cette section.",
      status: "error",
    });
  });
});
