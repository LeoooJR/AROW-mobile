import LineStep from "@/components/composites/map-toolbar/point-search-sheet/line-step";
import MilestoneStep from "@/components/composites/map-toolbar/point-search-sheet/milestone-step";
import SectionStep from "@/components/composites/map-toolbar/point-search-sheet/section-step";
import { Milestone } from "@/features/milestones/milestone";
import type {
  MilestoneResolution,
  MilestoneSearchLine,
  MilestoneSearchSection,
} from "@/features/milestones/milestone-search";

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  kilometer: 509,
  label: "509+000",
  lineCode: "893000",
  sectionRank: 1,
});

const section: MilestoneSearchSection = {
  maximumLabel: milestone.label,
  milestones: [milestone],
  minimumLabel: milestone.label,
  rank: milestone.sectionRank,
};

const line: MilestoneSearchLine = {
  code: milestone.lineCode,
  name: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
  sections: [section],
};

describe("point search steps", () => {
  test.each([
    [undefined, "À renseigner"],
    [line, "Validée"],
  ] as const)("presents the line step status", (selectedLine, status) => {
    const step = new LineStep(selectedLine);

    expect(step).toMatchObject({ number: 1, status, title: "Ligne" });
  });

  test.each([
    [undefined, undefined, "Ligne requise"],
    [line, undefined, "À choisir"],
    [line, section, "Section 1"],
  ] as const)(
    "presents the section step status",
    (selectedLine, selectedSection, status) => {
      const step = new SectionStep(selectedLine, selectedSection);

      expect(step).toMatchObject({ number: 2, status, title: "Section" });
    },
  );

  test.each([
    [undefined, { status: "incomplete" }, "Section requise"],
    [section, { status: "incomplete" }, "À renseigner"],
    [section, { message: "Invalid", status: "error" }, "À corriger"],
    [section, { milestone, status: "ready" }, "Point résolu"],
  ] satisfies readonly (readonly [
    MilestoneSearchSection | undefined,
    MilestoneResolution,
    string,
  ])[])(
    "presents the milestone step status",
    (selectedSection, resolution, status) => {
      const step = new MilestoneStep(selectedSection, resolution);

      expect(step).toMatchObject({
        number: 3,
        status,
        title: "Repère kilométrique",
      });
    },
  );
});
