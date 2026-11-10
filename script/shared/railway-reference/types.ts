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
