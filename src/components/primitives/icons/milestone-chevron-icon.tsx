import Svg, { Path } from "react-native-svg";

export default function MilestoneChevronIcon({
  next,
  color,
}: {
  readonly next?: boolean;
  readonly color: string;
}) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <Path
        d={next ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
