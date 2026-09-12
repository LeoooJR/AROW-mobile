import pointSearchFormReducer, {
  INITIAL_POINT_SEARCH_FORM_STATE,
  selectedLine,
  selectedSection,
  type PointSearchFormState,
} from "@/components/composites/map-toolbar/point-search-sheet/point-search-form-reducer";
import { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

function createLine(ranks: readonly number[]): Railway {
  return new Railway({
    code: "893000",
    name: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
    sections: ranks.map((sectionRank) => ({
      geometry: { status: "absent" },
      milestoneRange: {
        maximumLabel: "509+000",
        maximumPositionMeters: 509_000,
        minimumLabel: "509+000",
        minimumPositionMeters: 509_000,
      },
      sectionRank,
    })),
  });
}

function firstSection(line: Railway): RailwaySection {
  const section = line.sections[0];
  if (section === undefined) {
    throw new Error("Expected railway section fixture");
  }
  return section;
}

function changeInput(
  state: PointSearchFormState,
  field: "kilometer" | "metric",
  value: string,
): PointSearchFormState {
  return pointSearchFormReducer(state, {
    field,
    type: "milestone-input-changed",
    value,
  });
}

describe("point search form reducer", () => {
  test("updates the query without changing the workflow selection", () => {
    const state = pointSearchFormReducer(INITIAL_POINT_SEARCH_FORM_STATE, {
      query: "893000",
      type: "query-changed",
    });

    expect(state).toEqual({
      ...INITIAL_POINT_SEARCH_FORM_STATE,
      query: "893000",
    });
  });

  test("auto-selects a sole section and clears milestone input", () => {
    const line = createLine([1]);
    const section = firstSection(line);
    const stateWithInput = changeInput(
      INITIAL_POINT_SEARCH_FORM_STATE,
      "kilometer",
      "509",
    );
    const state = pointSearchFormReducer(stateWithInput, {
      line,
      type: "line-selected",
    });

    expect(state.input).toEqual({ kilometer: "", metric: "" });
    expect(state.selection).toEqual({
      line,
      section,
      stage: "milestone",
    });
    expect(selectedLine(state.selection)).toBe(line);
    expect(selectedSection(state.selection)).toBe(section);
  });

  test("requires an explicit choice when a line has multiple sections", () => {
    const line = createLine([1, 2]);
    const state = pointSearchFormReducer(INITIAL_POINT_SEARCH_FORM_STATE, {
      line,
      type: "line-selected",
    });

    expect(state.selection).toEqual({ line, stage: "section" });
    expect(selectedSection(state.selection)).toBeUndefined();
  });

  test("selects a section and clears existing milestone input", () => {
    const line = createLine([1, 2]);
    const sections = line.sections;
    const lineState = pointSearchFormReducer(INITIAL_POINT_SEARCH_FORM_STATE, {
      line,
      type: "line-selected",
    });
    const stateWithInput = changeInput(lineState, "kilometer", "509");
    const state = pointSearchFormReducer(stateWithInput, {
      section: sections[1],
      type: "section-selected",
    });

    expect(state.input).toEqual({ kilometer: "", metric: "" });
    expect(state.selection).toEqual({
      line,
      section: sections[1],
      stage: "milestone",
    });
  });

  test("ignores section selection before a line is selected", () => {
    const state = pointSearchFormReducer(INITIAL_POINT_SEARCH_FORM_STATE, {
      section: firstSection(createLine([1])),
      type: "section-selected",
    });

    expect(state).toBe(INITIAL_POINT_SEARCH_FORM_STATE);
  });

  test("resets selections and inputs while preserving the query", () => {
    const line = createLine([1]);
    let state = pointSearchFormReducer(INITIAL_POINT_SEARCH_FORM_STATE, {
      query: "893000",
      type: "query-changed",
    });
    state = pointSearchFormReducer(state, { line, type: "line-selected" });
    state = changeInput(state, "kilometer", "509");
    state = pointSearchFormReducer(state, { type: "line-reset" });

    expect(state).toEqual({
      input: { kilometer: "", metric: "" },
      query: "893000",
      selection: { stage: "line" },
    });
  });

  test("sanitizes individual milestone fields", () => {
    let state = changeInput(
      INITIAL_POINT_SEARCH_FORM_STATE,
      "kilometer",
      "PK 5a09",
    );
    state = changeInput(state, "metric", "0a001");

    expect(state.input).toEqual({ kilometer: "509", metric: "000" });
  });

  test.each(["509+000", "PK 509+000"])(
    "populates both milestone fields from pasted value %s",
    (value) => {
      const state = changeInput(
        INITIAL_POINT_SEARCH_FORM_STATE,
        "kilometer",
        value,
      );

      expect(state.input).toEqual({ kilometer: "509", metric: "000" });
    },
  );
});
