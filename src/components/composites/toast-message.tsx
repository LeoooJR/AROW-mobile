import { type KeyboardEvent, useState } from "react";
import {
  Platform,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

import {
  Toast,
  ToastDescription,
  ToastTitle,
} from "@/components/adapters/toast";
import Button from "@/components/primitives/button";
import ToastIcon, {
  type ToastIconKind,
} from "@/components/primitives/icons/toast-icon";

export type ToastSeverity = Exclude<ToastIconKind, "close">;

export interface ToastMessageProps {
  readonly severity: ToastSeverity;
  readonly message: string;
  readonly onDismiss: () => void;
  readonly testID?: string;
}

const labels = {
  info: "Information",
  success: "Succès",
  warning: "Avertissement",
  error: "Erreur",
} as const;

export default function ToastMessage({
  severity,
  message,
  onDismiss,
  testID,
}: ToastMessageProps) {
  const dark = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const foreground = dark ? "#0A0A0A" : "#FFFFFF";
  const [focused, setFocused] = useState(false);
  const keyboardProps =
    Platform.OS === "web"
      ? {
          onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              onDismiss();
            }
          },
        }
      : {};

  return (
    <Toast
      {...keyboardProps}
      action={severity}
      style={{
        alignSelf: "center",
        width: Math.min(412, Math.max(0, width - 32)),
      }}
      testID={testID}
    >
      <View className="flex-row items-start gap-[10px]">
        <View aria-hidden className="mt-[2px] shrink-0">
          <ToastIcon
            kind={severity}
            color={severity === "success" ? "#3FA66E" : foreground}
          />
        </View>
        <View
          accessible
          accessibilityLiveRegion={
            severity === "error" ? "assertive" : "polite"
          }
          className="min-w-0 flex-1"
          role={severity === "error" ? "alert" : "status"}
        >
          <ToastTitle>{labels[severity]}</ToastTitle>
          <ToastDescription>{message}</ToastDescription>
        </View>
        <Button
          accessibilityLabel="Fermer le message"
          className="-my-[8px] -mr-[8px] h-[48px] w-[48px] shrink-0 rounded-[8px] bg-transparent active:bg-transparent"
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          onPress={onDismiss}
          role="button"
        >
          {({ pressed }) => (
            <>
              {pressed ? (
                <View
                  pointerEvents="none"
                  className="absolute inset-0 rounded-[8px] bg-white/[0.12] dark:bg-black/[0.12]"
                />
              ) : null}
              {focused ? (
                <View
                  pointerEvents="none"
                  className="absolute -inset-[4px] rounded-[12px] border-2 border-white dark:border-[#0A0A0A]"
                />
              ) : null}
              <View aria-hidden>
                <ToastIcon kind="close" color={foreground} />
              </View>
            </>
          )}
        </Button>
      </View>
    </Toast>
  );
}
