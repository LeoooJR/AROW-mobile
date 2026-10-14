import Svg, { Path } from "react-native-svg";

export interface RailwayBoundaryIconProps {
  readonly last?: boolean;
  readonly color: string;
}
export default function RailwayBoundaryIcon({
  last,
  color,
}: RailwayBoundaryIconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <Path
        d={last ? "M18 5v14M6 12h9m-4-4 4 4-4 4" : "M6 5v14m12-7H9m4-4-4 4 4 4"}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
