"use client";

import { createToastHook } from "@gluestack-ui/core/toast/creator";
import { forwardRef, type ComponentRef, type ReactElement } from "react";
import { Text, type TextProps, View, type ViewProps } from "react-native";

export type ToastAction = "error" | "info" | "muted" | "success" | "warning";
export type ToastVariant = "outline" | "solid";

export interface ToastProps extends ViewProps {
  readonly action?: ToastAction;
  readonly className?: string;
  readonly variant?: ToastVariant;
}

export interface ToastDescriptionProps extends TextProps {
  readonly className?: string;
}

export interface ToastTitleProps extends TextProps {
  readonly className?: string;
}

const toastActionClassNames = {
  error: "bg-popover",
  info: "bg-popover",
  muted: "bg-popover",
  success: "bg-popover",
  warning: "bg-popover",
} as const satisfies Record<ToastAction, string>;

const toastVariantClassNames = {
  outline: "border border-border",
  solid: "border border-border bg-popover",
} as const satisfies Record<ToastVariant, string>;

export const useToast = createToastHook(View);

export const Toast = forwardRef<ComponentRef<typeof View>, ToastProps>(
  function Toast(
    { action = "muted", className, variant = "solid", ...props }: ToastProps,
    ref,
  ): ReactElement {
    return (
      <View
        {...props}
        ref={ref}
        className={
          className ??
          `gap-1 rounded-md p-4 ${toastVariantClassNames[variant]} ${toastActionClassNames[action]}`
        }
      />
    );
  },
);

export const ToastTitle = forwardRef<
  ComponentRef<typeof Text>,
  ToastTitleProps
>(function ToastTitle(
  { className, ...props }: ToastTitleProps,
  ref,
): ReactElement {
  return (
    <Text
      {...props}
      ref={ref}
      className={className ?? "text-base font-medium text-popover-foreground"}
    />
  );
});

export const ToastDescription = forwardRef<
  ComponentRef<typeof Text>,
  ToastDescriptionProps
>(function ToastDescription(
  { className, ...props }: ToastDescriptionProps,
  ref,
): ReactElement {
  return (
    <Text
      {...props}
      ref={ref}
      className={className ?? "text-base text-muted-foreground"}
    />
  );
});

Toast.displayName = "Toast";
ToastTitle.displayName = "ToastTitle";
ToastDescription.displayName = "ToastDescription";
