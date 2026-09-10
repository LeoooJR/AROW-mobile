import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

export interface PlayIconProps {
  readonly color: string;
}

export default function PlayIcon({ color }: PlayIconProps): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  );
}
