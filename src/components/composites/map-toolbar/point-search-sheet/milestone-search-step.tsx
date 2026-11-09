import { type ReactElement } from "react";
import { Keyboard, Text, View } from "react-native";

import MilestoneResolutionFeedback from "@/components/composites/map-toolbar/point-search-sheet/milestone-resolution-feedback";
import MilestoneStep from "@/components/composites/map-toolbar/point-search-sheet/milestone-step";
import KilometerStepButton from "@/components/composites/map-toolbar/point-search-sheet/kilometer-step-button";
import PointSearchStepHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-step-header";
import TextField from "@/components/primitives/text-field";
import type { MilestoneResolution } from "@/features/railway-reference/search/contracts";
import { validateMilestoneInput } from "@/features/railway-reference/search/milestone-input";
import type { Railway } from "@shared/railway-domain/railway";
import type { RailwaySection } from "@shared/railway-domain/railway-section";

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

function availableRangeMessage(section: RailwaySection | undefined): string {
  if (section === undefined) {
    return "Sélectionnez une section pour connaître les repères disponibles.";
  }

  const range = section.milestoneRange;
  if (range === undefined) {
    return "Plage de repères indisponible pour cette section.";
  }

  return `Repères disponibles : ${range.minimumLabel} à ${range.maximumLabel}.`;
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
  const currentKilometer = /^\d+$/.test(kilometer) ? Number(kilometer) : NaN;
  const range = selectedSection?.milestoneRange;
  const minimum = Math.floor((range?.minimumPositionMeters ?? 0) / 1000);
  const minimumMetric = String(
    (range?.minimumPositionMeters ?? 0) % 1000,
  ).padStart(3, "0");
  const canDecrease =
    validateMilestoneInput(
      selectedSection,
      String(currentKilometer - 1),
      metric,
    ).status === "ready";
  const canIncrease =
    validateMilestoneInput(
      selectedSection,
      String(kilometer === "" ? minimum : currentKilometer + 1),
      kilometer === "" && metric === "" ? minimumMetric : metric,
    ).status === "ready";

  function increaseKilometer(): void {
    if (kilometer === "" && range !== undefined) {
      onKilometerChange(String(minimum));
      if (metric === "") {
        onMetricChange(minimumMetric);
      }
      return;
    }
    onKilometerChange(String(currentKilometer + 1));
  }

  return (
    <View
      aria-busy={resolution.status === "loading"}
      aria-disabled={disabled}
      className={`border-t border-border-subtle py-3 ${disabled ? "opacity-50" : ""}`}
      testID="search-step-milestone"
    >
      <PointSearchStepHeader step={step} />
      <Text
        aria-live="polite"
        className="mt-1.5 text-[11px] leading-4 text-text-muted"
        testID="milestone-available-range"
      >
        {availableRangeMessage(selectedSection)}
      </Text>
      <View className="flex-row items-end gap-2">
        <View className="min-w-0 flex-1">
          <Text className="mb-1.5 text-xs font-semibold text-text-primary">
            Kilomètre
          </Text>
          <View className="flex-row items-center gap-1">
            <KilometerStepButton
              disabled={!canDecrease}
              onPress={() => onKilometerChange(String(currentKilometer - 1))}
            />
            <TextField
              className="min-w-0 flex-1 px-1"
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
            <KilometerStepButton
              increase
              disabled={!canIncrease}
              onPress={increaseKilometer}
            />
          </View>
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
