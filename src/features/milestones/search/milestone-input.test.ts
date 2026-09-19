import { Railway } from "@/features/railways/railway";

import {
  parsePastedMilestone,
  validateMilestoneInput,
} from "./milestone-input";

function createSection() {
  return new Railway({
    code: "893000",
    name: "Ligne test",
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
  }).sections[0];
}

describe("milestone input", () => {
  test("parses pasted production PK values", () => {
    expect(parsePastedMilestone("PK 509+000")).toEqual({
      kilometer: "509",
      metric: "000",
    });
    expect(parsePastedMilestone("509+00")).toBeUndefined();
  });

  test("validates complete inputs against section bounds", () => {
    const section = createSection();
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
});
