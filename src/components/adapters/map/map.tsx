import { Map as MapLibreMap } from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { DARK_MAP_STYLE } from "@/components/adapters/map/map-style-dark";
import { LIGHT_MAP_STYLE } from "@/components/adapters/map/map-style-light";

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map(): ReactElement {
  const colorScheme = useColorScheme();

  return (
    <MapLibreMap
      accessibilityLabel="Carte ferroviaire interactive AROW"
      mapStyle={colorScheme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
      style={styles.map}
      testID="arow-map"
    />
  );
}
