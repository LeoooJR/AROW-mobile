import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

export interface FocusIconProps {
  readonly color: string;
}

export default function FocusIcon({ color }: FocusIconProps): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="M9 4H4v5M15 4h5v5M9 20H4v-5m11 5h5v-5"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}
