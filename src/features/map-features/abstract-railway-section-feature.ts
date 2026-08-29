import { AbstractMapFeature } from "./abstract-map-feature";
import { RailwaySectionKey } from "./railway-section-key";

export abstract class AbstractRailwaySectionFeature<
  TKind extends string,
> extends AbstractMapFeature<TKind> {
  readonly #key: RailwaySectionKey;

  protected constructor(lineCode: string | number, sectionRank: number) {
    super();
    this.#key = new RailwaySectionKey(lineCode, sectionRank);
  }

  public get key(): RailwaySectionKey {
    return this.#key;
  }

  public get lineCode(): string {
    return this.#key.lineCode;
  }

  public get sectionRank(): number {
    return this.#key.sectionRank;
  }
}
