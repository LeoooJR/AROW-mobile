import { type ReactElement } from "react";
import { Text, type ViewStyle } from "react-native";

import Button from "@/components/primitives/button";
import SearchIcon from "@/components/primitives/icons/search-icon";

interface PointSearchButtonProps {
  readonly buttonStyle: ViewStyle;
  readonly compact: boolean;
  readonly expanded: boolean;
  readonly iconColor: string;
  readonly onPress: () => void;
}

export default function PointSearchButton({
  buttonStyle,
  compact,
  expanded,
  iconColor,
  onPress,
}: PointSearchButtonProps): ReactElement {
  return (
    <Button
      aria-expanded={expanded}
      className={`min-w-0 flex-1 flex-row ${compact ? "gap-2.5 px-2.5" : "gap-2.5 px-4"}`}
      onPress={onPress}
      role="button"
      size="toolbar"
      style={buttonStyle}
      testID="open-point-search"
      variant="surface"
    >
      <SearchIcon color={iconColor} />
      <Text
        className={`${compact ? "text-sm" : "text-[15px]"} font-semibold leading-5 text-text-primary`}
      >
        Rechercher un point
      </Text>
    </Button>
  );
}
