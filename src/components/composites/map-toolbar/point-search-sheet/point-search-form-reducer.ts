import {
  parsePastedMilestone,
  sanitizeMilestonePart,
  type MilestoneSearchLine,
  type MilestoneSearchSection,
} from "@/features/milestones/milestone-search";

export interface MilestoneInput {
  readonly kilometer: string;
  readonly metric: string;
}

export type PointSearchSelection =
  | { readonly stage: "line" }
  | {
      readonly line: MilestoneSearchLine;
      readonly stage: "section";
    }
  | {
      readonly line: MilestoneSearchLine;
      readonly section: MilestoneSearchSection;
      readonly stage: "milestone";
    };

export interface PointSearchFormState {
  readonly input: MilestoneInput;
  readonly query: string;
  readonly selection: PointSearchSelection;
}

export type PointSearchFormAction =
  | { readonly query: string; readonly type: "query-changed" }
  | { readonly line: MilestoneSearchLine; readonly type: "line-selected" }
  | { readonly type: "line-reset" }
  | {
      readonly section: MilestoneSearchSection;
      readonly type: "section-selected";
    }
  | {
      readonly field: "kilometer" | "metric";
      readonly type: "milestone-input-changed";
      readonly value: string;
    };

const EMPTY_MILESTONE_INPUT: MilestoneInput = {
  kilometer: "",
  metric: "",
};

export const INITIAL_POINT_SEARCH_FORM_STATE: PointSearchFormState = {
  input: EMPTY_MILESTONE_INPUT,
  query: "",
  selection: { stage: "line" },
};

function selectionForLine(line: MilestoneSearchLine): PointSearchSelection {
  const section = line.sections.length === 1 ? line.sections[0] : undefined;
  if (section === undefined) {
    return { line, stage: "section" };
  }

  return { line, section, stage: "milestone" };
}

function selectSection(
  state: PointSearchFormState,
  section: MilestoneSearchSection,
): PointSearchFormState {
  if (state.selection.stage === "line") {
    return state;
  }

  return {
    ...state,
    input: EMPTY_MILESTONE_INPUT,
    selection: {
      line: state.selection.line,
      section,
      stage: "milestone",
    },
  };
}

function changeMilestoneInput(
  state: PointSearchFormState,
  field: "kilometer" | "metric",
  value: string,
): PointSearchFormState {
  const pasted = parsePastedMilestone(value);
  if (pasted !== undefined) {
    return { ...state, input: pasted };
  }

  const sanitizedValue = sanitizeMilestonePart(
    value,
    field === "metric" ? 3 : undefined,
  );
  return {
    ...state,
    input: { ...state.input, [field]: sanitizedValue },
  };
}

export default function pointSearchFormReducer(
  state: PointSearchFormState,
  action: PointSearchFormAction,
): PointSearchFormState {
  switch (action.type) {
    case "query-changed":
      return { ...state, query: action.query };
    case "line-selected":
      return {
        ...state,
        input: EMPTY_MILESTONE_INPUT,
        selection: selectionForLine(action.line),
      };
    case "line-reset":
      return {
        ...state,
        input: EMPTY_MILESTONE_INPUT,
        selection: { stage: "line" },
      };
    case "section-selected":
      return selectSection(state, action.section);
    case "milestone-input-changed":
      return changeMilestoneInput(state, action.field, action.value);
  }
}

export function selectedLine(
  selection: PointSearchSelection,
): MilestoneSearchLine | undefined {
  return selection.stage === "line" ? undefined : selection.line;
}

export function selectedSection(
  selection: PointSearchSelection,
): MilestoneSearchSection | undefined {
  return selection.stage === "milestone" ? selection.section : undefined;
}
