import {
  GeoJSONSource,
  Layer,
  type PressEventWithFeatures,
  type SymbolLayerSpecification,
} from "@maplibre/maplibre-react-native";
import type { Feature, FeatureCollection, Point } from "geojson";
import { type ReactElement, useMemo } from "react";
import { type NativeSyntheticEvent, useColorScheme } from "react-native";

import {
  geographicCoordinatesFromPosition,
  isCanonicalRailwayLineCode,
  isNonEmptyString,
  isNonNegativeInteger,
  isPositiveInteger,
  isRecord,
} from "@/components/adapters/map/geojson-validation";
import {
  canonicalRailwayLineCode,
  milestoneId,
} from "@/features/map-features/map-features";
import { type MapFeature, type MilestoneFeature } from "@/types/map-feature";

export interface MilestoneLayerProps {
  readonly milestones: readonly MilestoneFeature[];
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly selectedMilestone?: MilestoneFeature;
}

interface MilestoneGeoJSONProperties {
  readonly kilometer: number;
  readonly kind: "milestone";
  readonly label: string;
  readonly lineCode: string;
  readonly sectionRank: number;
}

type MilestoneGeoJSONFeature = Feature<Point, MilestoneGeoJSONProperties>;
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

export function milestonesToFeatureCollection(
  milestones: readonly MilestoneFeature[],
): MilestoneFeatureCollection {
  return {
    features: milestones.map((milestone): MilestoneGeoJSONFeature => ({
      geometry: {
        coordinates: [
          milestone.coordinates.longitude,
          milestone.coordinates.latitude,
        ],
        type: "Point",
      },
      id: milestoneId(milestone),
      properties: {
        kilometer: milestone.kilometer,
        kind: milestone.kind,
        label: milestone.label,
        lineCode: milestone.lineCode,
        sectionRank: milestone.sectionRank,
      },
      type: "Feature",
    })),
    type: "FeatureCollection",
  };
}

function isMilestoneProperties(
  properties: GeoJSON.GeoJsonProperties,
): properties is MilestoneGeoJSONProperties {
  if (!isRecord(properties)) {
    return false;
  }

  return hasMilestoneIdentity(properties) && hasMilestoneMetadata(properties);
}

function hasMilestoneIdentity(properties: Record<string, unknown>): boolean {
  return (
    properties.kind === "milestone" &&
    isCanonicalRailwayLineCode(properties.lineCode) &&
    isPositiveInteger(properties.sectionRank) &&
    isNonNegativeInteger(properties.kilometer)
  );
}

function hasMilestoneMetadata(properties: Record<string, unknown>): boolean {
  return isNonEmptyString(properties.label);
}

function milestoneFromFeature(
  feature: GeoJSON.Feature,
): MilestoneFeature | undefined {
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

  const milestone: MilestoneFeature = {
    coordinates,
    kilometer: feature.properties.kilometer,
    kind: "milestone",
    label: feature.properties.label,
    lineCode: canonicalRailwayLineCode(feature.properties.lineCode),
    sectionRank: feature.properties.sectionRank,
  };

  return feature.id === milestoneId(milestone) ? milestone : undefined;
}

export default function MilestoneLayer({
  milestones,
  onFeaturePress,
  selectedMilestone,
}: MilestoneLayerProps): ReactElement {
  const colorScheme = useColorScheme();
  const palette =
    colorScheme === "dark" ? MILESTONE_PALETTES.dark : MILESTONE_PALETTES.light;
  const collection = useMemo(
    () => milestonesToFeatureCollection(milestones),
    [milestones],
  );

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
      data={collection}
      id="railway-milestones-source"
      onPress={onPress}
    >
      <Layer
        id="railway-milestone-dots"
        key="railway-milestone-dots"
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
          filter={["==", ["id"], milestoneId(selectedMilestone)]}
          id="railway-milestone-selected"
          key="railway-milestone-selected"
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
        id="railway-milestone-labels"
        key="railway-milestone-labels"
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
