import {
  GeoJSONSource,
  Layer,
  type LineLayerSpecification,
} from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { useColorScheme } from "react-native";

import { MAP_LAYER_IDS } from "@/components/adapters/map/map-layer-ids";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { resolveColorTheme } from "@/utils/color-theme";

export interface RailwayLinesSourceProps {
  readonly data: string;
  readonly selectedSection?: RailwaySectionId;
  readonly visible?: boolean;
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

export default function RailwayLinesSource({
  data,
  selectedSection,
  visible = true,
}: RailwayLinesSourceProps): ReactElement {
  const colorScheme = useColorScheme();
  const colors = LAYER_COLORS[resolveColorTheme(colorScheme)];

  return (
    <GeoJSONSource
      data={data}
      id="arow-railway-lines"
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
          filter={["==", ["id"], selectedSection.value]}
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
