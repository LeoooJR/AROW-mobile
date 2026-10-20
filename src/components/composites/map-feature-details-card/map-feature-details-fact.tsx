import { type ReactElement } from "react";
import { Text, View } from "react-native";

interface MapFeatureDetailsFactProps {
  readonly label: string;
  readonly value: string;
}

export default function MapFeatureDetailsFact({
  label,
  value,
}: MapFeatureDetailsFactProps): ReactElement {
  return (
    <View className="min-w-0 flex-1 gap-[3px]">
      <Text className="text-[11px] leading-[15px] text-text-muted dark:text-white/60">
        {label}
      </Text>
      <Text
        className="font-mono text-[12px] font-semibold leading-[17px] text-text-primary dark:text-white"
        selectable
      >
        {value}
      </Text>
    </View>
  );
}
