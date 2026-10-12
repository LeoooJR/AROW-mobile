import { type ReactElement } from "react";
import { Text, View } from "react-native";

interface PointSearchSheetHeaderProps {
  readonly compact: boolean;
}

export default function PointSearchSheetHeader({
  compact,
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
      </View>
    </>
  );
}
