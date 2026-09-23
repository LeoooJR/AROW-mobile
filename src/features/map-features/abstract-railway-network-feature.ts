import { RailwaySectionKey } from "@shared/railway-reference/values";

export abstract class AbstractRailwayNetworkFeature<TKind extends string> {
  public abstract readonly kind: TKind;

  readonly #key: RailwaySectionKey;

  protected constructor(lineCode: string | number, sectionRank: number) {
    this.#key = new RailwaySectionKey(lineCode, sectionRank);
  }

  public abstract get id(): string;

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
