import { createMapStyle } from "@/components/adapters/map/create-map-style";

const palette = {
  canvas: "#F7F7F6",
  land: "#FFFFFF",
  muted: "#EFEFED",
  border: "#E7E7E2",
  borderStrong: "#BDBDB7",
  text: "#0A0A0A",
  textMuted: "#7A7A74",
} as const;

export const LIGHT_MAP_STYLE = createMapStyle("AROW Light", palette);
