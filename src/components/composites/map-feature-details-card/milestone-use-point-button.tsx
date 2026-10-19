import { useState } from "react";
import { Text, useColorScheme } from "react-native";
import Button from "@/components/primitives/button";

export interface MilestoneUsePointButtonProps {
  readonly disabled: boolean;
  readonly onPress: () => void;
}

export default function MilestoneUsePointButton({
  disabled,
  onPress,
}: MilestoneUsePointButtonProps) {
  const [focused, setFocused] = useState(false);
  const dark = useColorScheme() === "dark";
  const foreground = dark ? "#FFFFFF" : "#0A0A0A";
  const background = dark ? "#0A0A0A" : "#FFFFFF";
  return (
    <Button
      accessibilityLabel="Utiliser ce point"
      accessibilityHint="Sélectionne ce repère pour préparer la simulation."
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="min-h-[52px] w-full rounded-[8px] border border-transparent bg-[#0A0A0A] px-4 py-3 active:border-[#0A0A0A] active:bg-surface dark:bg-white dark:active:border-white dark:active:bg-[#151515]"
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={{
        opacity: disabled ? 0.58 : 1,
        outlineColor: foreground,
        outlineOffset: 2,
        outlineStyle: "solid",
        outlineWidth: focused && !disabled ? 3 : 0,
      }}
      testID="use-map-milestone"
    >
      {({ pressed }) => (
        <Text
          className="text-center text-[14px] font-bold leading-[20px]"
          style={{ color: pressed && !disabled ? foreground : background }}
        >
          Utiliser ce point
        </Text>
      )}
    </Button>
  );
}
