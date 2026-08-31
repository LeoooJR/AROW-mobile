import { type ReactElement } from "react";
import { Text, View } from "react-native";

import type { MapLayerVisibility } from "@/components/adapters/map/map-layer-visibility";
import type { MapFeature } from "@/features/map-features/map-feature";
import type { Milestone } from "@/features/milestones/milestone";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export interface MapLocation extends GeographicCoordinates {
  readonly heading: number | null;
}

export interface MapProps {
  readonly layerVisibility?: MapLayerVisibility;
  readonly location?: MapLocation;
  readonly milestones?: readonly Milestone[];
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly railwayData?: string;
  readonly recenterRequest?: number;
  readonly selectedFeature?: MapFeature;
}

export default function Map(_props: MapProps): ReactElement {
  return (
    <View
      accessible
      accessibilityLabel="Carte ferroviaire AROW indisponible sur le web"
      className="flex-1 items-center justify-center bg-surface px-6"
      testID="arow-map-web-fallback"
    >
      <Text className="text-center text-base text-text-primary">
        La carte interactive est disponible sur Android et iOS.
      </Text>
    </View>
  );
}
