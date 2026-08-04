import type { GluestackColorMode } from "./types";

export function applyColorMode(mode: GluestackColorMode) {
  const documentElement = document.documentElement;

  try {
    const resolvedMode =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;

    documentElement.classList.remove(
      resolvedMode === "light" ? "dark" : "light",
    );
    documentElement.classList.add(resolvedMode);
    documentElement.style.colorScheme = resolvedMode;
  } catch (error) {
    console.error(error);
  }
}
