import { View } from "react-native";
import type { Milestone } from "@shared/railway-domain/milestone";
import Divider from "@/components/primitives/divider";
import { formatGeographicCoordinates } from "@/utils/location-format";
import MapFeatureDetailsFrame from "./map-feature-details-frame";
import MapFeatureDetailsFacts from "./map-feature-details-facts";
import MapFeatureDetailsFact from "./map-feature-details-fact";
import MilestoneNavigation, {
  type MilestoneNavigationProps,
} from "./milestone-navigation";

export interface MilestoneDetailsCardProps extends MilestoneNavigationProps {
  readonly bottomOffset?: number;
  readonly feature: Milestone;
  readonly onClose: () => void;
  readonly showSimulationAction?: boolean;
}

export default function MilestoneDetailsCard({
  feature,
  neighbours,
  loading,
  retryable,
  onPrevious,
  onNext,
  ...props
}: MilestoneDetailsCardProps) {
  return (
    <MapFeatureDetailsFrame
      {...props}
      eyebrow="Point kilométrique"
      title={`PK ${feature.label}`}
      footer={
        <MilestoneNavigation
          neighbours={neighbours}
          loading={loading}
          retryable={retryable}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      }
    >
      <MapFeatureDetailsFacts
        lineCode={feature.lineCode}
        sectionRank={feature.sectionRank}
        milestone={feature.label}
      />
      <Divider className="bg-border-subtle dark:bg-[#4D4D4D]" />
      <View className="pt-[10px]">
        <MapFeatureDetailsFact
          label="Coordonnées"
          value={formatGeographicCoordinates(feature.coordinates, "W")}
        />
      </View>
    </MapFeatureDetailsFrame>
  );
}
