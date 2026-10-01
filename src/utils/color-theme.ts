export function resolveColorTheme(
  colorScheme: "dark" | "light" | "unspecified" | null | undefined,
): "dark" | "light" {
  return colorScheme === "dark" ? "dark" : "light";
}
