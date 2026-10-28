import type {
  PressEvent,
  PressEventWithFeatures,
} from "@maplibre/maplibre-react-native";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import type { NativeSyntheticEvent } from "react-native";
import type { MapFeature } from "@/types/map-feature";
import type { MapProps } from "./map-props";
import {
  pickMapFeature,
  type FeatureQueryMap,
  type MapFeaturePickOptions,
} from "./feature-picker";

interface MapFeaturePressOptions extends Omit<MapFeaturePickOptions, "point"> {
  readonly map: RefObject<FeatureQueryMap | null>;
  readonly ready: RefObject<boolean>;
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly milestoneData: MapProps["milestoneData"];
  readonly railwayData: MapProps["railwayData"];
}

export function useMapFeaturePress(options: MapFeaturePressOptions) {
  const revision = useRef(0);
  const mounted = useRef(false);
  const invalidate = useCallback(() => {
    revision.current++;
  }, []);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  useLayoutEffect(invalidate, [
    invalidate,
    options.selectedFeature,
    options.railwayAvailable,
    options.visibility.milestone,
    options.visibility.railway,
    options.milestoneData,
    options.railwayData,
    options.onFeaturePress,
  ]);

  const onPress = useCallback(
    (event: NativeSyntheticEvent<PressEvent | PressEventWithFeatures>) => {
      invalidate();
      const map = options.map.current;
      if (
        map === null ||
        !options.ready.current ||
        options.onFeaturePress === undefined
      )
        return;
      const request = revision.current;
      const isCurrent = () =>
        mounted.current &&
        options.ready.current &&
        options.map.current === map &&
        request === revision.current;
      void pickMapFeature(
        map,
        { ...options, point: event.nativeEvent.point },
        isCurrent,
      ).then(
        (feature) => {
          if (feature !== undefined && isCurrent())
            options.onFeaturePress?.(feature);
        },
        () => undefined,
      );
    },
    [invalidate, options],
  );

  return { onPress, invalidate };
}
