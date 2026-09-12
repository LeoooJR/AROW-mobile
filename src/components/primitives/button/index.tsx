"use client";

import React from "react";
import { Pressable } from "react-native";
import type { VariantProps } from "tailwind-variants";

import { buttonStyles } from "@/components/primitives/button/styles";

type ButtonVariants = VariantProps<typeof buttonStyles>;

export type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  ButtonVariants & {
    readonly className?: string;
  };

const Button = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  ButtonProps
>(function Button({ className, size, variant, ...props }, ref) {
  return (
    <Pressable
      className={buttonStyles({ className, size, variant })}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export default Button;
