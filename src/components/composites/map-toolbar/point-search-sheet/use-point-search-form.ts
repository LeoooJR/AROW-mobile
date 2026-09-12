import { useMemo, useReducer } from "react";

import createPointSearchFormActions from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-actions";
import type PointSearchFormModel from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-model";
import pointSearchFormReducer, {
  INITIAL_POINT_SEARCH_FORM_STATE,
  selectedLine,
  selectedSection,
} from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-reducer";
import useMilestoneResolution from "@/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution";
import {
  isMilestoneLineQueryReady,
  searchRailways,
  type MilestoneSearchModel,
} from "@/features/milestones/milestone-search";
import type { Railway } from "@/features/railways/railway";

const EMPTY_RAILWAYS: readonly Railway[] = [];

export default function usePointSearchForm(
  search: MilestoneSearchModel,
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
  const railways =
    search.state.status === "ready" ? search.state.railways : EMPTY_RAILWAYS;
  const results = useMemo(
    () => searchRailways(railways, state.query),
    [railways, state.query],
  );
  const line = selectedLine(state.selection);
  const section = selectedSection(state.selection);
  const resolution = useMilestoneResolution({
    findMilestone: search.findMilestone,
    kilometer: state.input.kilometer,
    line,
    metric: state.input.metric,
    section,
  });

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
