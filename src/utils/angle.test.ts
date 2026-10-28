import { normalizeDegrees, normalizeLongitude } from "./angle";

test.each([
  [0, 0],
  [-0, 0],
  [360, 0],
  [-360, 0],
  [720, 0],
  [-30, 330],
  [390, 30],
  [12.5, 12.5],
  [-12.5, 347.5],
] as const)("normalizes %s degrees to %s", (degrees, expected) => {
  expect(normalizeDegrees(degrees)).toBe(expected);
});

test.each([NaN, Infinity, -Infinity])(
  "preserves NaN output for nonfinite input %s",
  (degrees) => {
    expect(normalizeDegrees(degrees)).toBeNaN();
  },
);

test.each([
  [-180, -180],
  [180, 180],
  [4.85933, 4.85933],
  [181, -179],
  [-181, 179],
  [540, -180],
  [-540, -180],
])("normalizes longitude %s to %s", (longitude, expected) => {
  expect(normalizeLongitude(longitude)).toBe(expected);
});
