import { type ReactElement } from "react";
import { Pressable, type ViewStyle } from "react-native";

import MapFocusIcon from "@/components/composites/map-toolbar/map-focus-icon";

interface MapFocusButtonProps {
  readonly buttonStyle: ViewStyle;
  readonly iconColor: string;
  readonly onPress: () => void;
}

export default function MapFocusButton({
  buttonStyle,
  iconColor,
  onPress,
}: MapFocusButtonProps): ReactElement {
  return (
    <Pressable
      aria-label="Activer le mode carte seule"
      aria-pressed={false}
      className="size-14 items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted"
      onPress={onPress}
      role="button"
      style={buttonStyle}
      testID="map-focus-button"
    >
      <MapFocusIcon color={iconColor} />
    </Pressable>
  );
}
