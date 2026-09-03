import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

import type { Milestone } from "@/features/milestones/milestone";
import type { MilestoneResolution } from "@/features/milestones/milestone-search";

interface PointSearchFooterProps {
  readonly bottomInset: number;
  readonly compact: boolean;
  readonly onMilestoneSelect: (milestone: Milestone) => void;
  readonly resolution: MilestoneResolution;
}

export default function PointSearchFooter({
  bottomInset,
  compact,
  onMilestoneSelect,
  resolution,
}: PointSearchFooterProps): ReactElement {
  const ready = resolution.status === "ready";

  return (
    <View
      className={`border-t border-border-subtle bg-canvas pt-2.5 ${compact ? "px-3" : "px-4"}`}
      style={{ paddingBottom: Math.max(14, bottomInset) }}
    >
      <Pressable
        aria-disabled={!ready}
        className={`h-[52px] items-center justify-center rounded-lg ${ready ? "bg-text-primary active:bg-surface-muted" : "bg-surface-muted"}`}
        disabled={!ready}
        onPress={() => {
          if (resolution.status === "ready") {
            onMilestoneSelect(resolution.milestone);
          }
        }}
        role="button"
        testID="use-selected-point"
      >
        <Text
          className={`text-sm font-bold ${ready ? "text-canvas" : "text-text-muted"}`}
        >
          Utiliser ce point
        </Text>
      </Pressable>
    </View>
  );
}
