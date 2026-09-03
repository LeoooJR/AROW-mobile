import { type ReactElement } from "react";
import { Text, View } from "react-native";

import type {
  MilestoneResolution,
  MilestoneSearchLine,
} from "@/features/milestones/milestone-search";

interface MilestoneResolutionFeedbackProps {
  readonly resolution: MilestoneResolution;
  readonly selectedLine?: MilestoneSearchLine;
}

export default function MilestoneResolutionFeedback({
  resolution,
  selectedLine,
}: MilestoneResolutionFeedbackProps): ReactElement | null {
  if (resolution.status === "error") {
    return (
      <Text
        className="mt-2 text-[11px] font-semibold leading-4 text-error"
        role="alert"
      >
        {resolution.message}
      </Text>
    );
  }

  if (resolution.status !== "ready" || selectedLine === undefined) {
    return null;
  }

  return (
    <View
      className="mt-2.5 rounded-lg border border-border-subtle bg-surface px-3 py-2.5"
      testID="resolved-point-summary"
    >
      <Text className="text-[13px] font-semibold leading-5 text-text-primary">
        {selectedLine.name} · section {resolution.milestone.sectionRank} ·{" "}
        {resolution.milestone.label}
      </Text>
      <Text className="mt-0.5 font-mono text-[10px] leading-4 text-text-muted">
        {resolution.milestone.coordinates.latitude.toFixed(5)} N ·{" "}
        {resolution.milestone.coordinates.longitude.toFixed(5)} E
      </Text>
    </View>
  );
}
