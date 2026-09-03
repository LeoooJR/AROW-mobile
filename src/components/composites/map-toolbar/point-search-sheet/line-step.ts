import Step from "@/components/composites/map-toolbar/point-search-sheet/step";
import type { MilestoneSearchLine } from "@/features/milestones/milestone-search";

export default class LineStep extends Step {
  readonly #selectedLine: MilestoneSearchLine | undefined;

  public constructor(selectedLine: MilestoneSearchLine | undefined) {
    super(1, "Ligne");
    this.#selectedLine = selectedLine;
  }

  public get status(): string {
    return this.#selectedLine === undefined ? "À renseigner" : "Validée";
  }
}
