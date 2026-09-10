import { type ReactElement } from "react";
import { type ViewStyle } from "react-native";

import FocusIcon from "@/components/primitives/icons/focus-icon";
import IconButton from "@/components/primitives/icon-button";

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
    <IconButton
      aria-label="Activer le mode carte seule"
      aria-pressed={false}
      onPress={onPress}
      role="button"
      size="toolbar"
      style={buttonStyle}
      testID="map-focus-button"
      variant="surface"
    >
      <FocusIcon color={iconColor} />
    </IconButton>
  );
}
