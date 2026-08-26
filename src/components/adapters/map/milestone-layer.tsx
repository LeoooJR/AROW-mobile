import {
  GeoJSONSource,
  Layer,
  type SymbolLayerSpecification,
} from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { useColorScheme } from "react-native";

import { type MilestoneFeatureCollection } from "@/features/milestones/milestones";

export interface MilestoneLayerProps {
  readonly milestones: MilestoneFeatureCollection;
}

interface MilestonePalette {
  readonly border: string;
  readonly label: string;
  readonly surface: string;
}

const MILESTONE_PALETTES = {
  dark: {
    border: "#363632",
    label: "#FAF9F6",
    surface: "#10100F",
  },
  light: {
    border: "#E7E7E2",
    label: "#0A0A0A",
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

export default function MilestoneLayer({
  milestones,
}: MilestoneLayerProps): ReactElement {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === "dark" ? MILESTONE_PALETTES.dark : MILESTONE_PALETTES.light;

  return (
    <GeoJSONSource data={milestones} id="railway-milestones-source">
      <Layer
        id="railway-milestone-dots"
        minzoom={10}
        paint={{
          "circle-color": palette.label,
          "circle-radius": 4,
          "circle-stroke-color": palette.border,
          "circle-stroke-width": 1,
        }}
        type="circle"
      />
      <Layer
        id="railway-milestone-labels"
        layout={LABEL_LAYOUT}
        minzoom={13}
        paint={{
          "text-color": palette.label,
          "text-halo-blur": 0.25,
          "text-halo-color": palette.surface,
          "text-halo-width": 4,
        }}
        type="symbol"
      />
    </GeoJSONSource>
  );
}
