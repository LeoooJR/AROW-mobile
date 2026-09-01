import { type ReactElement } from "react";
import {
  Pressable,
  Text,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

import CenterLocationIcon from "@/components/composites/location-bar/center-location-icon";

interface CenterLocationButtonProps {
  readonly locationKind: "réelle" | "simulée";
  readonly onPress: () => void;
}

const CENTER_ICON_COLORS = {
  dark: "#FAF9F6",
  light: "#0A0A0A",
} as const;

export default function CenterLocationButton({
  locationKind,
  onPress,
}: CenterLocationButtonProps): ReactElement {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const compact = width <= 380;

  return (
    <Pressable
      accessibilityLabel={`Centrer la carte sur la position ${locationKind}`}
      accessibilityRole="button"
      className={`h-12 flex-row items-center justify-center gap-[5px] rounded-lg bg-transparent active:bg-surface-muted ${compact ? "min-w-12 px-0" : "min-w-16 px-2"}`}
      hitSlop={4}
      onPress={onPress}
      testID="center-location"
    >
      <CenterLocationIcon
        color={
          colorScheme === "dark"
            ? CENTER_ICON_COLORS.dark
            : CENTER_ICON_COLORS.light
        }
      />
      {compact ? null : (
        <Text className="text-[11px] font-semibold leading-[15px] text-text-primary">
          Centrer
        </Text>
      )}
    </Pressable>
  );
}
