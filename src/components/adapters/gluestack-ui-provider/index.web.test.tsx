import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { GluestackUIProvider } from "./index.web";
import { applyColorMode } from "./script";

jest.mock("./script", () => ({
  applyColorMode: jest.fn(),
}));

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

const addEventListener = jest.fn();
const removeEventListener = jest.fn();

describe("GluestackUIProvider web", () => {
  beforeEach(() => {
    jest.mocked(applyColorMode).mockReset();
    addEventListener.mockReset();
    removeEventListener.mockReset();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: () => ({
          addEventListener,
          matches: false,
          removeEventListener,
        }),
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  test("applies an explicit mode and renders provider content", async () => {
    await render(
      <GluestackUIProvider mode="dark">
        <Text>Web railway content</Text>
      </GluestackUIProvider>,
    );

    expect(applyColorMode).toHaveBeenCalledWith("dark");
    expect(screen.getByTestId("overlay-provider")).toBeOnTheScreen();
    expect(screen.getByTestId("toast-provider")).toBeOnTheScreen();
    expect(screen.getByText("Web railway content")).toBeOnTheScreen();
    expect(addEventListener).not.toHaveBeenCalled();
  });

  test("tracks system preference changes and removes its listener", async () => {
    const view = await render(
      <GluestackUIProvider>
        <Text>Content</Text>
      </GluestackUIProvider>,
    );
    const listener = addEventListener.mock.calls[0]?.[1] as
      ((event: { matches: boolean }) => void) | undefined;

    expect(addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(listener).toBeDefined();

    listener?.({ matches: true });
    listener?.({ matches: false });
    expect(applyColorMode).toHaveBeenNthCalledWith(1, "dark");
    expect(applyColorMode).toHaveBeenNthCalledWith(2, "light");

    await view.unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", listener);
  });

  test("switches from system tracking to an explicit mode", async () => {
    const view = await render(
      <GluestackUIProvider>
        <Text>Content</Text>
      </GluestackUIProvider>,
    );
    const listener = addEventListener.mock.calls[0]?.[1];

    await view.rerender(
      <GluestackUIProvider mode="light">
        <Text>Content</Text>
      </GluestackUIProvider>,
    );

    expect(removeEventListener).toHaveBeenCalledWith("change", listener);
    expect(applyColorMode).toHaveBeenCalledWith("light");
  });
});
