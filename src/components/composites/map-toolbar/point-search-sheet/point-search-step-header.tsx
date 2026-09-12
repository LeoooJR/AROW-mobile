import { type ReactElement } from "react";
import { Text, View } from "react-native";

import type Step from "@/components/composites/map-toolbar/point-search-sheet/step";

interface PointSearchStepHeaderProps {
  readonly step: Step;
}

export default function PointSearchStepHeader({
  step,
}: PointSearchStepHeaderProps): ReactElement {
  return (
    <View className="mb-2 flex-row items-center gap-2">
      <Text className="size-6 rounded-full border border-border-subtle bg-surface text-center font-mono text-[11px] font-bold leading-[22px] text-text-primary">
        {step.number}
      </Text>
      <Text className="text-sm font-bold text-text-primary">{step.title}</Text>
      <Text className="ml-auto text-[11px] leading-4 text-text-muted">
        {step.status}
      </Text>
    </View>
  );
}
