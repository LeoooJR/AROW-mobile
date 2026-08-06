import { Map as MapLibreMap } from "@maplibre/maplibre-react-native";
import { type ReactElement } from "react";
import { StyleSheet } from "react-native";

const DEFAULT_MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default function Map(): ReactElement {
  return (
    <MapLibreMap
      accessibilityLabel="Carte ferroviaire interactive AROW"
      mapStyle={DEFAULT_MAP_STYLE}
      style={styles.map}
      testID="arow-map"
    />
  );
}
