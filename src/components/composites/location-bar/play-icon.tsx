import { type ReactElement } from "react";
import Svg, { Path } from "react-native-svg";

export default function PlayIcon({
  color,
}: {
  readonly color: string;
}): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path d="M8 5v14l11-7z" fill={color} />
    </Svg>
  );
}
