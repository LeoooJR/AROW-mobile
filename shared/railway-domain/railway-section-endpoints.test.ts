import { areValidRecordedSectionEndpoints } from "./railway-section-endpoints";

describe("recorded section endpoints", () => {
  test.each([
    [0, null, null],
    [1, 0, 0],
    [1, 136_772, 136_772],
    [2, 0, 1_000],
    [14, 136_772, 137_980],
    [2, 1_000, 1_000],
  ])("accepts count %s with endpoints %s and %s", (count, first, last) => {
    expect(areValidRecordedSectionEndpoints([first, last], count)).toBe(true);
  });

  test.each([
    [0, undefined, undefined],
    [0, null, 0],
    [0, 0, null],
    [0, 0, 0],
    [1, null, null],
    [1, 0, 1_000],
    [2, null, 1_000],
    [2, 0, undefined],
    [2, "000+000", 1_000],
    [2, 0, "001+000"],
    [2, -1, 1_000],
    [2, 0, 1.5],
    [2, NaN, 1_000],
    [2, 0, Infinity],
    [2, 1_000, 0],
    [-1, null, null],
    [1.5, 0, 1_000],
  ])("rejects count %s with endpoints %s and %s", (count, first, last) => {
    expect(areValidRecordedSectionEndpoints([first, last], count)).toBe(false);
  });
});
