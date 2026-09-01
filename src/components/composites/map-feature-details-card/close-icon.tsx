import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

interface CloseIconProps {
  readonly color: string;
}

export default function CloseIcon({ color }: CloseIconProps): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}
