export type FetchImplementation = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface GenerationLogger {
  log(message: string): void;
  warn(message: string): void;
}

interface RailwayResourceMetadata {
  readonly maxBytes: number;
  readonly name: string;
  readonly sha256: string;
  readonly timeoutMs: number;
}

type RailwayResourceLocation =
  | { readonly fileId: string; readonly url?: never }
  | { readonly fileId?: never; readonly url: string };

export type RailwayResource = Readonly<
  RailwayResourceMetadata & RailwayResourceLocation
>;

export interface RailwayResources {
  readonly railwayGeojson: RailwayResource;
  readonly milestones: RailwayResource;
}

export interface Milestone {
  readonly code: string;
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly positionMeters: number;
  readonly rank: number;
}

export interface SkippedMilestone {
  readonly label: string;
  readonly lineNumber: number;
  readonly reason: "unsupported-pk";
}

export interface MilestoneSourceRow {
  readonly lineNumber: number;
  readonly label: string;
  readonly type: string;
  readonly latitude: string;
  readonly longitude: string;
}

export interface DuplicateMilestone {
  readonly id: string;
  readonly kept: MilestoneSourceRow;
  readonly discarded: MilestoneSourceRow;
}

export interface ParsedMilestones {
  readonly milestones: readonly Milestone[];
  readonly skipped: readonly SkippedMilestone[];
  readonly duplicates: readonly DuplicateMilestone[];
}

interface RailwaySectionBase {
  readonly code: string;
  readonly name: string;
  readonly rank: number;
}

export interface RailwaySectionWithGeometry extends RailwaySectionBase {
  readonly gaiaId: string;
  readonly hasGeometry: 1;
  readonly railwayType: string;
}

export interface RailwaySectionWithoutGeometry extends RailwaySectionBase {
  readonly gaiaId: null;
  readonly hasGeometry: 0;
  readonly railwayType: null;
}

export type RailwaySection =
  RailwaySectionWithGeometry | RailwaySectionWithoutGeometry;

export type GeoJsonPosition =
  readonly [number, number] | readonly [number, number, number];

export type RailwayGeometry =
  | Readonly<{
      type: "LineString";
      coordinates: readonly GeoJsonPosition[];
    }>
  | Readonly<{
      type: "MultiLineString";
      coordinates: readonly (readonly GeoJsonPosition[])[];
    }>;

export interface RailwayProperties {
  readonly code_ligne: string;
  readonly idgaia: string;
  readonly lib_ligne: string;
  readonly rg_troncon: number;
  readonly type_ligne: string;
}

export interface RailwayFeature {
  readonly geometry: RailwayGeometry;
  readonly id: string;
  readonly properties: RailwayProperties;
  readonly type: "Feature";
}

export interface RailwayFeatureCollection {
  readonly features: readonly RailwayFeature[];
  readonly type: "FeatureCollection";
}

export interface NormalizedRailwayData {
  readonly geojson: RailwayFeatureCollection;
  readonly sections: readonly RailwaySectionWithGeometry[];
}

export interface GenerationSummary {
  readonly duplicateMilestoneCount: number;
  readonly fallbackSectionCount: number;
  readonly geometryCount: number;
  readonly geometryWithoutMilestoneCount: number;
  readonly milestoneCount: number;
  readonly railwaySectionCount: number;
  readonly skippedMilestoneCount: number;
}

export interface StagingWorkspace {
  readonly directory: string;
  readonly rawGeojsonPath: string;
  readonly rawMilestonesPath: string;
  readonly stagedDatabasePath: string;
  readonly stagedGeojsonPath: string;
  readonly stagedImportReportPath: string;
  readonly targetDatabasePath: string;
  readonly targetGeojsonPath: string;
  readonly targetImportReportPath: string;
}

export interface SetupOptions {
  readonly databasePath?: string;
  readonly expectedSnapshot?: GenerationSummary | undefined;
  readonly fetchImplementation?: FetchImplementation;
  readonly geojsonPath?: string;
  readonly logger?: GenerationLogger;
  readonly resources?: RailwayResources;
}
