import { useState } from "react";
import { Text, useColorScheme, View } from "react-native";
import RailwayBoundaryIcon from "@/components/primitives/icons/railway-boundary-icon";
import Button from "@/components/primitives/button";
import type { RailwaySection } from "@shared/railway-domain/railway-section";
import type { RailwayMilestoneBounds } from "@shared/railway-domain/railway-milestone-bounds";
import MapFeatureDetailsFrame from "./map-feature-details-frame";
import MapFeatureDetailsFacts from "./map-feature-details-facts";

export interface RailwayDetailsCardProps {
  readonly bottomOffset?: number;
  readonly feature: RailwaySection;
  readonly onClose: () => void;
  readonly showSimulationAction?: boolean;
  readonly bounds?: RailwayMilestoneBounds;
  readonly loading?: boolean;
  readonly retryable?: boolean;
  readonly onFirst: () => void;
  readonly onLast: () => void;
}

function BoundaryButton({
  last,
  label,
  disabled,
  onPress,
}: {
  readonly last?: boolean;
  readonly label?: string;
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const color = useColorScheme() === "dark" ? "#FFFFFF" : "#0A0A0A";
  const icon = <RailwayBoundaryIcon last={last} color={color} />;
  return (
    <Button
      accessibilityLabel={
        label === undefined
          ? `${last ? "Dernier" : "Premier"} repère${disabled ? " indisponible" : ""}`
          : `Centrer la carte sur le ${last ? "dernier" : "premier"} repère, ${label}`
      }
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      className={`min-h-[48px] min-w-0 flex-1 flex-row gap-[6px] rounded-[8px] border bg-surface px-[10px] py-[8px] active:border-text-primary active:bg-surface-muted dark:bg-[#151515] dark:active:border-white dark:active:bg-[#292929] ${focused ? "border-primary" : "border-border-subtle dark:border-[#4D4D4D]"} ${disabled ? "opacity-40" : ""}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      testID={last ? "last-railway-milestone" : "first-railway-milestone"}
    >
      {last ? null : icon}
      <Text className="min-w-0 shrink text-center text-[12px] font-semibold leading-[17px] text-text-primary dark:text-white">
        {last ? "Dernier repère" : "Premier repère"}
      </Text>
      {last ? icon : null}
    </Button>
  );
}

export default function RailwayDetailsCard({
  feature,
  bounds,
  loading = false,
  retryable = false,
  onFirst,
  onLast,
  ...props
}: RailwayDetailsCardProps) {
  const geometry = feature.geometry;
  return (
    <MapFeatureDetailsFrame
      {...props}
      eyebrow={
        geometry.status === "present"
          ? geometry.railwayType
          : "Ligne ferroviaire"
      }
      footer={
        <View
          className="mt-[12px] flex-row gap-[8px] border-t border-border-subtle pt-[12px] dark:border-[#4D4D4D]"
          testID="railway-boundary-navigation"
          accessibilityLabel="Recentrer la carte sur les bornes de la section"
        >
          <BoundaryButton
            label={bounds?.first?.label}
            disabled={loading || (!retryable && bounds?.first === undefined)}
            onPress={onFirst}
          />
          <BoundaryButton
            last
            label={bounds?.last?.label}
            disabled={loading || (!retryable && bounds?.last === undefined)}
            onPress={onLast}
          />
        </View>
      }
      title={feature.name}
    >
      <MapFeatureDetailsFacts
        bottomPadding={false}
        lineCode={feature.lineCode}
        sectionRank={feature.sectionRank}
        milestone={
          geometry.status === "present"
            ? `${geometry.startMilestone} → ${geometry.endMilestone}`
            : "Non renseigné"
        }
      />
    </MapFeatureDetailsFrame>
  );
}
