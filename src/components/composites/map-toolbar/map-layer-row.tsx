import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

interface MapLayerRowProps {
  readonly accessibilityNoun: string;
  readonly checked: boolean;
  readonly label: string;
  readonly onPress: () => void;
  readonly testID: string;
}

export default function MapLayerRow({
  accessibilityNoun,
  checked,
  label,
  onPress,
  testID,
}: MapLayerRowProps): ReactElement {
  return (
    <View className="min-h-14 flex-row items-center justify-between gap-4 border-t border-border-subtle">
      <Text className="text-[15px] font-medium leading-5 text-text-primary">
        {label}
      </Text>
      <Pressable
        aria-checked={checked}
        aria-label={`${checked ? "Masquer" : "Afficher"} ${accessibilityNoun}`}
        className="size-12 items-center justify-center rounded-lg bg-transparent active:bg-surface-muted"
        onPress={onPress}
        role="switch"
        testID={testID}
      >
        <View
          className={`h-7 w-12 justify-center rounded-full border ${checked ? "border-text-primary bg-success" : "border-border-subtle bg-surface-muted"}`}
        >
          <View
            className="size-5 rounded-full border border-text-primary bg-canvas"
            style={{ transform: [{ translateX: checked ? 20 : 3 }] }}
          />
        </View>
      </Pressable>
    </View>
  );
}
