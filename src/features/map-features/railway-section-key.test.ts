import { RailwaySectionKey } from "./railway-section-key";

describe("RailwaySectionKey", () => {
  test("normalizes numeric line codes and exposes the section identity", () => {
    const key = new RailwaySectionKey(1000, 2);

    expect(key.lineCode).toBe("001000");
    expect(key.sectionRank).toBe(2);
    expect(key.id).toBe("001000:2");
  });

  test("accepts an already canonical line code", () => {
    expect(new RailwaySectionKey("001000", 1).lineCode).toBe("001000");
  });

  test.each([-1, 1.5, 1_000_000, "1000", "ABC000"])(
    "rejects invalid railway line code %p",
    (lineCode) => {
      expect(() => new RailwaySectionKey(lineCode, 1)).toThrow();
    },
  );

  test.each([0, -1, 1.5])("rejects invalid section rank %p", (sectionRank) => {
    expect(() => new RailwaySectionKey("001000", sectionRank)).toThrow(
      "Railway section rank must be a positive integer",
    );
  });
});
