import { useMemo, useReducer } from "react";

import createPointSearchFormActions from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-actions";
import type PointSearchFormModel from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-model";
import pointSearchFormReducer, {
  INITIAL_POINT_SEARCH_FORM_STATE,
  selectedLine,
  selectedSection,
} from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-reducer";
import {
  isMilestoneLineQueryReady,
  resolveMilestone,
  searchMilestoneLines,
  type MilestoneSearchLine,
  type MilestoneSearchState,
} from "@/features/milestones/milestone-search";

const EMPTY_LINES: readonly MilestoneSearchLine[] = [];

export default function usePointSearchForm(
  searchState: MilestoneSearchState,
): PointSearchFormModel {
  const [state, dispatch] = useReducer(
    pointSearchFormReducer,
    INITIAL_POINT_SEARCH_FORM_STATE,
  );
  const {
    changeKilometer,
    changeMetric,
    changeQuery,
    resetLine,
    selectLine: selectSearchLine,
    selectSection: selectSearchSection,
  } = useMemo(() => createPointSearchFormActions(dispatch), [dispatch]);
  const lines =
    searchState.status === "ready" ? searchState.lines : EMPTY_LINES;
  const results = useMemo(
    () => searchMilestoneLines(lines, state.query),
    [lines, state.query],
  );
  const line = selectedLine(state.selection);
  const section = selectedSection(state.selection);
  const resolution = resolveMilestone(
    section,
    state.input.kilometer,
    state.input.metric,
  );

  return {
    line: {
      changeQuery,
      query: state.query,
      queryReady: isMilestoneLineQueryReady(state.query),
      reset: resetLine,
      results,
      select: selectSearchLine,
      selected: line,
    },
    milestone: {
      changeKilometer,
      changeMetric,
      kilometer: state.input.kilometer,
      line,
      metric: state.input.metric,
      resolution,
      section,
    },
    section: {
      line,
      select: selectSearchSection,
      selected: section,
    },
  };
}
