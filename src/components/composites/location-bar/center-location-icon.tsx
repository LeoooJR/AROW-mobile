import { type ReactElement } from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface CenterLocationIconProps {
  readonly color: string;
}

export default function CenterLocationIcon({
  color,
}: CenterLocationIconProps): ReactElement {
  return (
    <Svg height={18} viewBox="0 0 24 24" width={18}>
      <Circle
        cx={12}
        cy={12}
        fill="none"
        r={4}
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M12 2v3m0 14v3M2 12h3m14 0h3"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}
