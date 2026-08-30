import { render, screen, userEvent } from "@testing-library/react-native";

import MapToolbar from "./map-toolbar";

let mockSafeAreaTop = 0;
let mockWindowWidth = 412;

jest.mock("react-native", () => {
  const actual =
    jest.requireActual<typeof import("react-native")>("react-native");

  return new Proxy(actual, {
    get(target, property, receiver) {
      if (property === "useColorScheme") {
        return () => "light";
      }

      if (property === "useWindowDimensions") {
        return () => ({
          fontScale: 1,
          height: 800,
          scale: 1,
          width: mockWindowWidth,
        });
      }

      return Reflect.get(target, property, receiver);
    },
  });
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: 0,
    left: 0,
    right: 0,
    top: mockSafeAreaTop,
  }),
}));

describe("MapToolbar", () => {
  beforeEach(() => {
    mockSafeAreaTop = 0;
    mockWindowWidth = 412;
  });

  test("renders the three prototype actions", async () => {
    await render(<MapToolbar />);

    expect(
      screen.getByRole("button", { name: "Rechercher un point" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", {
        name: "Afficher les couches de la carte",
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("open-point-search")).toBeOnTheScreen();
    expect(screen.getByTestId("map-layers-button")).toBeOnTheScreen();
    expect(screen.getByTestId("map-focus-button")).toBeOnTheScreen();
  });

  test("keeps all actions intentionally inert", async () => {
    const user = userEvent.setup();
    await render(<MapToolbar />);

    await user.press(
      screen.getByRole("button", { name: "Rechercher un point" }),
    );
    await user.press(
      screen.getByRole("button", {
        name: "Afficher les couches de la carte",
      }),
    );
    await user.press(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    );

    expect(screen.getByTestId("map-toolbar")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    ).toHaveProp("aria-pressed", false);
  });

  test("uses the larger of the prototype offset and the top safe area", async () => {
    mockSafeAreaTop = 24;

    await render(<MapToolbar />);

    expect(screen.getByTestId("map-toolbar")).toHaveStyle({ top: 24 });
  });

  test("adapts the prototype spacing on narrow screens", async () => {
    mockWindowWidth = 380;

    await render(<MapToolbar />);

    expect(screen.getByTestId("map-toolbar")).toHaveProp(
      "className",
      expect.stringContaining("inset-x-3 gap-2"),
    );
    expect(screen.getByText("Rechercher un point")).toHaveProp(
      "className",
      expect.stringContaining("text-sm"),
    );
  });
});
