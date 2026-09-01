import { type ReactElement, type ReactNode } from "react";
import { Pressable, View } from "react-native";

interface LocationRowProps {
  readonly action?: ReactNode;
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onAction?: () => void;
}

export default function LocationRow({
  action,
  accessibilityLabel,
  children,
  onAction,
}: LocationRowProps): ReactElement {
  const className = "min-h-[70px] flex-row items-center gap-3 py-2";

  if (onAction === undefined) {
    return (
      <View className={className}>
        <View
          accessible
          accessibilityLabel={accessibilityLabel}
          accessibilityLiveRegion="polite"
          className="min-w-0 flex-1 flex-row items-center gap-3"
          testID="location-status"
        >
          {children}
        </View>
        {action}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityRole="button"
      className={`${className} bg-canvas active:bg-surface-muted`}
      onPress={onAction}
      testID="location-status"
    >
      {children}
    </Pressable>
  );
}
