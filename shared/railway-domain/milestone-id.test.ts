import { MilestoneId } from "./milestone-id";
import { RailwaySectionId } from "./railway-section-id";

test("reuses its section ID and exposes canonical milestone identity", () => {
  const sectionId = new RailwaySectionId(1000, 2);
  const id = new MilestoneId(sectionId, 241_000);
  expect(id.sectionId).toBe(sectionId);
  expect(id.lineCode).toBe("001000");
  expect(id.sectionRank).toBe(2);
  expect(id.positionMeters).toBe(241_000);
  expect(id.value).toBe("001000:2:241000");
  const equivalent = new MilestoneId(
    new RailwaySectionId("001000", 2),
    241_000,
  );
  expect(equivalent).not.toBe(id);
  expect(equivalent.value).toBe(id.value);
});

test("accepts position zero", () => {
  expect(new MilestoneId(new RailwaySectionId(0, 1), 0).value).toBe(
    "000000:1:0",
  );
});

test.each([-1, 1.5, NaN, Infinity, -Infinity])(
  "rejects invalid position %p",
  (position) => {
    expect(
      () => new MilestoneId(new RailwaySectionId(1000, 2), position),
    ).toThrow("Milestone position must be a non-negative metre value");
  },
);

test("ID accessors cannot be reassigned", () => {
  const sectionId = new RailwaySectionId(1000, 2);
  const id = new MilestoneId(sectionId, 241_000);
  expect(Reflect.set(sectionId, "lineCode", "893000")).toBe(false);
  expect(Reflect.set(sectionId, "sectionRank", 3)).toBe(false);
  expect(Reflect.set(sectionId, "value", "893000:3")).toBe(false);
  expect(Reflect.set(id, "sectionId", new RailwaySectionId(893000, 3))).toBe(
    false,
  );
  expect(Reflect.set(id, "positionMeters", 0)).toBe(false);
  expect(Reflect.set(id, "value", "893000:3:0")).toBe(false);
  expect(id.value).toBe("001000:2:241000");
});
