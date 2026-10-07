import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import StartupScreen from "./startup-screen";

test("announces the failure and exposes an accessible retry action", async () => {
  const onRetry = jest.fn();
  const onLayout = jest.fn();
  await render(<StartupScreen failed onLayout={onLayout} onRetry={onRetry} />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Impossible de charger la carte.",
  );
  await fireEvent(screen.getByTestId("startup-screen"), "layout");
  expect(onLayout).toHaveBeenCalledTimes(1);
  await userEvent
    .setup()
    .press(screen.getByRole("button", { name: "Réessayer" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
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
