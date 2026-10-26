import type { MilestoneFeatureCollection } from "./feature-parsing";
import { MILESTONE_CIRCLES, milestoneDotLayerId } from "./hit-policy";
import {
  GeoJSONSource,
  Layer,
  type SymbolLayerSpecification,
  type CircleLayerSpecification,
} from "@maplibre/maplibre-react-native";
import { type ReactElement, useMemo } from "react";
import { useColorScheme } from "react-native";

import { MAP_LAYER_IDS } from "@/components/adapters/map/layer-ids";
import type { Milestone } from "@shared/railway-domain/milestone";
import { resolveColorTheme } from "@/utils/color-theme";
import { MILESTONE_DISPLAY_BANDS } from "@/features/railway-reference/milestone-display";

export interface MilestoneLayerProps {
  readonly data?: string | readonly Milestone[];
  readonly selectedMilestone?: Milestone;
  readonly visible?: boolean;
}

interface MilestonePalette {
  readonly border: string;
  readonly label: string;
  readonly selected: string;
  readonly surface: string;
}

const MILESTONE_PALETTES = {
  dark: {
    border: "#363632",
    label: "#FAF9F6",
    selected: "#FF7A1A",
    surface: "#10100F",
  },
  light: {
    border: "#E7E7E2",
    label: "#0A0A0A",
    selected: "#FF6A00",
    surface: "#FFFFFF",
  },
} as const satisfies Record<"dark" | "light", MilestonePalette>;

const LABEL_LAYOUT = {
  "symbol-placement": "point",
  "text-allow-overlap": false,
  "text-anchor": "bottom",
  "text-field": ["get", "label"],
  "text-font": ["Noto Sans Regular"],
  "text-offset": [0, -0.85],
  "text-optional": false,
  "text-padding": 8,
  "text-size": 10,
} satisfies SymbolLayerSpecification["layout"];

const EMPTY_MILESTONES: MilestoneFeatureCollection = {
  features: [],
  type: "FeatureCollection",
};
Object.freeze(EMPTY_MILESTONES.features);
Object.freeze(EMPTY_MILESTONES);

export default function MilestoneLayer({
  data,
  selectedMilestone,
  visible = true,
}: MilestoneLayerProps): ReactElement {
  const colorScheme = useColorScheme();
  const palette = MILESTONE_PALETTES[resolveColorTheme(colorScheme)];
  const sourceData = useMemo(() => {
    if (typeof data === "string") return data;
    const points = data ?? [];
    const displayed =
      selectedMilestone !== undefined &&
      !points.some((point) => point.id.value === selectedMilestone.id.value)
        ? [...points, selectedMilestone]
        : points;
    if (displayed.length === 0) return EMPTY_MILESTONES;
    return {
      type: "FeatureCollection" as const,
      features: displayed.map((point) => point.toGeoJSON()),
    };
  }, [data, selectedMilestone]);

  return (
    <GeoJSONSource
      data={sourceData}
      id="railway-milestones-source"
      key={typeof data === "string" ? data : "viewport-milestones"}
    >
      {MILESTONE_DISPLAY_BANDS.map((band) => (
        <Layer
          id={milestoneDotLayerId(band.intervalMeters)}
          key={band.intervalMeters}
          filter={[
            "==",
            ["%", ["get", "positionMeters"], band.intervalMeters],
            0,
          ]}
          layout={{ visibility: visible ? "visible" : "none" }}
          minzoom={band.minZoom}
          maxzoom={band.maxZoom}
          paint={{
            "circle-color": palette.label,
            "circle-radius": MILESTONE_CIRCLES.normal.radius,
            "circle-stroke-color": palette.border,
            "circle-stroke-width": MILESTONE_CIRCLES.normal.stroke,
          }}
          type="circle"
        />
      ))}
      {selectedMilestone === undefined ? null : (
        <Layer
          filter={["==", ["id"], selectedMilestone.id.value]}
          id={MAP_LAYER_IDS.milestone.selected}
          key={MAP_LAYER_IDS.milestone.selected}
          layout={{ visibility: visible ? "visible" : "none" }}
          minzoom={MILESTONE_DISPLAY_BANDS[0].minZoom}
          paint={{
            "circle-color": palette.selected,
            "circle-radius": MILESTONE_CIRCLES.selected.radius,
            "circle-stroke-color": palette.label,
            "circle-stroke-width": MILESTONE_CIRCLES.selected.stroke,
          }}
          type="circle"
        />
      )}
      {MILESTONE_DISPLAY_BANDS.filter(
        (band) => (band.maxZoom ?? Infinity) > 13,
      ).map((band, index) => {
        const eligible: CircleLayerSpecification["filter"] = [
          "==",
          ["%", ["get", "positionMeters"], band.intervalMeters],
          0,
        ];
        return (
          <Layer
            id={
              index === 0
                ? MAP_LAYER_IDS.milestone.labels
                : `${MAP_LAYER_IDS.milestone.labels}-${band.intervalMeters}`
            }
            key={band.intervalMeters}
            filter={
              selectedMilestone === undefined
                ? eligible
                : ["any", eligible, ["==", ["id"], selectedMilestone.id.value]]
            }
            layout={{
              ...LABEL_LAYOUT,
              visibility: visible ? "visible" : "none",
            }}
            minzoom={Math.max(13, band.minZoom)}
            maxzoom={band.maxZoom}
            paint={{
              "text-color": palette.label,
              "text-halo-blur": 0.25,
              "text-halo-color": palette.surface,
              "text-halo-width": 4,
            }}
            type="symbol"
          />
        );
      })}
    </GeoJSONSource>
  );
}
