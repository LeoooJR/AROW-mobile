import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ToastProvider } from "@gluestack-ui/core/toast/creator";
import { useEffect } from "react";
import { Appearance, type ViewProps, View } from "react-native";

import type {
  GluestackColorMode,
  GluestackUIProviderProps as BaseGluestackUIProviderProps,
} from "./types";

export interface GluestackUIProviderProps
  extends BaseGluestackUIProviderProps {
  style?: ViewProps["style"];
}

export type { GluestackColorMode } from "./types";

export function GluestackUIProvider({
  children,
  mode = "system",
  style,
}: GluestackUIProviderProps) {
  useEffect(() => {
    Appearance.setColorScheme(mode === "system" ? "unspecified" : mode);
  }, [mode]);

  return (
    <View className="flex-1" style={style}>
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
