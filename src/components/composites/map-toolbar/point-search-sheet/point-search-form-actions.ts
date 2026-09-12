import type { Dispatch } from "react";

import type { PointSearchFormAction } from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-reducer";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

export interface PointSearchFormActions {
  readonly changeKilometer: (value: string) => void;
  readonly changeMetric: (value: string) => void;
  readonly changeQuery: (query: string) => void;
  readonly resetLine: () => void;
  readonly selectLine: (line: Railway) => void;
  readonly selectSection: (section: RailwaySection) => void;
}

export default function createPointSearchFormActions(
  dispatch: Dispatch<PointSearchFormAction>,
): PointSearchFormActions {
  return {
    changeKilometer(value: string): void {
      dispatch({ field: "kilometer", type: "milestone-input-changed", value });
    },
    changeMetric(value: string): void {
      dispatch({ field: "metric", type: "milestone-input-changed", value });
    },
    changeQuery(query: string): void {
      dispatch({ query, type: "query-changed" });
    },
    resetLine(): void {
      dispatch({ type: "line-reset" });
    },
    selectLine(line: Railway): void {
      dispatch({ line, type: "line-selected" });
    },
    selectSection(section: RailwaySection): void {
      dispatch({ section, type: "section-selected" });
    },
  };
}
