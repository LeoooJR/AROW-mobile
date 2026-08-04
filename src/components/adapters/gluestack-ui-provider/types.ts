import type { ReactNode } from "react";

export type GluestackColorMode = "light" | "dark" | "system";

export interface GluestackUIProviderProps {
  children?: ReactNode;
  mode?: GluestackColorMode;
}
