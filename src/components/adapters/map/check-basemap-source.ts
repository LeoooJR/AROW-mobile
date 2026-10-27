import { fetch } from "expo/fetch";

import { isRecord } from "@shared/value-validation";
import { BASEMAP_SOURCE_URL } from "./basemap-config";

export interface BasemapStartupActions {
  readonly onReady: () => void;
  readonly onFailure: () => void;
}

export interface BasemapStartupAttempt {
  readonly check: (signal: AbortSignal) => Promise<void>;
  readonly onRendered: () => void;
}

interface BasemapRequest {
  readonly signal: AbortSignal;
  available: boolean;
}

async function checkBasemapSource(signal: AbortSignal): Promise<void> {
  const response = await fetch(BASEMAP_SOURCE_URL, {
    signal,
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error("Basemap source is unavailable");
  const source: unknown = await response.json();
  if (
    !isRecord(source) ||
    !Array.isArray(source.tiles) ||
    source.tiles.length === 0 ||
    source.tiles.some((tile) => typeof tile !== "string")
  ) {
    throw new Error("Basemap source metadata is invalid");
  }
}

export function createBasemapStartupAttempt({
  onReady,
  onFailure,
}: BasemapStartupActions): BasemapStartupAttempt {
  let request: BasemapRequest | undefined;
  let rendered = false;
  let settled = false;

  const isActive = (candidate: BasemapRequest): boolean =>
    !settled && request === candidate && !candidate.signal.aborted;

  const reportReady = (): void => {
    // A fully rendered MapLibre frame can include failed tile requests.
    // Require availability of the online basemap source as well.
    if (request?.available && rendered && isActive(request)) {
      settled = true;
      onReady();
    }
  };

  return {
    async check(signal) {
      if (settled) return;
      const current: BasemapRequest = { signal, available: false };
      request = current;
      if (signal.aborted) return;

      try {
        await checkBasemapSource(signal);
      } catch {
        if (isActive(current)) {
          settled = true;
          onFailure();
        }
        return;
      }
      if (isActive(current)) {
        current.available = true;
        reportReady();
      }
    },
    onRendered() {
      if (settled || request?.signal.aborted) return;
      rendered = true;
      reportReady();
    },
  };
}
