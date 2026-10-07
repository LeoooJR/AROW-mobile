import { fetch } from "expo/fetch";

import { isRecord } from "@shared/value-validation";
import { BASEMAP_SOURCE_URL } from "./basemap-config";

export async function checkBasemapSource(signal: AbortSignal): Promise<void> {
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
