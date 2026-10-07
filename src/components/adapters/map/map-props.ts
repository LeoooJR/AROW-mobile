import type { MapLayerVisibility } from "@/components/adapters/map/map-layer-visibility";
import type { MapFeature } from "@/features/map-features/map-feature";
import type {
  GeographicCoordinates,
  GeographicCoordinatesWithHeading,
} from "@/types/geographic-coordinates";

export type MapLocation = GeographicCoordinatesWithHeading;

export interface MapProps {
  readonly focusLocation?: GeographicCoordinates;
  readonly focusRequest?: number;
  readonly layerVisibility?: MapLayerVisibility;
  readonly location?: MapLocation;
  readonly milestoneData?: string;
  readonly onFeaturePress?: (feature: MapFeature) => void;
  readonly onReady?: () => void;
  readonly onLoadError?: () => void;
  readonly railwayData?: string;
  readonly recenterRequest?: number;
  readonly selectedFeature?: MapFeature;
}
