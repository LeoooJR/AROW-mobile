import { useEffect, useMemo } from "react";

import type { AppStartupActions } from "@/features/app-startup/context";
import { createBasemapStartupAttempt } from "@/features/map-screen/check-basemap-source";

export type MapStartupInput = AppStartupActions | null;
export type MapStartupResult = (() => void) | undefined;

export function useMapStartup(startup: MapStartupInput): MapStartupResult {
  const status = startup?.status;
  const onFailure = startup?.onFailure;
  const onReady = startup?.onReady;
  const attempt = useMemo(
    () =>
      onReady === undefined || onFailure === undefined
        ? undefined
        : createBasemapStartupAttempt({ onReady, onFailure }),
    [onReady, onFailure],
  );

  useEffect(() => {
    if (
      process.env.EXPO_OS === "web" ||
      status !== "loading" ||
      attempt === undefined
    )
      return;
    const controller = new AbortController();
    void attempt.check(controller.signal);
    return () => controller.abort();
  }, [attempt, status]);

  return status === "loading" ? attempt?.onRendered : undefined;
}
