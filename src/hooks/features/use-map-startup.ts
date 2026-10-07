import { useCallback, useEffect, useState } from "react";

import type { AppStartupActions } from "@/features/app-startup/context";
import { checkBasemapSource } from "@/features/map-screen/check-basemap-source";

export type MapStartupInput = AppStartupActions | null;
export type MapStartupResult = (() => void) | undefined;

export function useMapStartup(startup: MapStartupInput): MapStartupResult {
  const [sourceAvailable, setSourceAvailable] = useState(false);
  const [rendered, setRendered] = useState(false);
  const onMapReady = useCallback(() => setRendered(true), []);
  const status = startup?.status;
  const onFailure = startup?.onFailure;
  const onReady = startup?.onReady;

  useEffect(() => {
    if (process.env.EXPO_OS === "web" || status !== "loading") return;
    const controller = new AbortController();
    // A fully rendered MapLibre frame may include failed tile requests.
    // Require the online basemap source to be available as well.
    void checkBasemapSource(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setSourceAvailable(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) onFailure?.();
      });
    return () => controller.abort();
  }, [onFailure, status]);

  useEffect(() => {
    if (rendered && sourceAvailable && status === "loading") onReady?.();
  }, [onReady, rendered, sourceAvailable, status]);

  return status === "loading" ? onMapReady : undefined;
}
