import { Map as MapLibreMap } from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { StyleSheet } from "react-native";

import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map(): ReactElement {
  return (
    <MapLibreMap
      accessibilityLabel="Carte ferroviaire interactive AROW"
      mapStyle={LIGHT_MAP_STYLE}
      style={styles.map}
      testID="arow-map"
    />
  );
}
