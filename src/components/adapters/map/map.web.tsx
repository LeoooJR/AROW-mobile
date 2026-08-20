import { type ReactElement } from "react";
import { Text, View } from "react-native";

import type { RailwayLineKey, RailwayLineMetadata } from "@/types/railway-line";

export interface MapLocation {
  readonly heading: number | null;
  readonly latitude: number;
  readonly longitude: number;
}

export interface MapProps {
  readonly location?: MapLocation;
  readonly onRailwayPress?: (railway: RailwayLineMetadata) => void;
  readonly railwayData?: string;
  readonly recenterRequest?: number;
  readonly selectedRailway?: RailwayLineKey;
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
