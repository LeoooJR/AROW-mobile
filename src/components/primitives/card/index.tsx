"use client";

import React from "react";
import { View } from "react-native";
import type { VariantProps } from "tailwind-variants";

import { cardStyle } from "./styles";

export type CardProps = React.ComponentPropsWithoutRef<typeof View> &
  VariantProps<typeof cardStyle> & {
    className?: string;
    size?: "default" | "sm";
  };

const Card = React.forwardRef<React.ComponentRef<typeof View>, CardProps>(
  function Card({ className, size = "default", ...props }, ref) {
    return (
      <View className={cardStyle({ className, size })} ref={ref} {...props} />
    );
  },
);

Card.displayName = "Card";

export default Card;
