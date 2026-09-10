import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

export interface LayersIconProps {
  readonly color: string;
}

export default function LayersIcon({ color }: LayersIconProps): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="M12 4l8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}
