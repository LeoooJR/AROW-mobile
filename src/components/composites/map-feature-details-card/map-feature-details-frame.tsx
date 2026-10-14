import { type ReactElement, type ReactNode } from "react";
import { useColorScheme, useWindowDimensions, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SIMULATION_ACTION_OCCUPIED_HEIGHT } from "@/components/composites/location-bar/simulation-action";
import MapFeatureDetailsHeader from "@/components/composites/map-feature-details-card/map-feature-details-header";
import { MAP_FEATURE_DETAILS_PALETTES } from "@/components/composites/map-feature-details-card/map-feature-details-theme";
import Card from "@/components/primitives/card";
import { resolveColorTheme } from "@/utils/color-theme";

export interface MapFeatureDetailsFrameProps {
  readonly footer?: ReactNode;
  readonly bottomOffset?: number;
  readonly children: ReactNode;
  readonly eyebrow: string;
  readonly title: string;
  readonly onClose: () => void;
  readonly showSimulationAction?: boolean;
}

export default function MapFeatureDetailsFrame({
  footer,
  bottomOffset,
  children,
  eyebrow,
  title,
  onClose,
  showSimulationAction = false,
}: MapFeatureDetailsFrameProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const palette = MAP_FEATURE_DETAILS_PALETTES[resolveColorTheme(colorScheme)];
  const { height } = useWindowDimensions();
  const bottom =
    bottomOffset ??
    86 +
      Math.max(10, insets.bottom) +
      (showSimulationAction ? SIMULATION_ACTION_OCCUPIED_HEIGHT : 0);

  return (
    <Card
      accessibilityLiveRegion="polite"
      className="absolute inset-x-[16px] z-10 gap-0 rounded-[8px] border-border-subtle bg-surface-elevated px-[14px] pb-[12px] pt-[14px] shadow-none dark:border-[#4D4D4D] dark:bg-[#0A0A0A]"
      size="sm"
      style={{
        borderCurve: "continuous",
        bottom,
        maxHeight: Math.max(96, height - bottom - insets.top - 96),
        boxShadow: palette.shadow,
      }}
      testID="map-feature-details-card"
    >
      <MapFeatureDetailsHeader
        eyebrow={eyebrow}
        iconColor={palette.icon}
        onClose={onClose}
        title={title}
      />
      <ScrollView
        className="grow-0 shrink"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer}
    </Card>
  );
}
