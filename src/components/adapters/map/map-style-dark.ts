import { createMapStyle } from "@/components/adapters/map/create-map-style";

const palette = {
  canvas: "#151515",
  land: "#0A0A0A",
  muted: "#292929",
  border: "#4D4D4D",
  borderStrong: "#55554E",
  text: "#FFFFFF",
  textMuted: "#A7A49D",
} as const;

export const DARK_MAP_STYLE = createMapStyle("AROW Dark", palette);
