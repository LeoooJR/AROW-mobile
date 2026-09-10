import { type ReactElement } from "react";
import { Text, View } from "react-native";

import Button from "@/components/primitives/button";
import type { Railway } from "@/features/railways/railway";

interface RailwayLineResultProps {
  readonly line: Railway;
  readonly onPress: () => void;
}

export default function RailwayLineResult({
  line,
  onPress,
}: RailwayLineResultProps): ReactElement {
  return (
    <Button
      aria-label={`${line.name}, code ${line.code}`}
      className="min-h-[58px] flex-row justify-start gap-3 rounded-none border-0 border-b border-border-subtle px-3 py-2"
      onPress={onPress}
      role="button"
      testID={`line-result-${line.code}`}
      variant="surface"
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
    </Button>
  );
}
