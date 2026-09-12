import type { MilestoneResolution } from "@/features/milestones/milestone-search";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

export interface LineSearchFormModel {
  readonly changeQuery: (query: string) => void;
  readonly query: string;
  readonly queryReady: boolean;
  readonly reset: () => void;
  readonly results: readonly Railway[];
  readonly select: (line: Railway) => void;
  readonly selected?: Railway;
}

export interface SectionSearchFormModel {
  readonly line?: Railway;
  readonly select: (section: RailwaySection) => void;
  readonly selected?: RailwaySection;
}

export interface MilestoneSearchFormModel {
  readonly changeKilometer: (value: string) => void;
  readonly changeMetric: (value: string) => void;
  readonly kilometer: string;
  readonly line?: Railway;
  readonly metric: string;
  readonly resolution: MilestoneResolution;
  readonly section?: RailwaySection;
}

export default interface PointSearchFormModel {
  readonly line: LineSearchFormModel;
  readonly milestone: MilestoneSearchFormModel;
  readonly section: SectionSearchFormModel;
}
