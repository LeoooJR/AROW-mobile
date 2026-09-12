import { tv } from "tailwind-variants";

export const buttonStyles = tv({
  base: "will-change-pressable items-center justify-center rounded-lg",
  variants: {
    size: {
      content: "",
      control: "h-12",
      form: "h-[52px]",
      toolbar: "h-14",
    },
    variant: {
      accent: "border-2 border-text-primary bg-primary active:bg-text-primary",
      foreground: "bg-text-primary active:bg-surface-muted",
      ghost: "bg-transparent active:bg-surface-muted",
      selectable:
        "border border-border-subtle bg-surface active:bg-surface-muted",
      surface: "border border-border-subtle bg-canvas active:bg-surface-muted",
    },
  },
  defaultVariants: {
    size: "content",
    variant: "ghost",
  },
});
