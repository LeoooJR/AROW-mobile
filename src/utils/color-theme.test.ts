import { resolveColorTheme } from "./color-theme";

test.each([
  ["dark", "dark"],
  ["light", "light"],
  ["unspecified", "light"],
  [null, "light"],
  [undefined, "light"],
] as const)("resolves color scheme %s to %s", (scheme, expected) => {
  expect(resolveColorTheme(scheme)).toBe(expected);
});
