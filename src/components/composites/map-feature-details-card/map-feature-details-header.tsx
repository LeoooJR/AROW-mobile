import { type ReactElement } from "react";
import { Text, View } from "react-native";

import IconButton from "@/components/primitives/icon-button";
import CloseIcon from "@/components/primitives/icons/close-icon";

interface MapFeatureDetailsHeaderProps {
  readonly eyebrow: string;
  readonly iconColor: string;
  readonly onClose: () => void;
  readonly title: string;
}

export default function MapFeatureDetailsHeader({
  eyebrow,
  iconColor,
  onClose,
  title,
}: MapFeatureDetailsHeaderProps): ReactElement {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1 gap-1">
        <Text
          className="font-mono text-[11px] font-bold uppercase leading-[14px] tracking-[0.88px] text-text-primary"
          selectable
        >
          {eyebrow}
        </Text>
        <Text
          className="text-lg font-semibold leading-[23px] text-text-primary"
          selectable
        >
          {title}
        </Text>
      </View>
      <IconButton
        accessibilityLabel="Fermer les informations de l’élément cartographique"
        accessibilityRole="button"
        className="-mr-2.5 -mt-2.5"
        hitSlop={4}
        onPress={onClose}
        testID="close-map-feature-details"
        variant="ghost"
      >
        <CloseIcon color={iconColor} />
      </IconButton>
    </View>
  );
}
