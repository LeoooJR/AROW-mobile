import {
  GeoJSONSource,
  Layer,
  type LineLayerSpecification,
  type PressEventWithFeatures,
} from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { type NativeSyntheticEvent, useColorScheme } from "react-native";

import { MAP_LAYER_IDS } from "@/components/adapters/map/map-layer-ids";
import type { MapFeature } from "@/features/map-features/map-feature";
import {
  isCanonicalRailwayLineCode,
  RailwaySectionKey,
} from "@/features/map-features/railway-section-key";
import { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";
import {
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
} from "@/types/value-validation";

export interface RailwayLinesSourceProps {
  readonly data: string;
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly selectedSection?: RailwaySectionKey;
  readonly visible?: boolean;
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
    isNonEmptyString(properties.idgaia) &&
    isNonEmptyString(properties.lib_ligne) &&
    isNonEmptyString(properties.pkd) &&
    isNonEmptyString(properties.pkf) &&
    isNonEmptyString(properties.type_ligne)
  );
}

function railwayFromFeature(
  feature: GeoJSON.Feature,
): RailwaySection | undefined {
  if (
    feature.geometry.type !== "LineString" &&
    feature.geometry.type !== "MultiLineString"
  ) {
    return undefined;
  }

  if (!isRailwayLineProperties(feature.properties)) {
    return undefined;
  }

  const railway = new Railway({
    code: feature.properties.code_ligne,
    name: feature.properties.lib_ligne,
    sections: [
      {
        geometry: {
          endMilestone: feature.properties.pkf,
          gaiaId: feature.properties.idgaia,
          railwayType: feature.properties.type_ligne,
          startMilestone: feature.properties.pkd,
          status: "present",
        },
        sectionRank: feature.properties.rg_troncon,
      },
    ],
  });
  const section = railway.sections[0];

  return section !== undefined && feature.id === section.id
    ? section
    : undefined;
}

export default function RailwayLinesSource({
  data,
  onFeaturePress,
  selectedSection,
  visible = true,
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
      onPress={visible ? onPress : undefined}
      testID="railway-lines-source"
    >
      <Layer
        beforeId={MAP_LAYER_IDS.milestone.dots}
        id={MAP_LAYER_IDS.railway.passive}
        key={MAP_LAYER_IDS.railway.passive}
        layout={{
          "line-cap": "round",
          "line-join": "round",
          visibility: visible ? "visible" : "none",
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
          beforeId={MAP_LAYER_IDS.milestone.dots}
          filter={["==", ["id"], selectedSection.id]}
          id={MAP_LAYER_IDS.railway.selected}
          key={MAP_LAYER_IDS.railway.selected}
          layout={{
            "line-cap": "round",
            "line-join": "round",
            visibility: visible ? "visible" : "none",
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
