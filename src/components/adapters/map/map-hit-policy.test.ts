import { milestoneDotLayerId, milestoneHitRadius } from "./map-hit-policy";

test.each([
  [9.999, undefined],
  [10, 7],
  [10.001, 7],
  [11.999, 7],
  [12, 11],
  [12.001, 11],
  [13.999, 11],
  [14, 8],
  [14.001, 8],
  [14.999, 8],
  [15, 6],
  [15.001, 6],
  [20, 6],
  [NaN, undefined],
  [Infinity, undefined],
  [-Infinity, undefined],
])("normal marker radius at zoom %s is %s dp", (zoom, radius) => {
  expect(milestoneHitRadius(zoom, false)).toBe(radius);
  expect(milestoneHitRadius(zoom, true)).toBe(
    radius === undefined ? undefined : radius + 4,
  );
});

test("preserves the stable dot anchor and identifies each other band", () => {
  expect(milestoneDotLayerId(1000)).toBe("railway-milestone-dots");
  expect(milestoneDotLayerId(1)).toBe("railway-milestone-dots-1");
});
