import { type ReactElement } from "react";
import { Text, View } from "react-native";

import Switch from "@/components/primitives/switch";

interface MapLayerRowProps {
  readonly accessibilityNoun: string;
  readonly checked: boolean;
  readonly label: string;
  readonly onValueChange: (checked: boolean) => void;
  readonly testID: string;
}

export default function MapLayerRow({
  accessibilityNoun,
  checked,
  label,
  onValueChange,
  testID,
}: MapLayerRowProps): ReactElement {
  return (
    <View className="min-h-14 flex-row items-center justify-between gap-4 border-t border-border-subtle">
      <Text className="text-[15px] font-medium leading-5 text-text-primary">
        {label}
      </Text>
      <Switch
        accessibilityLabel={`${checked ? "Masquer" : "Afficher"} ${accessibilityNoun}`}
        checked={checked}
        onValueChange={onValueChange}
        testID={testID}
      />
    </View>
  );
}
