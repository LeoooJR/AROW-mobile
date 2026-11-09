import { type ReactElement } from "react";
import { Text, View } from "react-native";

import IconButton from "@/components/primitives/icon-button";
import CloseIcon from "@/components/primitives/icons/close-icon";
import ExpandCollapseIcon from "@/components/primitives/icons/expand-collapse-icon";

interface MapFeatureDetailsHeaderProps {
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly eyebrow: string;
  readonly iconColor: string;
  readonly onClose: () => void;
  readonly title: string;
}

export default function MapFeatureDetailsHeader({
  expanded,
  onToggle,
  eyebrow,
  iconColor,
  onClose,
  title,
}: MapFeatureDetailsHeaderProps): ReactElement {
  return (
    <View className="flex-row items-start justify-between gap-[12px]">
      <View className="min-w-0 flex-1 gap-[4px]">
        <Text
          className="font-mono text-[11px] font-bold uppercase leading-[14px] tracking-[0.88px] text-text-primary dark:text-white"
          selectable
        >
          {eyebrow}
        </Text>
        <Text
          className="text-[18px] font-semibold leading-[23px] text-text-primary dark:text-white"
          selectable
        >
          {title}
        </Text>
      </View>
      <View className="flex-row gap-1.5">
        <IconButton
          accessibilityLabel={
            expanded ? "Réduire la fiche" : "Développer la fiche"
          }
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          className="-mt-2.5 focus:border focus:border-primary"
          onPress={onToggle}
          testID="map-feature-details-toggle"
          variant="ghost"
        >
          <ExpandCollapseIcon expanded={expanded} color={iconColor} />
        </IconButton>
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
    </View>
  );
}
