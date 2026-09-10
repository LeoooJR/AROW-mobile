import { type ReactElement } from "react";
import { type ViewStyle } from "react-native";

import LayersIcon from "@/components/primitives/icons/layers-icon";
import IconButton from "@/components/primitives/icon-button";

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
    <IconButton
      aria-label="Afficher les couches de la carte"
      aria-expanded={expanded}
      onPress={onPress}
      role="button"
      size="toolbar"
      style={buttonStyle}
      testID="map-layers-button"
      variant="surface"
    >
      <LayersIcon color={iconColor} />
    </IconButton>
  );
}
