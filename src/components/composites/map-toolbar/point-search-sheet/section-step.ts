import Step from "@/components/composites/map-toolbar/point-search-sheet/step";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

export default class SectionStep extends Step {
  readonly #selectedLine: Railway | undefined;
  readonly #selectedSection: RailwaySection | undefined;

  public constructor(
    selectedLine: Railway | undefined,
    selectedSection: RailwaySection | undefined,
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

    return `Section ${this.#selectedSection.sectionRank}`;
  }
}
