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
  error: "bg-[#0A0A0A] dark:bg-white",
  info: "bg-[#0A0A0A] dark:bg-white",
  muted: "bg-[#0A0A0A] dark:bg-white",
  success: "bg-[#0A0A0A] dark:bg-white",
  warning: "bg-[#0A0A0A] dark:bg-white",
} as const satisfies Record<ToastAction, string>;

const toastVariantClassNames = {
  outline: "border border-[#0A0A0A] dark:border-white",
  solid: "border border-[#0A0A0A] dark:border-white",
} as const satisfies Record<ToastVariant, string>;

export const useToast = createToastHook(View);

export const Toast = forwardRef<ComponentRef<typeof View>, ToastProps>(
  function Toast(
    { action = "muted", className, variant = "solid", ...props }: ToastProps,
    ref,
  ): ReactElement {
    return (
      <View
        pointerEvents="auto"
        {...props}
        ref={ref}
        className={
          className ??
          `gap-[10px] rounded-[8px] p-[12px] ${toastVariantClassNames[variant]} ${toastActionClassNames[action]}`
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
      className={
        className ??
        "mb-[2px] text-[11px] font-bold leading-[16.5px] text-white dark:text-[#0A0A0A]"
      }
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
      className={
        className ??
        "text-[13px] leading-[19.5px] text-white dark:text-[#0A0A0A]"
      }
    />
  );
});

Toast.displayName = "Toast";
ToastTitle.displayName = "ToastTitle";
ToastDescription.displayName = "ToastDescription";
