import type { RailwaySectionId } from "./railway-section-id";
import type { MilestoneId } from "./milestone-id";

export abstract class AbstractRailwayNetworkFeature<
  TKind extends string,
  TId extends RailwaySectionId | MilestoneId,
> {
  public abstract readonly kind: TKind;

  readonly #id: TId;

  protected constructor(id: TId) {
    this.#id = id;
  }

  public get id(): TId {
    return this.#id;
  }

  public get lineCode(): string {
    return this.#id.lineCode;
  }

  public get sectionRank(): number {
    return this.#id.sectionRank;
  }
}
