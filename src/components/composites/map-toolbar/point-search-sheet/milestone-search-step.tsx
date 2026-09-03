import { type ReactElement } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";

import MilestoneResolutionFeedback from "@/components/composites/map-toolbar/point-search-sheet/milestone-resolution-feedback";
import MilestoneStep from "@/components/composites/map-toolbar/point-search-sheet/milestone-step";
import PointSearchStepHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-step-header";
import type {
  MilestoneResolution,
  MilestoneSearchLine,
  MilestoneSearchSection,
} from "@/features/milestones/milestone-search";

interface MilestoneSearchStepProps {
  readonly kilometer: string;
  readonly metric: string;
  readonly onKilometerChange: (value: string) => void;
  readonly onMetricChange: (value: string) => void;
  readonly placeholderColor: string;
  readonly resolution: MilestoneResolution;
  readonly selectedLine?: MilestoneSearchLine;
  readonly selectedSection?: MilestoneSearchSection;
}

export default function MilestoneSearchStep({
  kilometer,
  metric,
  onKilometerChange,
  onMetricChange,
  placeholderColor,
  resolution,
  selectedLine,
  selectedSection,
}: MilestoneSearchStepProps): ReactElement {
  const disabled = selectedSection === undefined;
  const invalid = resolution.status === "error";
  const step = new MilestoneStep(selectedSection, resolution);

  return (
    <View
      aria-disabled={disabled}
      className={`border-t border-border-subtle py-3 ${disabled ? "opacity-50" : ""}`}
      testID="search-step-milestone"
    >
      <PointSearchStepHeader step={step} />
      <View className="flex-row items-end gap-2">
        <View className="min-w-0 flex-1">
          <Text className="mb-1.5 text-xs font-semibold text-text-primary">
            Kilomètre
          </Text>
          <TextInput
            aria-invalid={invalid}
            aria-label="Kilomètre"
            className="h-[52px] rounded-lg border border-border-subtle bg-surface px-2.5 font-mono text-[22px] font-bold text-text-primary"
            editable={!disabled}
            inputMode="numeric"
            onChangeText={onKilometerChange}
            placeholder="509"
            placeholderTextColor={placeholderColor}
            style={{ textAlign: "center" }}
            testID="milestone-kilometer-input"
            value={kilometer}
          />
        </View>
        <View
          aria-hidden
          style={{ alignItems: "center", height: 52, justifyContent: "center" }}
          testID="milestone-input-separator"
        >
          <Text className="font-mono text-[22px] font-bold text-text-primary">
            +
          </Text>
        </View>
        <View className="w-[92px]">
          <Text className="mb-1.5 text-xs font-semibold text-text-primary">
            Partie métrique
          </Text>
          <TextInput
            aria-invalid={invalid}
            aria-label="Partie métrique"
            className="h-[52px] rounded-lg border border-border-subtle bg-surface px-2.5 font-mono text-[22px] font-bold text-text-primary"
            editable={!disabled}
            inputMode="numeric"
            maxLength={3}
            onChangeText={onMetricChange}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="000"
            placeholderTextColor={placeholderColor}
            returnKeyType="done"
            style={{ textAlign: "center" }}
            testID="milestone-metric-input"
            value={metric}
          />
        </View>
      </View>
      <Text className="mt-1.5 text-[11px] leading-4 text-text-muted">
        Format attendu : 509+000. Le repère doit exister dans la section
        sélectionnée.
      </Text>
      <MilestoneResolutionFeedback
        resolution={resolution}
        selectedLine={selectedLine}
      />
    </View>
  );
}
