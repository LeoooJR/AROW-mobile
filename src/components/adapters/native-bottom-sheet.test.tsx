import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Text, View } from "react-native";

import NativeBottomSheet from "./native-bottom-sheet";

const mockExpand = jest.fn();

jest.mock("@expo/ui/community/bottom-sheet", () => {
  const { useImperativeHandle: mockUseImperativeHandle } =
    jest.requireActual<typeof import("react")>("react");
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    BottomSheet: ({
      children,
      ref,
      ...props
    }: React.PropsWithChildren<
      Record<string, unknown> & { ref?: React.Ref<unknown> }
    >) => {
      mockUseImperativeHandle(ref, () => ({ expand: mockExpand }));
      return (
        <MockView {...props} testID="mock-expo-bottom-sheet">
          {children}
        </MockView>
      );
    },
    BottomSheetView: ({ children }: React.PropsWithChildren) => (
      <MockView>{children}</MockView>
    ),
  };
});

describe("NativeBottomSheet", () => {
  beforeEach(() => {
    mockExpand.mockClear();
  });

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

  test("uses native partial and full snap states for form sheets", async () => {
    await render(
      <NativeBottomSheet
        backgroundColor="#FFFFFF"
        isOpen
        onDismiss={jest.fn()}
        presentation="form"
      >
        <Text>Form content</Text>
      </NativeBottomSheet>,
    );

    const sheet = screen.getByTestId("mock-expo-bottom-sheet");
    expect(sheet).toHaveProp("index", 1);
    expect(sheet).toHaveProp("enableDynamicSizing", false);
    expect(sheet).toHaveProp("snapPoints", ["50%", "100%"]);
    await waitFor(() => {
      expect(mockExpand).toHaveBeenCalledTimes(1);
    });
  });
});
