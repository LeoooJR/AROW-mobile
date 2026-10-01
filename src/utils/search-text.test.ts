import { normalizeSearchText } from "./search-text";

test.each([
  ["  ÉVRY À LYON  ", "evry a lyon"],
  ["E\u0301vry", "evry"],
  ["PARIS", "paris"],
  ["\tLyon\n", "lyon"],
  ["", ""],
  ["   ", ""],
  [" 00123 ", "00123"],
  ["Saint-Étienne", "saint-etienne"],
] as const)("normalizes search text %p", (value, expected) => {
  expect(normalizeSearchText(value)).toBe(expected);
});
