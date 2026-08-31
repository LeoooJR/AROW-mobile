export type ToggleableMapLayer = "milestone" | "railway";

export interface MapLayerVisibility {
  readonly milestone: boolean;
  readonly railway: boolean;
}

export const DEFAULT_MAP_LAYER_VISIBILITY = Object.freeze({
  milestone: true,
  railway: true,
}) satisfies MapLayerVisibility;
