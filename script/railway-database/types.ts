export type FetchImplementation = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface GenerationLogger {
  log(message: string): void;
  warn(message: string): void;
}

interface RailwayResourceMetadata {
  readonly name: string;
  readonly sha256: string;
}

type RailwayResourceLocation =
  | { readonly fileId: string; readonly url?: never }
  | { readonly fileId?: never; readonly url: string };

export type RailwayResource = Readonly<
  RailwayResourceMetadata & RailwayResourceLocation
>;

export interface RailwayResources {
  readonly geojson: RailwayResource;
  readonly milestoneGeojson: RailwayResource;
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
}

export interface ParsedMilestones {
  readonly milestones: readonly Milestone[];
  readonly skipped: readonly SkippedMilestone[];
}

interface RailwaySectionBase {
  readonly code: string;
  readonly name: string;
  readonly rank: number;
}

export interface RailwaySectionWithGeometry extends RailwaySectionBase {
  readonly endMilestone: string;
  readonly gaiaId: string;
  readonly hasGeometry: 1;
  readonly railwayType: string;
  readonly startMilestone: string;
}

export interface RailwaySectionWithoutGeometry extends RailwaySectionBase {
  readonly endMilestone: null;
  readonly gaiaId: null;
  readonly hasGeometry: 0;
  readonly railwayType: null;
  readonly startMilestone: null;
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
  readonly pkd: string;
  readonly pkf: string;
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

export interface MilestoneGeoJsonProperties {
  readonly label: string;
  readonly lineCode: string;
  readonly positionMeters: number;
  readonly sectionRank: number;
}

export interface MilestoneGeoJsonFeature {
  readonly geometry: {
    readonly coordinates: readonly [number, number];
    readonly type: "Point";
  };
  readonly id: string;
  readonly properties: MilestoneGeoJsonProperties;
  readonly type: "Feature";
}

export interface MilestoneFeatureCollection {
  readonly features: readonly MilestoneGeoJsonFeature[];
  readonly type: "FeatureCollection";
}

export interface NormalizedRailwayData {
  readonly geojson: RailwayFeatureCollection;
  readonly sections: readonly RailwaySectionWithGeometry[];
}

export interface GenerationSummary {
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
  readonly stagedMilestoneGeojsonPath: string;
  readonly targetDatabasePath: string;
  readonly targetGeojsonPath: string;
  readonly targetMilestoneGeojsonPath: string;
}

export interface SetupOptions {
  readonly databasePath?: string;
  readonly expectedSnapshot?: GenerationSummary | undefined;
  readonly fetchImplementation?: FetchImplementation;
  readonly geojsonPath?: string;
  readonly logger?: GenerationLogger;
  readonly milestoneGeojsonPath?: string;
  readonly resources?: RailwayResources;
}
