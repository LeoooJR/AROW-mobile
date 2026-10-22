import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import {
  GeoJSONSource,
  Layer,
  type PressEventWithFeatures,
  type SymbolLayerSpecification,
} from "@maplibre/maplibre-react-native";
import type { FeatureCollection, Point } from "geojson";
import { type ReactElement, useMemo } from "react";
import { type NativeSyntheticEvent, useColorScheme } from "react-native";

import { geographicCoordinatesFromPosition } from "@/components/adapters/map/geojson-validation";
import { MAP_LAYER_IDS } from "@/components/adapters/map/map-layer-ids";
import type { MapFeature } from "@/types/map-feature";
import { isCanonicalRailwayLineCode } from "@shared/railway-domain/line-code";
import { isMilestoneLabelForPosition } from "@shared/railway-domain/kilometric-position";
import { Milestone } from "@shared/railway-domain/milestone";
import {
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
  isUnsignedInteger,
} from "@shared/value-validation";
import { resolveColorTheme } from "@/utils/color-theme";

export interface MilestoneLayerProps {
  readonly data?: string | readonly Milestone[];
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly selectedMilestone?: Milestone;
  readonly visible?: boolean;
}

interface MilestoneGeoJSONProperties {
  readonly label: string;
  readonly lineCode: string;
  readonly positionMeters: number;
  readonly sectionRank: number;
}

type MilestoneFeatureCollection = FeatureCollection<
  Point,
  MilestoneGeoJSONProperties
>;

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

function isMilestoneProperties(
  properties: GeoJSON.GeoJsonProperties,
): properties is MilestoneGeoJSONProperties {
  if (!isRecord(properties)) {
    return false;
  }

  return (
    hasMilestoneIdentity(properties) &&
    hasMilestoneMetadata(properties) &&
    isMilestoneLabelForPosition(properties.label, properties.positionMeters)
  );
}

function hasMilestoneIdentity(properties: Record<string, unknown>): boolean {
  return (
    isCanonicalRailwayLineCode(properties.lineCode) &&
    isPositiveInteger(properties.sectionRank) &&
    isUnsignedInteger(properties.positionMeters)
  );
}

function hasMilestoneMetadata(properties: Record<string, unknown>): boolean {
  return isNonEmptyString(properties.label);
}

function milestoneFromFeature(feature: GeoJSON.Feature): Milestone | undefined {
  if (
    feature.geometry.type !== "Point" ||
    !isMilestoneProperties(feature.properties)
  ) {
    return undefined;
  }

  const coordinates = geographicCoordinatesFromPosition(
    feature.geometry.coordinates,
  );
  if (coordinates === undefined) {
    return undefined;
  }

  const milestone = new Milestone({
    id: new MilestoneId(
      new RailwaySectionId(
        feature.properties.lineCode,
        feature.properties.sectionRank,
      ),
      feature.properties.positionMeters,
    ),
    coordinates,
    label: feature.properties.label,
  });

  return feature.id === milestone.id.value ? milestone : undefined;
}

export default function MilestoneLayer({
  data,
  onFeaturePress,
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

  const onPress = (
    event: NativeSyntheticEvent<PressEventWithFeatures>,
  ): void => {
    const milestone = event.nativeEvent.features
      .map(milestoneFromFeature)
      .find((feature) => feature !== undefined);

    if (milestone === undefined) {
      return;
    }

    event.stopPropagation();
    onFeaturePress?.(milestone);
  };

  return (
    <GeoJSONSource
      data={sourceData}
      id="railway-milestones-source"
      key={typeof data === "string" ? data : "viewport-milestones"}
      onPress={visible ? onPress : undefined}
    >
      <Layer
        id={MAP_LAYER_IDS.milestone.dots}
        key={MAP_LAYER_IDS.milestone.dots}
        layout={{ visibility: visible ? "visible" : "none" }}
        minzoom={10}
        paint={{
          "circle-color": palette.label,
          "circle-radius": 4,
          "circle-stroke-color": palette.border,
          "circle-stroke-width": 1,
        }}
        type="circle"
      />
      {selectedMilestone === undefined ? null : (
        <Layer
          filter={["==", ["id"], selectedMilestone.id.value]}
          id={MAP_LAYER_IDS.milestone.selected}
          key={MAP_LAYER_IDS.milestone.selected}
          layout={{ visibility: visible ? "visible" : "none" }}
          minzoom={10}
          paint={{
            "circle-color": palette.selected,
            "circle-radius": 7,
            "circle-stroke-color": palette.label,
            "circle-stroke-width": 2,
          }}
          type="circle"
        />
      )}
      <Layer
        id={MAP_LAYER_IDS.milestone.labels}
        key={MAP_LAYER_IDS.milestone.labels}
        layout={{
          ...LABEL_LAYOUT,
          visibility: visible ? "visible" : "none",
        }}
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
