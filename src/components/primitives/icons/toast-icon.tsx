import Svg, { Path } from "react-native-svg";

import type { IconProps } from "@/components/primitives/icons/icon-props";

export type ToastIconKind = "info" | "success" | "warning" | "error" | "close";

export interface ToastIconProps extends IconProps {
  readonly kind: ToastIconKind;
}

const paths = {
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7v1",
  success: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m-4 9 3 3 5-6",
  warning: "m12 3 10 18H2L12 3Zm0 6v5m0 3v1",
  error: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v6m0 3v1",
  close: "m6 6 12 12M18 6 6 18",
} as const;

export default function ToastIcon({ kind, color }: ToastIconProps) {
  const size = kind === "close" ? 18 : 20;
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path d={paths[kind]} fill="none" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}
