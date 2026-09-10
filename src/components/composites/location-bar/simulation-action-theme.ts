import type { ColorSchemeName } from "react-native";

export interface SimulationActionPalette {
  readonly foreground: string;
  readonly pressedForeground: string;
}

export const SIMULATION_ACTION_PALETTES = {
  dark: {
    foreground: "#FAF9F6",
    pressedForeground: "#10100F",
  },
  light: {
    foreground: "#0A0A0A",
    pressedForeground: "#FFFFFF",
  },
} as const satisfies Record<"dark" | "light", SimulationActionPalette>;

export function simulationActionPalette(
  colorScheme: ColorSchemeName,
): SimulationActionPalette {
  return SIMULATION_ACTION_PALETTES[colorScheme === "dark" ? "dark" : "light"];
}
