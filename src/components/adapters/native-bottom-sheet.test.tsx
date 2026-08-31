import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

import NativeBottomSheet from "./native-bottom-sheet";

jest.mock("@expo/ui/community/bottom-sheet", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    BottomSheet: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <MockView {...props} testID="mock-expo-bottom-sheet">
        {children}
      </MockView>
    ),
    BottomSheetView: ({ children }: React.PropsWithChildren) => (
      <MockView>{children}</MockView>
    ),
  };
});

describe("NativeBottomSheet", () => {
  test("maps the controlled application API to the dismissible Expo sheet", async () => {
    const onDismiss = jest.fn();
    await render(
      <NativeBottomSheet backgroundColor="#10100F" isOpen onDismiss={onDismiss}>
        <View>
          <Text>Sheet content</Text>
        </View>
      </NativeBottomSheet>,
    );

    const sheet = screen.getByTestId("mock-expo-bottom-sheet");
    expect(sheet).toHaveProp("index", 0);
    expect(sheet).toHaveProp("enableDynamicSizing", true);
    expect(sheet).toHaveProp("enablePanDownToClose", true);
    expect(sheet).toHaveProp("handleComponent", null);
    expect(sheet).toHaveProp("backgroundStyle", {
      backgroundColor: "#10100F",
    });

    await fireEvent(sheet, "close");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test("maps the closed state to index minus one", async () => {
    await render(
      <NativeBottomSheet
        backgroundColor="#FFFFFF"
        isOpen={false}
        onDismiss={jest.fn()}
      >
        <Text>Closed content</Text>
      </NativeBottomSheet>,
    );

    expect(screen.getByTestId("mock-expo-bottom-sheet")).toHaveProp(
      "index",
      -1,
    );
  });
});
