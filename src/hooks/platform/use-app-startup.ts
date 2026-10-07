import { useCallback, useEffect, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";

export type AppStartupPlatform = string | undefined;
export type StartupStatus = "loading" | "error" | "ready";

export interface AppStartupResult {
  readonly attempt: number;
  readonly status: StartupStatus;
  readonly onReady: () => void;
  readonly onFailure: () => void;
  readonly onLayout: () => void;
  readonly onFallbackLayout: () => void;
  readonly onArtworkReady: () => void;
  readonly retry: () => void;
}
interface StartupState {
  readonly attempt: number;
  readonly status: StartupStatus;
}

export function useAppStartup(
  platform: AppStartupPlatform = process.env.EXPO_OS,
): AppStartupResult {
  const nativeSplash = platform !== "web";
  const [state, setState] = useState<StartupState>({
    attempt: 0,
    status: nativeSplash ? "loading" : "ready",
  });
  const [layoutReady, setLayoutReady] = useState(false);
  const splashHidden = useRef(false);
  const { attempt, status } = state;

  const hideSplash = useCallback(() => {
    if (nativeSplash && !splashHidden.current) {
      SplashScreen.hide();
      splashHidden.current = true;
    }
  }, [nativeSplash]);
  const onReady = useCallback(() => {
    setState((current) =>
      current.attempt === attempt && current.status === "loading"
        ? { ...current, status: "ready" }
        : current,
    );
  }, [attempt]);
  const onFailure = useCallback(() => {
    setState((current) =>
      current.attempt === attempt && current.status === "loading"
        ? { ...current, status: "error" }
        : current,
    );
  }, [attempt]);
  const retry = useCallback(() => {
    setState((current) =>
      current.status === "error"
        ? { attempt: current.attempt + 1, status: "loading" }
        : current,
    );
  }, []);
  const onLayout = useCallback(() => setLayoutReady(true), []);
  const onFallbackLayout = useCallback(() => {
    if (status === "error") hideSplash();
  }, [hideSplash, status]);
  const onArtworkReady = useCallback(() => {
    // Android's native splash blocks drawing, including navigator layout.
    // The decoded artwork can take over before MapLibre's first complete frame.
    if (platform === "android") hideSplash();
  }, [hideSplash, platform]);

  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(onFailure, 30_000);
    return () => clearTimeout(timer);
  }, [onFailure, status]);
  useEffect(() => {
    if (layoutReady && status === "ready") hideSplash();
  }, [hideSplash, layoutReady, status]);

  return {
    attempt,
    status,
    onReady,
    onFailure,
    onLayout,
    onFallbackLayout,
    onArtworkReady,
    retry,
  };
}
