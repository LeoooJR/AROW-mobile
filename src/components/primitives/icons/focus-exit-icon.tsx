import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

export interface FocusExitIconProps {
  readonly color: string;
}

export default function FocusExitIcon({
  color,
}: FocusExitIconProps): ReactElement {
  return (
    <Svg height={22} testID="focus-exit-icon" viewBox="0 0 24 24" width={22}>
      <Path
        d="M9 9H4V4m11 5h5V4M9 15H4v5m11-5h5v5"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}
