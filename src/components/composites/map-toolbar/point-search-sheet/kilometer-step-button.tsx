import { useColorScheme } from "react-native";
import PlusMinusIcon from "@/components/primitives/icons/plus-minus-icon";
import IconButton from "@/components/primitives/icon-button";

export interface KilometerStepButtonProps {
  readonly increase?: boolean;
  readonly disabled: boolean;
  readonly onPress: () => void;
}

export default function KilometerStepButton({
  increase = false,
  disabled,
  onPress,
}: KilometerStepButtonProps) {
  const color = useColorScheme() === "dark" ? "#FAF9F6" : "#0A0A0A";
  return (
    <IconButton
      accessibilityLabel={
        increase ? "Augmenter d’un kilomètre" : "Diminuer d’un kilomètre"
      }
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      className={`shrink-0 border border-border-subtle focus:border-primary active:border-text-primary ${disabled ? "opacity-40" : ""}`}
      onPress={onPress}
      testID={increase ? "kilometer-increase" : "kilometer-decrease"}
    >
      <PlusMinusIcon plus={increase} color={color} />
    </IconButton>
  );
}
