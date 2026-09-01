import type { ColorSchemeName } from "react-native";

export type MapFeatureDetailsTheme = "dark" | "light";

interface MapFeatureDetailsPalette {
  readonly icon: string;
  readonly shadow: string;
}

export const MAP_FEATURE_DETAILS_PALETTES = {
  dark: {
    icon: "#FAF9F6",
    shadow: "0 6px 18px rgba(0, 0, 0, 0.28)",
  },
  light: {
    icon: "#0A0A0A",
    shadow: "0 6px 18px rgba(10, 10, 10, 0.12)",
  },
} as const satisfies Record<MapFeatureDetailsTheme, MapFeatureDetailsPalette>;

export function mapFeatureDetailsTheme(
  colorScheme: ColorSchemeName,
): MapFeatureDetailsTheme {
  return colorScheme === "dark" ? "dark" : "light";
}
