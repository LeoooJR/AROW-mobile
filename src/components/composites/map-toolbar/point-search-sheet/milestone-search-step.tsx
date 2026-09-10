import { type ReactElement } from "react";
import { Keyboard, Text, View } from "react-native";

import MilestoneResolutionFeedback from "@/components/composites/map-toolbar/point-search-sheet/milestone-resolution-feedback";
import MilestoneStep from "@/components/composites/map-toolbar/point-search-sheet/milestone-step";
import PointSearchStepHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-step-header";
import TextField from "@/components/primitives/text-field";
import type { MilestoneResolution } from "@/features/milestones/milestone-search";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

interface MilestoneSearchStepProps {
  readonly kilometer: string;
  readonly metric: string;
  readonly onKilometerChange: (value: string) => void;
  readonly onMetricChange: (value: string) => void;
  readonly placeholderColor: string;
  readonly resolution: MilestoneResolution;
  readonly selectedLine?: Railway;
  readonly selectedSection?: RailwaySection;
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
      aria-busy={resolution.status === "loading"}
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
          <TextField
            aria-invalid={invalid}
            aria-label="Kilomètre"
            editable={!disabled}
            inputMode="numeric"
            onChangeText={onKilometerChange}
            placeholder="509"
            placeholderTextColor={placeholderColor}
            testID="milestone-kilometer-input"
            value={kilometer}
            variant="numeric"
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
          <TextField
            aria-invalid={invalid}
            aria-label="Partie métrique"
            editable={!disabled}
            inputMode="numeric"
            maxLength={3}
            onChangeText={onMetricChange}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="000"
            placeholderTextColor={placeholderColor}
            returnKeyType="done"
            testID="milestone-metric-input"
            value={metric}
            variant="numeric"
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
