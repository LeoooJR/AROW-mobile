import type { MapFeature } from "@/features/map-features/map-feature";
import { formatGeographicCoordinates } from "@/utils/location-format";

export interface MapFeatureDetailsPresentation {
  readonly coordinates?: string;
  readonly eyebrow: string;
  readonly milestone: string;
  readonly title: string;
}

export default function getMapFeatureDetailsPresentation(
  feature: MapFeature,
): MapFeatureDetailsPresentation {
  if (feature.kind === "railway-section") {
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
    coordinates: formatGeographicCoordinates(feature.coordinates, "W"),
    eyebrow: "Point kilométrique",
    milestone: feature.label,
    title: `PK ${feature.label}`,
  };
}
