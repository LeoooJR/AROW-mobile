import { milestoneDisplayInterval } from "./milestone-display";

test.each([
  [9.999, undefined],
  [10, 1000],
  [10.001, 1000],
  [11.999, 1000],
  [12, 500],
  [12.001, 500],
  [13.999, 500],
  [14, 100],
  [14.001, 100],
  [14.999, 100],
  [15, 1],
  [15.001, 1],
  [22, 1],
  [NaN, undefined],
  [Infinity, undefined],
  [-Infinity, undefined],
])("selects interval %s → %s", (zoom, interval) => {
  expect(milestoneDisplayInterval(zoom)).toBe(interval);
});
