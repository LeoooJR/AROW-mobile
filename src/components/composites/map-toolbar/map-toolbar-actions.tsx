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
  readonly mapFocused: boolean;
  readonly onMapFocusChange: (focused: boolean) => void;
  readonly onOpenLayers: () => void;
  readonly onOpenPointSearch: () => void;
  readonly pointSearchOpen: boolean;
}

export default function MapToolbarActions({
  layersOpen,
  mapFocused,
  onMapFocusChange,
  onOpenLayers,
  onOpenPointSearch,
  pointSearchOpen,
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
      className={`absolute z-20 flex-row items-start ${mapFocused ? (compact ? "right-3 w-14" : "right-4 w-14") : compact ? "inset-x-3 gap-2" : "inset-x-4 gap-2.5"}`}
      pointerEvents="box-none"
      style={{ top: Math.max(16, insets.top) }}
      testID="map-toolbar"
    >
      {!mapFocused ? (
        <>
          <PointSearchButton
            buttonStyle={buttonStyle}
            compact={compact}
            expanded={pointSearchOpen}
            iconColor={palette.icon}
            onPress={onOpenPointSearch}
          />
          <MapLayersButton
            buttonStyle={buttonStyle}
            expanded={layersOpen}
            iconColor={palette.icon}
            onPress={onOpenLayers}
          />
        </>
      ) : null}
      <MapFocusButton
        buttonStyle={buttonStyle}
        focused={mapFocused}
        iconColor={palette.icon}
        onPress={() => {
          onMapFocusChange(!mapFocused);
        }}
      />
    </View>
  );
}
