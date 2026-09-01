import { type ReactElement } from "react";
import { Pressable, Text, type ViewStyle } from "react-native";

import SearchIcon from "@/components/composites/map-toolbar/search-icon";

interface PointSearchButtonProps {
  readonly buttonStyle: ViewStyle;
  readonly compact: boolean;
  readonly iconColor: string;
  readonly onPress: () => void;
}

export default function PointSearchButton({
  buttonStyle,
  compact,
  iconColor,
  onPress,
}: PointSearchButtonProps): ReactElement {
  return (
    <Pressable
      className={`h-14 min-w-0 flex-1 flex-row items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted ${compact ? "gap-2.5 px-2.5" : "gap-2.5 px-4"}`}
      onPress={onPress}
      role="button"
      style={buttonStyle}
      testID="open-point-search"
    >
      <SearchIcon color={iconColor} />
      <Text
        className={`${compact ? "text-sm" : "text-[15px]"} font-semibold leading-5 text-text-primary`}
      >
        Rechercher un point
      </Text>
    </Pressable>
  );
}
