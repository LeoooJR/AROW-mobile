"use client";

import React from "react";
import { Pressable, View } from "react-native";

export interface SwitchProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Pressable>,
  "aria-checked" | "children" | "onPress" | "role"
> {
  readonly accessibilityLabel: string;
  readonly checked: boolean;
  readonly className?: string;
  readonly onValueChange: (checked: boolean) => void;
}

const Switch = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  SwitchProps
>(function Switch(
  {
    accessibilityLabel,
    checked,
    className,
    disabled = false,
    onValueChange,
    ...props
  },
  ref,
) {
  const isDisabled = disabled === true;

  return (
    <Pressable
      aria-checked={checked}
      aria-disabled={isDisabled}
      aria-label={accessibilityLabel}
      className={`will-change-pressable size-12 items-center justify-center rounded-lg bg-transparent active:bg-surface-muted ${className ?? ""}`}
      disabled={isDisabled}
      onPress={() => {
        onValueChange(!checked);
      }}
      ref={ref}
      role="switch"
      {...props}
    >
      <View
        className={`h-7 w-12 justify-center rounded-full border ${checked ? "border-text-primary bg-success" : "border-border-subtle bg-surface-muted"}`}
      >
        <View
          className="size-5 rounded-full border border-text-primary bg-canvas"
          style={{ transform: [{ translateX: checked ? 20 : 3 }] }}
        />
      </View>
    </Pressable>
  );
});

Switch.displayName = "Switch";

export default Switch;
