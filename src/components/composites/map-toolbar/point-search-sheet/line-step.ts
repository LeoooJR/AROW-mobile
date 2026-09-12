import Step from "@/components/composites/map-toolbar/point-search-sheet/step";
import type { Railway } from "@/features/railways/railway";

export default class LineStep extends Step {
  readonly #selectedLine: Railway | undefined;

  public constructor(selectedLine: Railway | undefined) {
    super(1, "Ligne");
    this.#selectedLine = selectedLine;
  }

  public get status(): string {
    return this.#selectedLine === undefined ? "À renseigner" : "Validée";
  }
}
