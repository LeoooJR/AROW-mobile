import type { ColorSchemeName } from "react-native";

export type MapToolbarTheme = "dark" | "light";

interface MapToolbarPalette {
  readonly icon: string;
  readonly shadow: string;
  readonly sheet: string;
}

export const MAP_TOOLBAR_PALETTES = {
  dark: {
    icon: "#FAF9F6",
    shadow: "#10100F",
    sheet: "#10100F",
  },
  light: {
    icon: "#0A0A0A",
    shadow: "#E7E7E2",
    sheet: "#FFFFFF",
  },
} as const satisfies Record<MapToolbarTheme, MapToolbarPalette>;

export function mapToolbarTheme(colorScheme: ColorSchemeName): MapToolbarTheme {
  return colorScheme === "dark" ? "dark" : "light";
}
