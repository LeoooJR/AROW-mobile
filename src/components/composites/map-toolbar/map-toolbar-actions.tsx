import { type ReactElement } from "react";
import {
  useColorScheme,
  useWindowDimensions,
  type ViewStyle,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapFocusButton from "@/components/composites/map-toolbar/map-focus-button";
import MapLayersButton from "@/components/composites/map-toolbar/map-layers-button";
import {
  MAP_TOOLBAR_PALETTES,
  mapToolbarTheme,
} from "@/components/composites/map-toolbar/map-toolbar-theme";
import PointSearchButton from "@/components/composites/map-toolbar/point-search-button";

interface MapToolbarActionsProps {
  readonly layersOpen: boolean;
  readonly onOpenLayers: () => void;
}

function noOp(): void {}

export default function MapToolbarActions({
  layersOpen,
  onOpenLayers,
}: MapToolbarActionsProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const palette = MAP_TOOLBAR_PALETTES[mapToolbarTheme(colorScheme)];
  const compact = width <= 380;
  const buttonStyle = {
    borderCurve: "continuous",
    boxShadow: `0 4px 12px ${palette.shadow}`,
  } satisfies ViewStyle;

  return (
    <View
      aria-label="Recherche cartographique"
      className={`absolute z-20 flex-row items-start ${compact ? "inset-x-3 gap-2" : "inset-x-4 gap-2.5"}`}
      pointerEvents="box-none"
      style={{ top: Math.max(16, insets.top) }}
      testID="map-toolbar"
    >
      <PointSearchButton
        buttonStyle={buttonStyle}
        compact={compact}
        iconColor={palette.icon}
        onPress={noOp}
      />
      <MapLayersButton
        buttonStyle={buttonStyle}
        expanded={layersOpen}
        iconColor={palette.icon}
        onPress={onOpenLayers}
      />
      <MapFocusButton
        buttonStyle={buttonStyle}
        iconColor={palette.icon}
        onPress={noOp}
      />
    </View>
  );
}
