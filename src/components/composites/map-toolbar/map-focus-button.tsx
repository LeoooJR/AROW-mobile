import { type ReactElement } from "react";
import { type ViewStyle } from "react-native";

import FocusIcon from "@/components/primitives/icons/focus-icon";
import FocusExitIcon from "@/components/primitives/icons/focus-exit-icon";
import IconButton from "@/components/primitives/icon-button";

interface MapFocusButtonProps {
  readonly buttonStyle: ViewStyle;
  readonly focused: boolean;
  readonly iconColor: string;
  readonly onPress: () => void;
}

export default function MapFocusButton({
  buttonStyle,
  focused,
  iconColor,
  onPress,
}: MapFocusButtonProps): ReactElement {
  return (
    <IconButton
      aria-label={
        focused ? "Quitter le mode carte seule" : "Activer le mode carte seule"
      }
      aria-pressed={focused}
      onPress={onPress}
      role="button"
      size="toolbar"
      style={buttonStyle}
      testID="map-focus-button"
      variant="surface"
    >
      {focused ? (
        <FocusExitIcon color={iconColor} />
      ) : (
        <FocusIcon color={iconColor} />
      )}
    </IconButton>
  );
}
