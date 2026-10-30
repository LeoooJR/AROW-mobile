import Svg, { Path } from "react-native-svg";

export interface PlusMinusIconProps {
  readonly plus?: boolean;
  readonly color: string;
}

export default function PlusMinusIcon({
  plus = false,
  color,
}: PlusMinusIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <Path
        d={plus ? "M5 12h14M12 5v14" : "M5 12h14"}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
