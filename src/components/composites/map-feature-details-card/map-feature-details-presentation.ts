import type { MapFeature } from "@/features/map-features/map-feature";
import formatMapFeatureCoordinates from "@/features/map-features/map-feature-coordinate-presentation";

export interface MapFeatureDetailsPresentation {
  readonly coordinates?: string;
  readonly eyebrow: string;
  readonly milestone: string;
  readonly title: string;
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
    coordinates: formatMapFeatureCoordinates(feature.coordinates),
    eyebrow: "Point kilométrique",
    milestone: feature.label,
    title: `PK ${feature.label}`,
  };
}
