import {
  BottomSheet,
  BottomSheetView,
  type BottomSheetMethods,
} from "@expo/ui/community/bottom-sheet";
import {
  type PropsWithChildren,
  type ReactElement,
  useEffect,
  useRef,
} from "react";
import { type ColorValue } from "react-native";

export interface NativeBottomSheetProps extends PropsWithChildren {
  readonly backgroundColor: ColorValue;
  readonly isOpen: boolean;
  readonly onDismiss: () => void;
  readonly presentation?: "content" | "form";
}

export default function NativeBottomSheet({
  backgroundColor,
  children,
  isOpen,
  onDismiss,
  presentation = "content",
}: NativeBottomSheetProps): ReactElement {
  const sheetRef = useRef<BottomSheetMethods>(null);

  useEffect(() => {
    if (!isOpen || presentation !== "form") {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      sheetRef.current?.expand();
    });

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isOpen, presentation]);

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor }}
      enableDynamicSizing={presentation === "content"}
      enablePanDownToClose
      handleComponent={null}
      index={isOpen ? (presentation === "form" ? 1 : 0) : -1}
      key={isOpen ? "open" : "closed"}
      onClose={onDismiss}
      ref={sheetRef}
      snapPoints={presentation === "form" ? ["50%", "100%"] : undefined}
    >
      <BottomSheetView
        style={presentation === "form" ? { flex: 1 } : undefined}
      >
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}
