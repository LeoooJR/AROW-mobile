import { useCallback, useEffect, useState } from "react";
import { BackHandler } from "react-native";

import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  type MapLayerVisibility,
  type ToggleableMapLayer,
} from "@/components/adapters/map/map-layer-visibility";
import type { MapFeature } from "@/types/map-feature";
import type { Milestone } from "@/features/milestones/domain/milestone";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

type FeatureSelection =
  | { readonly feature: MapFeature; readonly origin: "map" }
  | { readonly feature: Milestone; readonly origin: "search" };

function layerForFeature(feature: MapFeature): ToggleableMapLayer {
  return feature.kind === "railway-section" ? "railway" : "milestone";
}

export interface MapSelectionModel {
  readonly closeSelection: () => void;
  readonly layerVisibility: MapLayerVisibility;
  readonly mapFocused: boolean;
  readonly focusRequest: number;
  readonly focusLocation?: GeographicCoordinates;
  readonly focusOnLocation: (location: GeographicCoordinates) => void;
  readonly onFeaturePress: (feature: MapFeature) => void;
  readonly onMapFocusChange: (focused: boolean) => void;
  readonly onMilestoneSelect: (milestone: Milestone) => void;
  readonly onVisibilityChange: (
    layer: ToggleableMapLayer,
    visible: boolean,
  ) => void;
  readonly selectedFeature?: MapFeature;
  readonly selectedSimulationMilestone?: Milestone;
}

export function useMapSelection(): MapSelectionModel {
  const [selection, setSelection] = useState<FeatureSelection>();
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>(
    DEFAULT_MAP_LAYER_VISIBILITY,
  );
  const [mapFocused, setMapFocused] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [focusLocation, setFocusLocation] = useState<GeographicCoordinates>();
  const focusOnLocation = useCallback((coordinates: GeographicCoordinates) => {
    setFocusLocation(coordinates);
    setFocusRequest((request) => request + 1);
  }, []);

  const onFeaturePress = useCallback((feature: MapFeature) => {
    setMapFocused(false);
    setSelection({ feature, origin: "map" });
  }, []);
  const onMilestoneSelect = useCallback(
    (milestone: Milestone) => {
      setLayerVisibility((current) => ({ ...current, milestone: true }));
      setSelection({ feature: milestone, origin: "search" });
      focusOnLocation(milestone.coordinates);
    },
    [focusOnLocation],
  );
  const onVisibilityChange = useCallback(
    (layer: ToggleableMapLayer, visible: boolean) => {
      setLayerVisibility((current) => ({ ...current, [layer]: visible }));
      if (!visible) {
        setSelection((current) =>
          current !== undefined && layerForFeature(current.feature) === layer
            ? undefined
            : current,
        );
      }
    },
    [],
  );
  const closeSelection = useCallback(() => setSelection(undefined), []);

  useEffect(() => {
    if (!mapFocused) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        setMapFocused(false);
        return true;
      },
    );
    return () => subscription.remove();
  }, [mapFocused]);

  return {
    closeSelection,
    layerVisibility,
    mapFocused,
    focusRequest,
    focusLocation,
    focusOnLocation,
    onFeaturePress,
    onMapFocusChange: setMapFocused,
    onMilestoneSelect,
    onVisibilityChange,
    selectedFeature: selection?.feature,
    selectedSimulationMilestone:
      selection?.origin === "search" ? selection.feature : undefined,
  };
}
