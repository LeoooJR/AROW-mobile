"use client";

import React from "react";
import { Platform, View } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const dividerStyle = tv({
  base: "bg-border",
  variants: {
    orientation: {
      horizontal: "h-px w-auto",
      vertical: "h-full w-px",
    },
  },
});

export type DividerProps = React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof dividerStyle>;

const Divider = React.forwardRef<React.ComponentRef<typeof View>, DividerProps>(
  function Divider({ className, orientation = "horizontal", ...props }, ref) {
    return (
      <View
        aria-orientation={orientation}
        className={dividerStyle({
          className,
          orientation,
        })}
        ref={ref}
        role={Platform.OS === "web" ? "separator" : undefined}
        {...props}
      />
    );
  },
);

Divider.displayName = "Divider";

export default Divider;
