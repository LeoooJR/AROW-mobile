import type {
  MilestoneResolution,
  MilestoneSearchLine,
  MilestoneSearchSection,
} from "@/features/milestones/milestone-search";

export interface LineSearchFormModel {
  readonly changeQuery: (query: string) => void;
  readonly query: string;
  readonly queryReady: boolean;
  readonly reset: () => void;
  readonly results: readonly MilestoneSearchLine[];
  readonly select: (line: MilestoneSearchLine) => void;
  readonly selected?: MilestoneSearchLine;
}

export interface SectionSearchFormModel {
  readonly line?: MilestoneSearchLine;
  readonly select: (section: MilestoneSearchSection) => void;
  readonly selected?: MilestoneSearchSection;
}

export interface MilestoneSearchFormModel {
  readonly changeKilometer: (value: string) => void;
  readonly changeMetric: (value: string) => void;
  readonly kilometer: string;
  readonly line?: MilestoneSearchLine;
  readonly metric: string;
  readonly resolution: MilestoneResolution;
  readonly section?: MilestoneSearchSection;
}

export default interface PointSearchFormModel {
  readonly line: LineSearchFormModel;
  readonly milestone: MilestoneSearchFormModel;
  readonly section: SectionSearchFormModel;
}
