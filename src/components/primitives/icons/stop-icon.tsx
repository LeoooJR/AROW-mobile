import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

import type { IconProps } from "@/components/primitives/icons/icon-props";

export type StopIconProps = IconProps;

export default function StopIcon({ color }: StopIconProps): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path d="M6 6h12v12H6z" fill={color} />
    </Svg>
  );
}
