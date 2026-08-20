import { type ReactElement } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import Card from "@/components/adapters/card";
import Divider from "@/components/adapters/divider";
import type { RailwayLineMetadata } from "@/types/railway-line";

export interface RailwayDetailsCardProps {
  readonly onClose: () => void;
  readonly railway: RailwayLineMetadata;
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

export default function RailwayDetailsCard({
  onClose,
  railway,
}: RailwayDetailsCardProps): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === "dark";

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
      testID="railway-details-card"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text
            className="font-mono text-[11px] font-bold uppercase leading-[14px] tracking-[0.88px] text-text-primary"
            selectable
          >
            {railway.type}
          </Text>
          <Text
            className="text-lg font-semibold leading-[23px] text-text-primary"
            selectable
          >
            {railway.name}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Fermer les informations de la ligne"
          accessibilityRole="button"
          className="-mr-2.5 -mt-2.5 size-12 items-center justify-center rounded-lg bg-transparent active:bg-surface-muted"
          hitSlop={4}
          onPress={onClose}
          testID="close-railway-details"
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
        <Fact label="Code ligne" value={railway.codeLigne} />
      </View>
      <Divider className="bg-border-subtle" />
      <View className="flex-row py-2.5">
        <Fact label="Tronçon" value={String(railway.rangTroncon)} />
        <Divider
          className="mx-3 h-auto self-stretch bg-border-subtle"
          orientation="vertical"
        />
        <Fact label="Repères" value={`${railway.pkDebut} → ${railway.pkFin}`} />
      </View>
    </Card>
  );
}
