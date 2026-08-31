import { BottomSheet, BottomSheetView } from "@expo/ui/community/bottom-sheet";
import { type PropsWithChildren, type ReactElement } from "react";
import { type ColorValue } from "react-native";

export interface NativeBottomSheetProps extends PropsWithChildren {
  readonly backgroundColor: ColorValue;
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
}

export default function NativeBottomSheet({
  backgroundColor,
  children,
  isOpen,
  onDismiss,
}: NativeBottomSheetProps): ReactElement {
  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor }}
      enableDynamicSizing
      enablePanDownToClose
      handleComponent={null}
      index={isOpen ? 0 : -1}
      onClose={onDismiss}
    >
      <BottomSheetView>{children}</BottomSheetView>
    </BottomSheet>
  );
}
