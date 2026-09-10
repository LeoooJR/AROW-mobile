import { type ReactElement } from "react";
import { Text, useColorScheme, useWindowDimensions } from "react-native";

import Button from "@/components/primitives/button";
import LocationTargetIcon from "@/components/primitives/icons/location-target-icon";

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
    <Button
      accessibilityLabel={`Centrer la carte sur la position ${locationKind}`}
      accessibilityRole="button"
      className={`flex-row gap-[5px] ${compact ? "min-w-12 px-0" : "min-w-16 px-2"}`}
      hitSlop={4}
      onPress={onPress}
      size="control"
      testID="center-location"
      variant="ghost"
    >
      <LocationTargetIcon
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
    </Button>
  );
}
