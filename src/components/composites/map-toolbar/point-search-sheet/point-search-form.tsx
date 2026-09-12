import { type ReactElement } from "react";
import { View } from "react-native";

import MilestoneSearchStep from "@/components/composites/map-toolbar/point-search-sheet/milestone-search-step";
import type PointSearchFormModel from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-model";
import RailwayLineStep from "@/components/composites/map-toolbar/point-search-sheet/railway-line-step";
import RailwaySectionStep from "@/components/composites/map-toolbar/point-search-sheet/railway-section-step";
import type { MilestoneSearchState } from "@/features/milestones/milestone-search";

interface PointSearchFormProps {
  readonly compact: boolean;
  readonly form: PointSearchFormModel;
  readonly placeholderColor: string;
  readonly searchState: MilestoneSearchState;
}

export default function PointSearchForm({
  compact,
  form,
  placeholderColor,
  searchState,
}: PointSearchFormProps): ReactElement {
  const { line, milestone, section } = form;

  return (
    <View className={compact ? "px-3" : "px-4"}>
      <RailwayLineStep
        onQueryChange={line.changeQuery}
        onReset={line.reset}
        onSelect={line.select}
        placeholderColor={placeholderColor}
        query={line.query}
        queryReady={line.queryReady}
        results={line.results}
        searchState={searchState}
        selectedLine={line.selected}
      />
      <RailwaySectionStep
        onSelect={section.select}
        selectedLine={section.line}
        selectedSection={section.selected}
      />
      <MilestoneSearchStep
        kilometer={milestone.kilometer}
        metric={milestone.metric}
        onKilometerChange={milestone.changeKilometer}
        onMetricChange={milestone.changeMetric}
        placeholderColor={placeholderColor}
        resolution={milestone.resolution}
        selectedLine={milestone.line}
        selectedSection={milestone.section}
      />
    </View>
  );
}
