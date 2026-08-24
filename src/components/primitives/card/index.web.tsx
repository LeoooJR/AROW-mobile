import React from "react";
import type { VariantProps } from "tailwind-variants";

import { cardStyle } from "./styles";

export type CardProps = React.ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof cardStyle> & {
    className?: string;
    size?: "default" | "sm";
  };

const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, size = "default", ...props },
  ref,
) {
  return (
    <div className={cardStyle({ className, size })} ref={ref} {...props} />
  );
});

Card.displayName = "Card";

export default Card;
