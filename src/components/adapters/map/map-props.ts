import type { MapLayerVisibility } from "@/components/adapters/map/layer-visibility";
import type { MapFeature } from "@/types/map-feature";
import type { MapViewport } from "@/types/map-viewport";
import type { Milestone } from "@shared/railway-domain/milestone";
import type {
  GeographicCoordinates,
  GeographicCoordinatesWithHeading,
} from "@shared/geographic-coordinates";

export type MapLocation = GeographicCoordinatesWithHeading;

export interface MapProps {
  readonly focusLocation?: GeographicCoordinates;
  readonly focusRequest?: number;
  readonly layerVisibility?: MapLayerVisibility;
  readonly location?: MapLocation;
  readonly milestoneData?: string | readonly Milestone[];
  readonly onViewportChange?: (viewport: MapViewport) => void;
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly onReady?: () => void;
  readonly onLoadError?: () => void;
  readonly railwayData?: string;
  readonly recenterRequest?: number;
  readonly selectedFeature?: MapFeature;
}
