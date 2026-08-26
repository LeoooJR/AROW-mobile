import { Platform } from "react-native";
import { tv } from "tailwind-variants";

const baseStyle = Platform.OS === "web" ? "relative z-0 flex flex-col" : "";

export const cardStyle = tv({
  base: `${baseStyle} flex-col rounded-xl border border-border bg-card shadow-sm`,
  variants: {
    size: {
      default: "gap-6 p-4",
      sm: "gap-3 p-3",
    },
  },
  defaultVariants: {
    size: "default",
  },
});
