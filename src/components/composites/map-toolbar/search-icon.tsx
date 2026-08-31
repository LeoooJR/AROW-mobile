import { type ReactElement } from "react";
import Svg, { Circle, Path } from "react-native-svg";

export default function SearchIcon({
  color,
}: {
  readonly color: string;
}): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Circle
        cx={11}
        cy={11}
        fill="none"
        r={6}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M16 16l4 4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}
