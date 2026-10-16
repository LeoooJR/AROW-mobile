import { tv } from "tailwind-variants";

export const textFieldStyles = tv({
  base: "rounded-lg border border-border-subtle bg-surface text-text-primary",
  variants: {
    variant: {
      numeric: "h-[52px] px-2.5 font-mono text-[22px] font-bold",
      search: "h-12 px-3 text-base",
    },
  },
  defaultVariants: {
    variant: "search",
  },
});
