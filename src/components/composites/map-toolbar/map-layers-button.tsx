import { type ReactElement } from "react";
import { Pressable, type ViewStyle } from "react-native";

import LayersIcon from "@/components/composites/map-toolbar/layers-icon";

interface MapLayersButtonProps {
  readonly buttonStyle: ViewStyle;
  readonly expanded: boolean;
  readonly iconColor: string;
  readonly onPress: () => void;
}

export default function MapLayersButton({
  buttonStyle,
  expanded,
  iconColor,
  onPress,
}: MapLayersButtonProps): ReactElement {
  return (
    <Pressable
      aria-label="Afficher les couches de la carte"
      aria-expanded={expanded}
      className="size-14 items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted"
      onPress={onPress}
      role="button"
      style={buttonStyle}
      testID="map-layers-button"
    >
      <LayersIcon color={iconColor} />
    </Pressable>
  );
}
