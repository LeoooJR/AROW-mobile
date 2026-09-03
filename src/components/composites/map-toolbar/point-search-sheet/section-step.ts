import Step from "@/components/composites/map-toolbar/point-search-sheet/step";
import type {
  MilestoneSearchLine,
  MilestoneSearchSection,
} from "@/features/milestones/milestone-search";

export default class SectionStep extends Step {
  readonly #selectedLine: MilestoneSearchLine | undefined;
  readonly #selectedSection: MilestoneSearchSection | undefined;

  public constructor(
    selectedLine: MilestoneSearchLine | undefined,
    selectedSection: MilestoneSearchSection | undefined,
  ) {
    super(2, "Section");
    this.#selectedLine = selectedLine;
    this.#selectedSection = selectedSection;
  }

  public get status(): string {
    if (this.#selectedLine === undefined) {
      return "Ligne requise";
    }

    if (this.#selectedSection === undefined) {
      return "À choisir";
    }

    return `Section ${this.#selectedSection.rank}`;
  }
}
