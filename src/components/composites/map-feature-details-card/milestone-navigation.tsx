import { useState } from "react";
import { Text, useColorScheme, View } from "react-native";
import MilestoneChevronIcon from "@/components/primitives/icons/milestone-chevron-icon";
import Button from "@/components/primitives/button";
import type { MilestoneNeighbours } from "@shared/railway-domain/milestone-neighbours";

export interface MilestoneNavigationProps {
  readonly neighbours?: MilestoneNeighbours;
  readonly loading?: boolean;
  readonly retryable?: boolean;
  readonly onPrevious?: () => void;
  readonly onNext?: () => void;
}

function NavigationButton({
  next,
  label,
  disabled,
  onPress,
}: {
  readonly next?: boolean;
  readonly label?: string;
  readonly disabled: boolean;
  readonly onPress?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const color = useColorScheme() === "dark" ? "#FFFFFF" : "#0A0A0A";
  const direction = next ? "suivant" : "précédent";
  const icon = <MilestoneChevronIcon next={next} color={color} />;
  return (
    <Button
      accessibilityLabel={`Afficher le point kilométrique ${direction}${label === undefined ? "" : `, ${label}`}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={disabled ? { opacity: 0.58 } : undefined}
      className={`min-h-[48px] min-w-0 flex-1 flex-row gap-[6px] rounded-[8px] border bg-surface px-[10px] py-[8px] active:border-text-primary active:bg-surface-muted dark:bg-[#151515] dark:active:border-white dark:active:bg-[#292929] ${focused ? "border-primary" : "border-border-subtle dark:border-[#4D4D4D]"}`}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      testID={next ? "next-milestone" : "previous-milestone"}
    >
      {next ? null : icon}
      <Text className="min-w-0 shrink text-center text-[12px] font-semibold leading-[17px] text-text-primary dark:text-white">
        {next ? "Suivant" : "Précédent"}
      </Text>
      {next ? icon : null}
    </Button>
  );
}

export default function MilestoneNavigation({
  neighbours,
  loading = false,
  retryable = false,
  onPrevious,
  onNext,
}: MilestoneNavigationProps) {
  return (
    <View
      className="mt-[12px] flex-row items-center gap-[8px] border-t border-border-subtle pt-[12px] dark:border-[#4D4D4D]"
      testID="milestone-navigation"
      accessibilityLabel="Parcourir les points kilométriques"
    >
      <NavigationButton
        label={neighbours?.previous?.label}
        disabled={loading || (!retryable && neighbours?.previous === undefined)}
        onPress={onPrevious}
      />
      <Text
        testID="milestone-nav-position"
        className="min-w-[44px] font-mono text-center text-[11px] font-semibold leading-[15.4px] text-text-primary dark:text-white"
      >
        {!loading && !retryable && neighbours !== undefined
          ? `${neighbours.positionInSection} sur ${neighbours.total}`
          : "—"}
      </Text>
      <NavigationButton
        next
        label={neighbours?.next?.label}
        disabled={loading || (!retryable && neighbours?.next === undefined)}
        onPress={onNext}
      />
    </View>
  );
}
