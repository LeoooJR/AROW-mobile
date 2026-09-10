"use client";

import React from "react";
import { Pressable } from "react-native";

import Button, { type ButtonProps } from "@/components/primitives/button";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  readonly size?: "control" | "toolbar";
}

const IconButton = React.forwardRef<
  React.ComponentRef<typeof Pressable>,
  IconButtonProps
>(function IconButton({ className, size = "control", ...props }, ref) {
  return (
    <Button
      className={`${size === "toolbar" ? "w-14" : "w-12"} ${className ?? ""}`}
      ref={ref}
      size={size}
      {...props}
    />
  );
});

IconButton.displayName = "IconButton";

export default IconButton;
