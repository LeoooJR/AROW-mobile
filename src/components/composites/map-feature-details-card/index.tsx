import { type ReactElement } from "react";
import { useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SIMULATION_ACTION_OCCUPIED_HEIGHT } from "@/components/composites/location-bar/simulation-action";
import MapFeatureDetailsFact from "@/components/composites/map-feature-details-card/map-feature-details-fact";
import MapFeatureDetailsHeader from "@/components/composites/map-feature-details-card/map-feature-details-header";
import getMapFeatureDetailsPresentation from "@/components/composites/map-feature-details-card/map-feature-details-presentation";
import {
  MAP_FEATURE_DETAILS_PALETTES,
  mapFeatureDetailsTheme,
} from "@/components/composites/map-feature-details-card/map-feature-details-theme";
import Card from "@/components/primitives/card";
import Divider from "@/components/primitives/divider";
import type { MapFeature } from "@/features/map-features/map-feature";

export interface MapFeatureDetailsCardProps {
  readonly feature: MapFeature;
  readonly onClose: () => void;
  readonly showSimulationAction?: boolean;
}

export default function MapFeatureDetailsCard({
  feature,
  onClose,
  showSimulationAction = false,
}: MapFeatureDetailsCardProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const palette =
    MAP_FEATURE_DETAILS_PALETTES[mapFeatureDetailsTheme(colorScheme)];
  const presentation = getMapFeatureDetailsPresentation(feature);

  return (
    <Card
      accessibilityLiveRegion="polite"
      className="absolute inset-x-4 z-10 gap-0 rounded-lg border-border-subtle bg-surface-elevated p-[14px] shadow-none"
      size="sm"
      style={{
        borderCurve: "continuous",
        bottom:
          86 +
          Math.max(10, insets.bottom) +
          (showSimulationAction ? SIMULATION_ACTION_OCCUPIED_HEIGHT : 0),
        boxShadow: palette.shadow,
      }}
      testID="map-feature-details-card"
    >
      <MapFeatureDetailsHeader
        eyebrow={presentation.eyebrow}
        iconColor={palette.icon}
        onClose={onClose}
        title={presentation.title}
      />

      <Divider className="mt-3 bg-border-subtle" />
      <View className="py-2.5">
        <MapFeatureDetailsFact label="Code ligne" value={feature.lineCode} />
      </View>
      <Divider className="bg-border-subtle" />
      <View className="flex-row py-2.5">
        <MapFeatureDetailsFact
          label="Section"
          value={String(feature.sectionRank)}
        />
        <Divider
          className="mx-3 h-auto self-stretch bg-border-subtle"
          orientation="vertical"
        />
        <MapFeatureDetailsFact label="Repère" value={presentation.milestone} />
      </View>
      {presentation.coordinates === undefined ? null : (
        <>
          <Divider className="bg-border-subtle" />
          <View className="pt-2.5">
            <MapFeatureDetailsFact
              label="Coordonnées"
              value={presentation.coordinates}
            />
          </View>
        </>
      )}
    </Card>
  );
}
