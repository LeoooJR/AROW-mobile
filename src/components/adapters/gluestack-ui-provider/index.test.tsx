import { render, screen } from "@testing-library/react-native";
import { Appearance, Text } from "react-native";

import { GluestackUIProvider } from "./index";

jest.mock("@gluestack-ui/core/overlay/creator", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    OverlayProvider: ({ children }: React.PropsWithChildren) => (
      <MockView testID="overlay-provider">{children}</MockView>
    ),
  };
});

jest.mock("@gluestack-ui/core/toast/creator", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    ToastProvider: ({ children }: React.PropsWithChildren) => (
      <MockView testID="toast-provider">{children}</MockView>
    ),
  };
});

describe("GluestackUIProvider", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("uses the system color scheme by default and renders providers", async () => {
    const setColorScheme = jest
      .spyOn(Appearance, "setColorScheme")
      .mockImplementation();

    await render(
      <GluestackUIProvider style={{ opacity: 0.5 }}>
        <Text>Railway content</Text>
      </GluestackUIProvider>,
    );

    expect(setColorScheme).toHaveBeenCalledWith("unspecified");
    expect(screen.getByTestId("overlay-provider")).toBeOnTheScreen();
    expect(screen.getByTestId("toast-provider")).toBeOnTheScreen();
    expect(screen.getByText("Railway content")).toBeOnTheScreen();
    expect(screen.getByTestId("overlay-provider").parent).toHaveStyle({
      opacity: 0.5,
    });
  });

  test("applies and updates an explicit color scheme", async () => {
    const setColorScheme = jest
      .spyOn(Appearance, "setColorScheme")
      .mockImplementation();
    const view = await render(
      <GluestackUIProvider mode="dark">
        <Text>Content</Text>
      </GluestackUIProvider>,
    );

    expect(setColorScheme).toHaveBeenLastCalledWith("dark");

    await view.rerender(
      <GluestackUIProvider mode="light">
        <Text>Content</Text>
      </GluestackUIProvider>,
    );

    expect(setColorScheme).toHaveBeenLastCalledWith("light");
  });
});
