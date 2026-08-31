import { type ReactElement } from "react";
import {
  Pressable,
  Text,
  useColorScheme,
  useWindowDimensions,
  type ViewStyle,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LayersIcon from "@/components/composites/map-toolbar/layers-icon";
import MapFocusIcon from "@/components/composites/map-toolbar/map-focus-icon";
import {
  MAP_TOOLBAR_PALETTES,
  mapToolbarTheme,
} from "@/components/composites/map-toolbar/map-toolbar-theme";
import SearchIcon from "@/components/composites/map-toolbar/search-icon";

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
      <Pressable
        className={`h-14 min-w-0 flex-1 flex-row items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted ${compact ? "gap-2.5 px-2.5" : "gap-2.5 px-4"}`}
        onPress={noOp}
        role="button"
        style={buttonStyle}
        testID="open-point-search"
      >
        <SearchIcon color={palette.icon} />
        <Text
          className={`${compact ? "text-sm" : "text-[15px]"} font-semibold leading-5 text-text-primary`}
        >
          Rechercher un point
        </Text>
      </Pressable>
      <Pressable
        aria-label="Afficher les couches de la carte"
        aria-expanded={layersOpen}
        className="size-14 items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted"
        onPress={onOpenLayers}
        role="button"
        style={buttonStyle}
        testID="map-layers-button"
      >
        <LayersIcon color={palette.icon} />
      </Pressable>
      <Pressable
        aria-label="Activer le mode carte seule"
        aria-pressed={false}
        className="size-14 items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted"
        onPress={noOp}
        role="button"
        style={buttonStyle}
        testID="map-focus-button"
      >
        <MapFocusIcon color={palette.icon} />
      </Pressable>
    </View>
  );
}
