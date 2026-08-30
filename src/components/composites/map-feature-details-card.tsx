import { type ReactElement } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import Card from "@/components/primitives/card";
import Divider from "@/components/primitives/divider";
import type { MapFeature } from "@/features/map-features/map-feature";
import type { GeographicCoordinates } from "@/types/geographic-coordinates";

export interface MapFeatureDetailsCardProps {
  readonly feature: MapFeature;
  readonly onClose: () => void;
}

const ICON_COLORS = {
  dark: "#FAF9F6",
  light: "#0A0A0A",
} as const;

function Fact({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): ReactElement {
  return (
    <View className="min-w-0 flex-1 gap-[3px]">
      <Text className="text-[11px] leading-[15px] text-text-muted">
        {label}
      </Text>
      <Text
        className="font-mono text-xs font-semibold leading-[17px] text-text-primary"
        selectable
      >
        {value}
      </Text>
    </View>
  );
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

export default function MapFeatureDetailsCard({
  feature,
  onClose,
}: MapFeatureDetailsCardProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";
  const eyebrow =
    feature.kind === "railway" ? feature.railwayType : "Point kilométrique";
  const title =
    feature.kind === "railway" ? feature.name : `PK ${feature.label}`;
  const milestone =
    feature.kind === "railway"
      ? `${feature.startMilestone} → ${feature.endMilestone}`
      : feature.label;

  return (
    <Card
      accessibilityLiveRegion="polite"
      className="absolute inset-x-4 z-10 gap-0 rounded-lg border-border-subtle bg-surface-elevated p-[14px] shadow-none"
      size="sm"
      style={{
        borderCurve: "continuous",
        bottom: 86 + Math.max(10, insets.bottom),
        boxShadow: isDark
          ? "0 6px 18px rgba(0, 0, 0, 0.28)"
          : "0 6px 18px rgba(10, 10, 10, 0.12)",
      }}
      testID="map-feature-details-card"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="font-mono text-[11px] font-bold uppercase leading-[14px] tracking-[0.88px] text-text-primary"
            selectable
          >
            {eyebrow}
          </Text>
          <Text
            className="text-lg font-semibold leading-[23px] text-text-primary"
            selectable
          >
            {title}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Fermer les informations de l’élément cartographique"
          accessibilityRole="button"
          className="-mr-2.5 -mt-2.5 size-12 items-center justify-center rounded-lg bg-transparent active:bg-surface-muted"
          hitSlop={4}
          onPress={onClose}
          testID="close-map-feature-details"
        >
          <Svg height={22} viewBox="0 0 24 24" width={22}>
            <Path
              d="m7 7 10 10M17 7 7 17"
              fill="none"
              stroke={isDark ? ICON_COLORS.dark : ICON_COLORS.light}
              strokeLinecap="round"
              strokeWidth={2}
            />
          </Svg>
        </Pressable>
      </View>

      <Divider className="mt-3 bg-border-subtle" />
      <View className="py-2.5">
        <Fact label="Code ligne" value={feature.lineCode} />
      </View>
      <Divider className="bg-border-subtle" />
      <View className="flex-row py-2.5">
        <Fact label="Section" value={String(feature.sectionRank)} />
        <Divider
          className="mx-3 h-auto self-stretch bg-border-subtle"
          orientation="vertical"
        />
        <Fact label="Repère" value={milestone} />
      </View>
      {feature.kind === "milestone" ? (
        <>
          <Divider className="bg-border-subtle" />
          <View className="pt-2.5">
            <Fact
              label="Coordonnées"
              value={formatCoordinates(feature.coordinates)}
            />
          </View>
        </>
      ) : null}
    </Card>
  );
}
