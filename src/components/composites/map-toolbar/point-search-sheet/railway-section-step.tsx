import { type ReactElement } from "react";
import { Pressable, Text, View } from "react-native";

import PointSearchStepHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-step-header";
import SectionStep from "@/components/composites/map-toolbar/point-search-sheet/section-step";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

interface RailwaySectionStepProps {
  readonly onSelect: (section: RailwaySection) => void;
  readonly selectedLine?: Railway;
  readonly selectedSection?: RailwaySection;
}

export default function RailwaySectionStep({
  onSelect,
  selectedLine,
  selectedSection,
}: RailwaySectionStepProps): ReactElement {
  const disabled = selectedLine === undefined;
  const step = new SectionStep(selectedLine, selectedSection);

  return (
    <View
      aria-disabled={disabled}
      className={`border-t border-border-subtle py-3 ${disabled ? "opacity-50" : ""}`}
      testID="search-step-section"
    >
      <PointSearchStepHeader step={step} />
      {selectedLine === undefined ? null : (
        <View className="flex-row flex-wrap gap-2">
          {selectedLine.sections.map((section) => {
            const selected = section === selectedSection;
            return (
              <Pressable
                aria-pressed={selected}
                className={`h-12 min-w-[62px] items-center justify-center rounded-lg border px-3.5 ${selected ? "border-text-primary bg-text-primary" : "border-border-subtle bg-surface active:bg-surface-muted"}`}
                key={section.sectionRank}
                onPress={() => {
                  onSelect(section);
                }}
                role="button"
                testID={`section-choice-${section.sectionRank}`}
              >
                <Text
                  className={`font-mono text-[13px] font-semibold ${selected ? "text-canvas" : "text-text-primary"}`}
                >
                  Section {section.sectionRank}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
