import {
  milestoneVisibilityClassForPosition,
  isMilestoneVisibilityClass,
} from "./milestone-visibility-class";

test.each([
  [0, 0],
  [1, 3],
  [99, 3],
  [100, 2],
  [499, 3],
  [500, 1],
  [501, 3],
  [900, 2],
  [999, 3],
  [1000, 0],
  [1500, 1],
  [136772, 3],
] as const)("assigns visibility class %i → %i", (position, expected) => {
  expect(milestoneVisibilityClassForPosition(position)).toBe(expected);
});

test.each([undefined, null, -1, 4, 1.5, "0", NaN, Infinity])(
  "rejects invalid class %p",
  (value) => expect(isMilestoneVisibilityClass(value)).toBe(false),
);
