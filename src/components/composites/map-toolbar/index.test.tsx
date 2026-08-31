import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { useState } from "react";

import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  type MapLayerVisibility,
} from "@/components/adapters/map/map-layer-visibility";

import MapToolbar from "./index";

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

jest.mock("@/components/adapters/native-bottom-sheet", () => {
  const { Pressable: MockPressable, View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      children,
      isOpen,
      onDismiss,
    }: React.PropsWithChildren<{
      readonly isOpen: boolean;
      readonly onDismiss: () => void;
    }>) =>
      isOpen ? (
        <MockView testID="mock-native-bottom-sheet">
          {children}
          <MockPressable
            onPress={onDismiss}
            testID="mock-native-sheet-dismiss"
          />
        </MockView>
      ) : null,
  };
});

function ControlledToolbar({
  onVisibilityChange = jest.fn(),
}: {
  readonly onVisibilityChange?: jest.Mock;
}) {
  const [visibility, setVisibility] = useState<MapLayerVisibility>(
    DEFAULT_MAP_LAYER_VISIBILITY,
  );

  return (
    <MapToolbar
      onVisibilityChange={(layer, visible) => {
        onVisibilityChange(layer, visible);
        setVisibility((current) => ({ ...current, [layer]: visible }));
      }}
      visibility={visibility}
    />
  );
}

describe("MapToolbar", () => {
  beforeEach(() => {
    mockSafeAreaTop = 0;
    mockWindowWidth = 412;
  });

  test("renders the three prototype actions", async () => {
    await render(<ControlledToolbar />);

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

  test("keeps search and focus actions intentionally inert", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);

    await user.press(
      screen.getByRole("button", { name: "Rechercher un point" }),
    );
    await user.press(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    );

    expect(screen.getByTestId("map-toolbar")).toBeOnTheScreen();
    expect(screen.queryByRole("dialog")).not.toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    ).toHaveProp("aria-pressed", false);
  });

  test("opens and dismisses the two-option railway layer sheet", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);
    const layersButton = screen.getByRole("button", {
      name: "Afficher les couches de la carte",
    });

    expect(layersButton).toBeCollapsed();
    await user.press(layersButton);

    expect(layersButton).toBeExpanded();
    expect(screen.getByTestId("map-layers-sheet")).toHaveProp("role", "dialog");
    expect(screen.getByTestId("map-layers-sheet")).toHaveAccessibleName(
      "Couches ferroviaires",
    );
    expect(screen.getByText("Voies ferrées")).toBeOnTheScreen();
    expect(screen.getByText("Points kilométriques")).toBeOnTheScreen();
    expect(screen.queryByText("Gares et haltes")).not.toBeOnTheScreen();
    expect(screen.getByTestId("map-layers-sheet")).toHaveStyle({
      paddingBottom: 20,
    });

    await user.press(
      screen.getByRole("button", { name: "Fermer les couches" }),
    );

    expect(screen.queryByTestId("map-layers-sheet")).not.toBeOnTheScreen();
    expect(layersButton).toBeCollapsed();

    await user.press(
      screen.getByRole("button", {
        name: "Afficher les couches de la carte",
      }),
    );
    await fireEvent.press(
      screen.getByTestId("mock-native-sheet-dismiss", {
        includeHiddenElements: true,
      }),
    );

    expect(screen.queryByTestId("map-layers-sheet")).not.toBeOnTheScreen();
    expect(layersButton).toBeCollapsed();
  });

  test("reports controlled visibility changes with accessible switch state", async () => {
    const user = userEvent.setup();
    const onVisibilityChange = jest.fn();
    await render(<ControlledToolbar onVisibilityChange={onVisibilityChange} />);
    await user.press(screen.getByTestId("map-layers-button"));

    const railwaySwitch = screen.getByRole("switch", {
      name: "Masquer les voies ferrées",
    });
    const milestoneSwitch = screen.getByRole("switch", {
      name: "Masquer les points kilométriques",
    });
    expect(railwaySwitch).toBeChecked();
    expect(milestoneSwitch).toBeChecked();
    expect(screen.getByTestId("railways-layer-switch")).toBeOnTheScreen();
    expect(screen.getByTestId("milestones-layer-switch")).toBeOnTheScreen();

    await user.press(railwaySwitch);
    await user.press(milestoneSwitch);

    expect(onVisibilityChange).toHaveBeenNthCalledWith(1, "railway", false);
    expect(onVisibilityChange).toHaveBeenNthCalledWith(2, "milestone", false);
    expect(
      screen.getByRole("switch", { name: "Afficher les voies ferrées" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("switch", {
        name: "Afficher les points kilométriques",
      }),
    ).not.toBeChecked();
  });

  test("uses the larger of the prototype offset and the top safe area", async () => {
    mockSafeAreaTop = 24;

    await render(<ControlledToolbar />);

    expect(screen.getByTestId("map-toolbar")).toHaveStyle({ top: 24 });
  });

  test("adapts the prototype spacing on narrow screens", async () => {
    mockWindowWidth = 380;

    await render(<ControlledToolbar />);

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
