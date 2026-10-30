import Svg, { Path } from "react-native-svg";

export interface ExpandCollapseIconProps {
  readonly expanded: boolean;
  readonly color: string;
}

export default function ExpandCollapseIcon({
  expanded,
  color,
}: ExpandCollapseIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <Path
        d={expanded ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
