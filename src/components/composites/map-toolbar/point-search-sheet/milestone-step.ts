import Step from "@/components/composites/map-toolbar/point-search-sheet/step";
import type { MilestoneResolution } from "@/features/milestones/milestone-search";
import type { RailwaySection } from "@/features/railways/railway-section";

const STATUS_BY_RESOLUTION = {
  error: "À corriger",
  incomplete: "À renseigner",
  loading: "Recherche…",
  ready: "Point résolu",
} satisfies Readonly<Record<MilestoneResolution["status"], string>>;

export default class MilestoneStep extends Step {
  readonly #resolution: MilestoneResolution;
  readonly #selectedSection: RailwaySection | undefined;

  public constructor(
    selectedSection: RailwaySection | undefined,
    resolution: MilestoneResolution,
  ) {
    super(3, "Repère kilométrique");
    this.#selectedSection = selectedSection;
    this.#resolution = resolution;
  }

  public get status(): string {
    if (this.#selectedSection === undefined) {
      return "Section requise";
    }

    return STATUS_BY_RESOLUTION[this.#resolution.status];
  }
}
