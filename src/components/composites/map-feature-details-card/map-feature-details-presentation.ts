import type { MapFeature } from "@/features/map-features/map-feature";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export interface MapFeatureDetailsPresentation {
  readonly coordinates?: string;
  readonly eyebrow: string;
  readonly milestone: string;
  readonly title: string;
}

function formatCoordinate(
  value: number,
  positiveDirection: "E" | "N",
  negativeDirection: "S" | "W",
): string {
  const direction = value >= 0 ? positiveDirection : negativeDirection;
  return `${Math.abs(value).toFixed(5)} ${direction}`;
}

function formatCoordinates(coordinates: GeographicCoordinates): string {
  return `${formatCoordinate(coordinates.latitude, "N", "S")} · ${formatCoordinate(coordinates.longitude, "E", "W")}`;
}

export default function getMapFeatureDetailsPresentation(
  feature: MapFeature,
): MapFeatureDetailsPresentation {
  if (feature.kind === "railway") {
    if (feature.geometry.status === "absent") {
      return {
        eyebrow: "Ligne ferroviaire",
        milestone: "Non renseigné",
        title: feature.name,
      };
    }
    return {
      eyebrow: feature.geometry.railwayType,
      milestone: `${feature.geometry.startMilestone} → ${feature.geometry.endMilestone}`,
      title: feature.name,
    };
  }

  return {
    coordinates: formatCoordinates(feature.coordinates),
    eyebrow: "Point kilométrique",
    milestone: feature.label,
    title: `PK ${feature.label}`,
  };
}
