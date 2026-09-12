import { type ReactElement } from "react";
import {
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NativeBottomSheet from "@/components/adapters/native-bottom-sheet";
import {
  MAP_TOOLBAR_PALETTES,
  mapToolbarTheme,
} from "@/components/composites/map-toolbar/map-toolbar-theme";
import PointSearchFooter from "@/components/composites/map-toolbar/point-search-sheet/point-search-footer";
import PointSearchForm from "@/components/composites/map-toolbar/point-search-sheet/point-search-form";
import PointSearchSheetHeader from "@/components/composites/map-toolbar/point-search-sheet/point-search-sheet-header";
import usePointSearchForm from "@/components/composites/map-toolbar/point-search-sheet/use-point-search-form";
import type { Milestone } from "@/features/milestones/milestone";
import type { MilestoneSearchModel } from "@/features/milestones/milestone-search";

interface PointSearchSheetProps {
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
  readonly onMilestoneSelect: (milestone: Milestone) => void;
  readonly search: MilestoneSearchModel;
}

export default function PointSearchSheet({
  isOpen,
  onDismiss,
  onMilestoneSelect,
  search,
}: PointSearchSheetProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const compact = width <= 380;
  const theme = mapToolbarTheme(colorScheme);
  const palette = MAP_TOOLBAR_PALETTES[theme];
  const placeholderColor = theme === "dark" ? "#A7A49D" : "#7A7A74";
  const form = usePointSearchForm(search);

  return (
    <NativeBottomSheet
      backgroundColor={palette.sheet}
      isOpen={isOpen}
      onDismiss={onDismiss}
      presentation="form"
    >
      <View
        aria-label="Rechercher un point"
        aria-modal
        className="flex-1 rounded-t-[14px] bg-canvas pt-2.5"
        role="dialog"
        style={{ flex: 1 }}
        testID="point-search-sheet"
      >
        <PointSearchSheetHeader
          compact={compact}
          iconColor={palette.icon}
          onClose={onDismiss}
        />
        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(90, 76 + insets.bottom),
          }}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          testID="line-search-results"
        >
          <PointSearchForm
            compact={compact}
            form={form}
            placeholderColor={placeholderColor}
            searchState={search.state}
          />
        </ScrollView>
        <PointSearchFooter
          bottomInset={insets.bottom}
          compact={compact}
          onMilestoneSelect={onMilestoneSelect}
          resolution={form.milestone.resolution}
        />
      </View>
    </NativeBottomSheet>
  );
}
