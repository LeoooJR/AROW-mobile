import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

import type { MilestoneSearchLine } from "@/features/milestones/milestone-search";

interface RailwayLineResultProps {
  readonly line: MilestoneSearchLine;
  readonly onPress: () => void;
}

export default function RailwayLineResult({
  line,
  onPress,
}: RailwayLineResultProps): ReactElement {
  return (
    <Pressable
      aria-label={`${line.name}, code ${line.code}`}
      className="min-h-[58px] flex-row items-center gap-3 border-b border-border-subtle bg-canvas px-3 py-2 active:bg-surface-muted"
      onPress={onPress}
      role="button"
      testID={`line-result-${line.code}`}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-semibold leading-5 text-text-primary">
          {line.name}
        </Text>
        <Text className="mt-0.5 font-mono text-[10px] leading-4 text-text-muted">
          Code ligne · {line.code}
        </Text>
      </View>
      <Text aria-hidden className="text-lg text-text-primary">
        ›
      </Text>
    </Pressable>
  );
}
