import { type ReactElement } from "react";
import { Text, View } from "react-native";

import CloseIcon from "@/components/primitives/icons/close-icon";
import IconButton from "@/components/primitives/icon-button";

interface PointSearchSheetHeaderProps {
  readonly compact: boolean;
  readonly iconColor: string;
  readonly onClose: () => void;
}

export default function PointSearchSheetHeader({
  compact,
  iconColor,
  onClose,
}: PointSearchSheetHeaderProps): ReactElement {
  return (
    <>
      <View className="mb-1 h-1 w-9 self-center rounded-full bg-border-subtle" />
      <View
        className={`flex-row items-start gap-3 pb-2 ${compact ? "px-3" : "px-4"}`}
      >
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-semibold leading-[25px] text-text-primary">
            Rechercher un point
          </Text>
          <Text className="mt-1 text-xs leading-[18px] text-text-muted">
            Ligne, section, puis repère kilométrique.
          </Text>
        </View>
        <IconButton
          aria-label="Fermer la recherche"
          className="-mt-1.5"
          onPress={onClose}
          role="button"
          testID="close-point-search"
          variant="ghost"
        >
          <CloseIcon color={iconColor} />
        </IconButton>
      </View>
    </>
  );
}
