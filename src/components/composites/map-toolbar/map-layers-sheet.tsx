import { type ReactElement } from "react";
import { Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  MapLayerVisibility,
  ToggleableMapLayer,
} from "@/components/adapters/map/map-layer-visibility";
import NativeBottomSheet from "@/components/adapters/native-bottom-sheet";
import MapLayerRow from "@/components/composites/map-toolbar/map-layer-row";
import {
  MAP_TOOLBAR_PALETTES,
  mapToolbarTheme,
} from "@/components/composites/map-toolbar/map-toolbar-theme";
import CloseIcon from "@/components/primitives/icons/close-icon";
import IconButton from "@/components/primitives/icon-button";

interface MapLayersSheetProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
  readonly onVisibilityChange: (
    layer: ToggleableMapLayer,
    visible: boolean,
  ) => void;
  readonly visibility: MapLayerVisibility;
}

export default function MapLayersSheet({
  isOpen,
  onDismiss,
  onVisibilityChange,
  visibility,
}: MapLayersSheetProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const palette = MAP_TOOLBAR_PALETTES[mapToolbarTheme(colorScheme)];

  return (
    <NativeBottomSheet
      backgroundColor={palette.sheet}
      isOpen={isOpen}
      onDismiss={onDismiss}
    >
      <View
        aria-label="Couches ferroviaires"
        aria-modal
        className="rounded-t-[14px] bg-canvas px-4 pt-2.5"
        role="dialog"
        style={{ paddingBottom: Math.max(20, insets.bottom) }}
        testID="map-layers-sheet"
      >
        <View className="mb-2 h-1 w-9 self-center rounded-full bg-border-subtle" />
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-xl font-semibold leading-[25px] text-text-primary">
            Couches ferroviaires
          </Text>
          <IconButton
            aria-label="Fermer les couches"
            onPress={onDismiss}
            role="button"
            testID="close-layers-button"
            variant="ghost"
          >
            <CloseIcon color={palette.icon} />
          </IconButton>
        </View>
        <MapLayerRow
          accessibilityNoun="les voies ferrées"
          checked={visibility.railway}
          label="Voies ferrées"
          onValueChange={(visible) => {
            onVisibilityChange("railway", visible);
          }}
          testID="railways-layer-switch"
        />
        <MapLayerRow
          accessibilityNoun="les points kilométriques"
          checked={visibility.milestone}
          label="Points kilométriques"
          onValueChange={(visible) => {
            onVisibilityChange("milestone", visible);
          }}
          testID="milestones-layer-switch"
        />
      </View>
    </NativeBottomSheet>
  );
}
