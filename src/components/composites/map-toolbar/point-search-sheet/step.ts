export default abstract class Step {
  protected constructor(
    public readonly number: number,
    public readonly title: string,
  ) {}

  public abstract get status(): string;
}
