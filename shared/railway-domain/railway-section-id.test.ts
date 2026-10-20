import { isRailwaySectionRank, RailwaySectionId } from "./railway-section-id";

test("builds canonical section identity", () => {
  const id = new RailwaySectionId(1000, 2);
  expect(id.lineCode).toBe("001000");
  expect(id.sectionRank).toBe(2);
  expect(id.value).toBe("001000:2");
  const equivalent = new RailwaySectionId("001000", 2);
  expect(equivalent).not.toBe(id);
  expect(equivalent.value).toBe(id.value);
});

test.each([0, -1, 1.5, NaN, Infinity])(
  "rejects invalid section rank %p",
  (rank) => {
    expect(isRailwaySectionRank(rank)).toBe(false);
    expect(() => new RailwaySectionId("001000", rank)).toThrow(
      "Railway section rank must be a positive integer",
    );
  },
);

test("accepts positive integer ranks", () => {
  expect(isRailwaySectionRank(1)).toBe(true);
});

test("rejects noncanonical string line codes", () => {
  expect(() => new RailwaySectionId("1000", 1)).toThrow();
});
