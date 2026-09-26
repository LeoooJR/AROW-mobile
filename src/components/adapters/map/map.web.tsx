import { type ReactElement } from "react";
import { Text, View } from "react-native";

import type { MapProps } from "@/components/adapters/map/map-props";

export type {
  MapLocation,
  MapProps,
} from "@/components/adapters/map/map-props";

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
