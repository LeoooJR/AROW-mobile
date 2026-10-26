import {
  Map as MapLibreMap,
  type ViewStateChangeEvent,
  type MapRef,
} from "@maplibre/maplibre-react-native";
import { type ReactElement, useCallback, useRef, useState } from "react";
import {
  type NativeSyntheticEvent,
  StyleSheet,
  useColorScheme,
} from "react-native";

import MapCamera from "@/components/adapters/map/camera";
import { DEFAULT_MAP_LAYER_VISIBILITY } from "@/components/adapters/map/layer-visibility";
import type { MapProps } from "@/components/adapters/map/map-props";
import { DARK_MAP_STYLE } from "@/components/adapters/map/style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/style-light";
import MilestoneLayer from "@/components/adapters/map/milestone-layer";
import RailwayLinesSource from "@/components/adapters/map/railway-lines-source";
import UserLocationMarker from "@/components/adapters/map/user-location-marker";
import { useMapFeaturePress } from "./use-feature-press";
import { resolveColorTheme } from "@/utils/color-theme";

export type {
  MapLocation,
  MapProps,
} from "@/components/adapters/map/map-props";

const MAP_STYLES = { dark: DARK_MAP_STYLE, light: LIGHT_MAP_STYLE };

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map({
  focusLocation,
  focusRequest,
  layerVisibility = DEFAULT_MAP_LAYER_VISIBILITY,
  location,
  milestoneData,
  onFeaturePress,
  onReady,
  onLoadError,
  onViewportChange,
  railwayData,
  recenterRequest,
  selectedFeature,
}: MapProps): ReactElement {
  const colorScheme = useColorScheme();
  const [bearing, setBearing] = useState(0);
  const styleLoaded = useRef(false);
  const map = useRef<MapRef | null>(null);
  const initialRenderState = useRef<"pending" | "reported" | "failed">(
    "pending",
  );
  const selectedSection =
    selectedFeature === undefined
      ? undefined
      : selectedFeature.kind === "milestone"
        ? selectedFeature.id.sectionId
        : selectedFeature.id;
  const selectedMilestone =
    selectedFeature?.kind === "milestone" ? selectedFeature : undefined;
  const { onPress: onMapPress, invalidate: invalidateFeaturePress } =
    useMapFeaturePress({
      map,
      ready: styleLoaded,
      visibility: layerVisibility,
      railwayAvailable: railwayData !== undefined,
      selectedSection: selectedSection !== undefined,
      selectedMilestone,
      selectedFeature,
      milestoneData,
      railwayData,
      onFeaturePress,
    });

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      invalidateFeaturePress();
      setBearing(event.nativeEvent.bearing);
      onViewportChange?.({
        bounds: event.nativeEvent.bounds,
        zoom: event.nativeEvent.zoom,
      });
    },
    [onViewportChange, invalidateFeaturePress],
  );

  const reportReady = () => {
    if (
      initialRenderState.current === "pending" &&
      styleLoaded.current &&
      railwayData !== undefined &&
      milestoneData !== undefined
    ) {
      initialRenderState.current = "reported";
      onReady?.();
    }
  };

  return (
    <MapLibreMap
      ref={map}
      accessibilityLabel="Carte ferroviaire interactive AROW"
      androidView="texture"
      mapStyle={MAP_STYLES[resolveColorTheme(colorScheme)]}
      onWillStartLoadingMap={() => {
        invalidateFeaturePress();
        styleLoaded.current = false;
      }}
      onDidFinishLoadingStyle={() => {
        styleLoaded.current = true;
      }}
      onPress={onMapPress}
      onRegionWillChange={invalidateFeaturePress}
      onRegionIsChanging={invalidateFeaturePress}
      onDidFinishRenderingMapFully={
        onReady === undefined ? undefined : reportReady
      }
      onDidFinishRenderingFrameFully={
        onReady === undefined ? undefined : reportReady
      }
      onDidFailLoadingMap={
        onLoadError === undefined
          ? undefined
          : () => {
              if (initialRenderState.current !== "failed") {
                initialRenderState.current = "failed";
                onLoadError();
              }
            }
      }
      onRegionDidChange={onRegionDidChange}
      style={styles.map}
      testID="arow-map"
    >
      <MapCamera
        focusLocation={focusLocation}
        focusRequest={focusRequest}
        location={location}
        recenterRequest={recenterRequest}
      />
      <MilestoneLayer
        data={milestoneData}
        selectedMilestone={selectedMilestone}
        visible={layerVisibility.milestone}
      />
      {railwayData === undefined ? null : (
        <RailwayLinesSource
          data={railwayData}
          selectedSection={selectedSection}
          visible={layerVisibility.railway}
        />
      )}
      {location === undefined ? null : (
        <UserLocationMarker bearing={bearing} location={location} />
      )}
    </MapLibreMap>
  );
}
