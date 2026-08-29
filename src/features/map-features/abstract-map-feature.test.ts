import { AbstractMapFeature } from "./abstract-map-feature";

class TestAreaFeature extends AbstractMapFeature<"area"> {
  public readonly kind = "area";

  public get id(): string {
    return "area:test";
  }
}

describe("AbstractMapFeature", () => {
  test("supports a non-railway map feature with only generic identity", () => {
    const feature = new TestAreaFeature();

    expect(feature.id).toBe("area:test");
    expect(feature.kind).toBe("area");
    expect("lineCode" in feature).toBe(false);
    expect("sectionRank" in feature).toBe(false);
  });
});
