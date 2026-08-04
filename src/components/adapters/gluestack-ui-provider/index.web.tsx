"use client";

import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ToastProvider } from "@gluestack-ui/core/toast/creator";
import { useCallback, useEffect, useLayoutEffect } from "react";

import { applyColorMode } from "./script";
import type { GluestackUIProviderProps } from "./types";

export type { GluestackColorMode, GluestackUIProviderProps } from "./types";

const useSafeLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function GluestackUIProvider({
  children,
  mode = "system",
}: GluestackUIProviderProps) {
  const handleMediaQuery = useCallback((event: MediaQueryListEvent) => {
    applyColorMode(event.matches ? "dark" : "light");
  }, []);

  useSafeLayoutEffect(() => {
    if (mode !== "system") {
      applyColorMode(mode);
    }
  }, [mode]);

  useSafeLayoutEffect(() => {
    if (mode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", handleMediaQuery);

    return () => media.removeEventListener("change", handleMediaQuery);
  }, [handleMediaQuery, mode]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(${applyColorMode.toString()})('${mode}')`,
        }}
        suppressHydrationWarning
      />
      <OverlayProvider>
        <ToastProvider>{children}</ToastProvider>
      </OverlayProvider>
    </>
  );
}
