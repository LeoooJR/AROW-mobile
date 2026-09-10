import { type ReactElement } from "react";
import { Text, View } from "react-native";

import PointSearchStepHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-step-header";
import SectionStep from "@/components/composites/map-toolbar/point-search-sheet/section-step";
import Button from "@/components/primitives/button";
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
              <Button
                aria-pressed={selected}
                className={`min-w-[62px] px-3.5 ${selected ? "border-text-primary bg-text-primary" : ""}`}
                key={section.sectionRank}
                onPress={() => {
                  onSelect(section);
                }}
                role="button"
                size="control"
                testID={`section-choice-${section.sectionRank}`}
                variant="selectable"
              >
                <Text
                  className={`font-mono text-[13px] font-semibold ${selected ? "text-canvas" : "text-text-primary"}`}
                >
                  Section {section.sectionRank}
                </Text>
              </Button>
            );
          })}
        </View>
      )}
    </View>
  );
}
