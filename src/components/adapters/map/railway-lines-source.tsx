import {
  GeoJSONSource,
  Layer,
  type LineLayerSpecification,
  type PressEventWithFeatures,
} from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { type NativeSyntheticEvent, useColorScheme } from "react-native";

import {
  railwayLineId,
  type RailwayLineKey,
  type RailwayLineMetadata,
} from "@/types/railway-line";

export interface RailwayLinesSourceProps {
  readonly data: string;
  readonly onRailwayPress?: (railway: RailwayLineMetadata) => void;
  readonly selectedRailway?: RailwayLineKey;
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
  if (properties === null) {
    return false;
  }

  return (
    typeof properties.code_ligne === "string" &&
    typeof properties.idgaia === "string" &&
    typeof properties.lib_ligne === "string" &&
    typeof properties.pkd === "string" &&
    typeof properties.pkf === "string" &&
    typeof properties.rg_troncon === "number" &&
    Number.isInteger(properties.rg_troncon) &&
    typeof properties.type_ligne === "string"
  );
}

function metadataFromFeature(
  feature: GeoJSON.Feature,
): RailwayLineMetadata | undefined {
  if (
    feature.geometry.type !== "LineString" &&
    feature.geometry.type !== "MultiLineString"
  ) {
    return undefined;
  }

  if (!isRailwayLineProperties(feature.properties)) {
    return undefined;
  }

  const metadata: RailwayLineMetadata = {
    codeLigne: feature.properties.code_ligne,
    gaiaId: feature.properties.idgaia,
    name: feature.properties.lib_ligne,
    pkDebut: feature.properties.pkd,
    pkFin: feature.properties.pkf,
    rangTroncon: feature.properties.rg_troncon,
    type: feature.properties.type_ligne,
  };

  return feature.id === railwayLineId(metadata) ? metadata : undefined;
}

export default function RailwayLinesSource({
  data,
  onRailwayPress,
  selectedRailway,
}: RailwayLinesSourceProps): ReactElement {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === "dark" ? LAYER_COLORS.dark : LAYER_COLORS.light;

  const onPress = (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ): void => {
    const railway = event.nativeEvent.features
      .map(metadataFromFeature)
      .find((metadata) => metadata !== undefined);

    if (railway === undefined) {
      return;
    }

    event.stopPropagation();
    onRailwayPress?.(railway);
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
      {selectedRailway === undefined ? null : (
        <Layer
          filter={["==", ["id"], railwayLineId(selectedRailway)]}
          id="arow-railway-lines-selected"
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
