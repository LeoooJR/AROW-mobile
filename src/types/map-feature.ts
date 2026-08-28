export interface GeographicCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface RailwaySectionKey {
  readonly lineCode: string;
  readonly sectionRank: number;
}

export interface RailwayFeature extends RailwaySectionKey {
  readonly endMilestone: string;
  readonly gaiaId: string;
  readonly kind: "railway";
  readonly name: string;
  readonly railwayType: string;
  readonly startMilestone: string;
}

export interface MilestoneFeature extends RailwaySectionKey {
  readonly coordinates: GeographicCoordinates;
  readonly kilometer: number;
  readonly kind: "milestone";
  readonly label: string;
}

export type MapFeature = RailwayFeature | MilestoneFeature;
