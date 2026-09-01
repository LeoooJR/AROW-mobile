import { type ReactElement } from "react";
import { Text, View } from "react-native";

import type { LocationPresentation } from "@/components/composites/location-bar/location-presentation";

interface LocationContentProps {
  readonly presentation: LocationPresentation;
}

export default function LocationContent({
  presentation,
}: LocationContentProps): ReactElement {
  return (
    <>
      <View
        className={`size-2 shrink-0 rounded-full ${presentation.dotClassName}`}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-baseline gap-x-2">
          <Text className="text-[13px] font-semibold leading-[18px] text-text-primary">
            {presentation.kindLabel}
          </Text>
          <Text className="text-[11px] leading-[15px] text-text-muted">
            {presentation.stateLabel}
          </Text>
        </View>
        <Text
          className="mt-1 font-mono text-[11px] leading-[17px] text-text-muted"
          selectable
        >
          {presentation.detail}
        </Text>
      </View>
    </>
  );
}
