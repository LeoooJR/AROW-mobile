import type { MapViewport } from "@/types/map-viewport";
import { hasValidViewportBounds, normalizedViewportBounds } from "./viewport";

test.each<readonly [MapViewport["bounds"], boolean]>([
  [[4, 45, 5, 46], true],
  [[179, -1, -179, 1], true],
  [[-540, -90, 540, 90], true],
  [[4, 45, 4, 45], true],
  [[4, 46, 5, 45], false],
  [[4, -91, 5, 45], false],
  [[4, 45, 5, 91], false],
  [[NaN, 45, 5, 46], false],
  [[4, -Infinity, 5, 46], false],
  [[4, 45, Infinity, 46], false],
  [[4, 45, 5, NaN], false],
])("validates viewport bounds %j as %s", (bounds, expected) => {
  expect(hasValidViewportBounds(bounds)).toBe(expected);
  if (!expected) expect(normalizedViewportBounds(bounds)).toBeUndefined();
});

test.each<readonly [MapViewport["bounds"], MapViewport["bounds"]]>([
  [
    [4.85933, 45, 5, 46],
    [4.85933, 45, 5, 46],
  ],
  [
    [179, -1, 181, 1],
    [179, -1, -179, 1],
  ],
  [
    [-540, -90, 540, 90],
    [-180, -90, 180, 90],
  ],
])("normalizes viewport bounds %j to %j", (bounds, expected) => {
  expect(normalizedViewportBounds(bounds)).toEqual(expected);
});
