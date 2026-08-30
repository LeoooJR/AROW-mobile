export abstract class AbstractMapFeature<TKind extends string> {
  public abstract readonly kind: TKind;

  public abstract get id(): string;
}
