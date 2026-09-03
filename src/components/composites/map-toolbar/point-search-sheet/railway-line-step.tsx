import { type ReactElement } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import LineSearchFeedback from "@/components/composites/map-toolbar/point-search-sheet/line-search-feedback";
import LineStep from "@/components/composites/map-toolbar/point-search-sheet/line-step";
import PointSearchStepHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-step-header";
import RailwayLineResult from "@/components/composites/map-toolbar/point-search-sheet/railway-line-result";
import type {
  MilestoneSearchLine,
  MilestoneSearchState,
} from "@/features/milestones/milestone-search";

interface RailwayLineStepProps {
  readonly onQueryChange: (query: string) => void;
  readonly onReset: () => void;
  readonly onSelect: (line: MilestoneSearchLine) => void;
  readonly placeholderColor: string;
  readonly query: string;
  readonly queryReady: boolean;
  readonly results: readonly MilestoneSearchLine[];
  readonly searchState: MilestoneSearchState;
  readonly selectedLine?: MilestoneSearchLine;
}

export default function RailwayLineStep({
  onQueryChange,
  onReset,
  onSelect,
  placeholderColor,
  query,
  queryReady,
  results,
  searchState,
  selectedLine,
}: RailwayLineStepProps): ReactElement {
  const step = new LineStep(selectedLine);

  return (
    <View
      className="border-t border-border-subtle py-3"
      testID="search-step-line"
    >
      <PointSearchStepHeader step={step} />
      {selectedLine === undefined ? (
        <View>
          <Text className="mb-1.5 text-xs font-semibold text-text-primary">
            Nom de ligne ou code unique
          </Text>
          <TextInput
            aria-label="Nom de ligne ou code unique"
            autoCapitalize="none"
            autoCorrect={false}
            className="h-12 rounded-lg border border-border-subtle bg-surface px-3 text-base text-text-primary"
            onChangeText={onQueryChange}
            placeholder="Ex. Paris–Marseille"
            placeholderTextColor={placeholderColor}
            returnKeyType="search"
            role="searchbox"
            testID="line-search-input"
            value={query}
          />
          <Text className="mt-1.5 text-[11px] leading-4 text-text-muted">
            Saisissez au moins deux lettres, ou le début du code ligne.
          </Text>
          <LineSearchFeedback
            hasResults={results.length > 0}
            queryReady={queryReady}
            searchState={searchState}
          />
          {results.length === 0 ? null : (
            <View className="mt-2 overflow-hidden rounded-lg border border-border-subtle">
              {results.map((line) => (
                <RailwayLineResult
                  key={line.code}
                  line={line}
                  onPress={() => {
                    onSelect(line);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="min-h-[52px] flex-row items-center gap-2.5 rounded-lg border border-border-subtle bg-surface px-2.5 py-2">
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-semibold leading-5 text-text-primary">
              {selectedLine.name}
            </Text>
            <Text className="font-mono text-[10px] leading-4 text-text-muted">
              Code ligne · {selectedLine.code}
            </Text>
          </View>
          <Pressable
            className="h-12 justify-center rounded-lg px-2.5 active:bg-surface-muted"
            onPress={onReset}
            role="button"
            testID="change-line"
          >
            <Text className="text-xs font-semibold text-text-primary">
              Modifier
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
