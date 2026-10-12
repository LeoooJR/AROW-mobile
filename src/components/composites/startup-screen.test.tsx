import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { useColorScheme } from "react-native";
import StartupScreen from "./startup-screen";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));

jest.mock("react-native", () => {
  const native = jest.requireActual("react-native");
  const mockUseColorScheme = jest.fn(() => "light");
  return new Proxy(native, {
    get(target, property) {
      return property === "useColorScheme"
        ? mockUseColorScheme
        : Reflect.get(target, property);
    },
  });
});

afterEach(() => {
  jest.mocked(useColorScheme).mockReturnValue("light");
});

test("dark startup keeps the app icon across splash, failure, and retry", async () => {
  jest.mocked(useColorScheme).mockReturnValue("dark");
  const callbacks = { onLayout: jest.fn(), onRetry: jest.fn() };
  const view = await render(
    <StartupScreen {...callbacks} failed={false} showProgress={false} />,
  );
  const icon = screen.getByTestId("startup-artwork").props.source;
  expect(icon).toEqual([require("@/assets/images/app-icon-dark.png")]);
  await view.rerender(<StartupScreen {...callbacks} failed />);
  expect(screen.getByTestId("startup-artwork")).toHaveProp("source", icon);
  await view.rerender(<StartupScreen {...callbacks} failed={false} />);
  expect(screen.getByTestId("startup-artwork")).toHaveProp("source", icon);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Chargement de la carte…",
  );
});

test("announces the failure and exposes an accessible retry action", async () => {
  const onRetry = jest.fn();
  const onLayout = jest.fn();
  await render(<StartupScreen failed onLayout={onLayout} onRetry={onRetry} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Chargement impossible");
  expect(
    screen.getByText(
      "La carte n’a pas pu être chargée.\nVérifiez votre connexion, puis réessayez.",
    ),
  ).toBeOnTheScreen();
  await fireEvent(screen.getByTestId("startup-screen"), "layout");
  expect(onLayout).toHaveBeenCalledTimes(1);
  await userEvent
    .setup()
    .press(screen.getByRole("button", { name: "Réessayer" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test("retry loading removes the failure and preserves artwork readiness", async () => {
  const onArtworkReady = jest.fn();
  const view = await render(
    <StartupScreen failed onLayout={jest.fn()} onRetry={jest.fn()} />,
  );
  await view.rerender(
    <StartupScreen
      failed={false}
      onLayout={jest.fn()}
      onRetry={jest.fn()}
      onArtworkReady={onArtworkReady}
    />,
  );
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
  expect(screen.queryByRole("button")).not.toBeOnTheScreen();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Chargement de la carte…",
  );
  await fireEvent(screen.getByTestId("startup-artwork"), "load", {
    nativeEvent: {},
  });
  expect(onArtworkReady).toHaveBeenCalledTimes(1);
});

test("initial artwork-only loading hides progress and retry", async () => {
  await render(
    <StartupScreen
      failed={false}
      showProgress={false}
      onLayout={jest.fn()}
      onRetry={jest.fn()}
    />,
  );
  expect(screen.queryByRole("status")).not.toBeOnTheScreen();
  expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
  expect(screen.queryByRole("button")).not.toBeOnTheScreen();
});

test("loading has no premature error or retry action", async () => {
  const onArtworkReady = jest.fn();
  await render(
    <StartupScreen
      failed={false}
      onLayout={jest.fn()}
      onRetry={jest.fn()}
      onArtworkReady={onArtworkReady}
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Chargement de la carte…",
  );
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  await fireEvent(screen.getByTestId("startup-artwork"), "load", {
    nativeEvent: {},
  });
  expect(onArtworkReady).toHaveBeenCalledTimes(1);
});
