import {
  GeoJSONSource,
  Layer,
  type LineLayerSpecification,
  type PressEventWithFeatures,
} from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { type NativeSyntheticEvent, useColorScheme } from "react-native";

import {
  isCanonicalRailwayLineCode,
  isPositiveInteger,
  isRecord,
  isString,
} from "@/components/adapters/map/geojson-validation";
import {
  canonicalRailwayLineCode,
  railwaySectionId,
} from "@/features/map-features/map-features";
import {
  type MapFeature,
  type RailwayFeature,
  type RailwaySectionKey,
} from "@/types/map-feature";

export interface RailwayLinesSourceProps {
  readonly data: string;
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly selectedSection?: RailwaySectionKey;
}

interface RailwayLineProperties {
  readonly code_ligne: string;
  readonly idgaia: string;
  readonly lib_ligne: string;
  readonly pkd: string;
  readonly pkf: string;
  readonly rg_troncon: number;
  readonly type_ligne: string;
}

const LAYER_COLORS = {
  dark: {
    passive: "#FAF9F6",
    selected: "#FF7A1A",
  },
  light: {
    passive: "#0A0A0A",
    selected: "#FF6A00",
  },
} as const;

type LineWidth = NonNullable<LineLayerSpecification["paint"]>["line-width"];

const LINE_WIDTH: LineWidth = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  0.8,
  12,
  1.4,
  20,
  3,
];

const SELECTED_LINE_WIDTH: LineWidth = [
  "interpolate",
  ["linear"],
  ["zoom"],
  7,
  3,
  12,
  5,
  20,
  8,
];

function isRailwayLineProperties(
  properties: GeoJSON.GeoJsonProperties,
): properties is RailwayLineProperties {
  if (!isRecord(properties)) {
    return false;
  }

  return hasRailwayIdentity(properties) && hasRailwayMetadata(properties);
}

function hasRailwayIdentity(properties: Record<string, unknown>): boolean {
  return (
    isCanonicalRailwayLineCode(properties.code_ligne) &&
    isPositiveInteger(properties.rg_troncon)
  );
}

function hasRailwayMetadata(properties: Record<string, unknown>): boolean {
  return (
    isString(properties.idgaia) &&
    isString(properties.lib_ligne) &&
    isString(properties.pkd) &&
    isString(properties.pkf) &&
    isString(properties.type_ligne)
  );
}

function railwayFromFeature(
  feature: GeoJSON.Feature,
): RailwayFeature | undefined {
  if (
    feature.geometry.type !== "LineString" &&
    feature.geometry.type !== "MultiLineString"
  ) {
    return undefined;
  }

  if (!isRailwayLineProperties(feature.properties)) {
    return undefined;
  }

  const railway: RailwayFeature = {
    endMilestone: feature.properties.pkf,
    gaiaId: feature.properties.idgaia,
    kind: "railway",
    lineCode: canonicalRailwayLineCode(feature.properties.code_ligne),
    name: feature.properties.lib_ligne,
    railwayType: feature.properties.type_ligne,
    sectionRank: feature.properties.rg_troncon,
    startMilestone: feature.properties.pkd,
  };

  return feature.id === railwaySectionId(railway) ? railway : undefined;
}

export default function RailwayLinesSource({
  data,
  onFeaturePress,
  selectedSection,
}: RailwayLinesSourceProps): ReactElement {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? LAYER_COLORS.dark : LAYER_COLORS.light;

  const onPress = (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ): void => {
    const railway = event.nativeEvent.features
      .map(railwayFromFeature)
      .find((feature) => feature !== undefined);

    if (railway === undefined) {
      return;
    }

    event.stopPropagation();
    onFeaturePress?.(railway);
  };

  return (
    <GeoJSONSource
      data={data}
      id="arow-railway-lines"
      onPress={onPress}
      testID="railway-lines-source"
    >
      <Layer
        id="arow-railway-lines-passive"
        key="arow-railway-lines-passive"
        layout={{
          "line-cap": "round",
          "line-join": "round",
        }}
        minzoom={7}
        paint={{
          "line-color": colors.passive,
          "line-opacity": 0.22,
          "line-width": LINE_WIDTH,
        }}
        testID="railway-lines-passive-layer"
        type="line"
      />
      {selectedSection === undefined ? null : (
        <Layer
          filter={["==", ["id"], railwaySectionId(selectedSection)]}
          id="arow-railway-lines-selected"
          key="arow-railway-lines-selected"
          layout={{
            "line-cap": "round",
            "line-join": "round",
          }}
          minzoom={7}
          paint={{
            "line-color": colors.selected,
            "line-opacity": 1,
            "line-width": SELECTED_LINE_WIDTH,
          }}
          testID="railway-lines-selected-layer"
          type="line"
        />
      )}
    </GeoJSONSource>
  );
}
