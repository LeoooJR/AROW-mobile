import {
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";

import type { RailwayLineMetadata } from "@/types/railway-line";

import Index from "@/app/index";

jest.mock("expo-asset", () => ({
  useAssets: () => [
    [
      {
        localUri: "file:///railways.geojson",
        uri: "asset:///railways.geojson",
      },
    ],
    undefined,
  ],
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("@/hooks/platform/use-real-location", () => ({
  useRealLocation: () => ({
    openSettings: jest.fn(),
    requestAccess: jest.fn(),
    retry: jest.fn(),
    state: { status: "permissionRequired" },
  }),
}));

jest.mock("@/components/adapters/map/map", () => {
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      onRailwayPress,
      selectedRailway,
    }: {
      readonly onRailwayPress?: (value: RailwayLineMetadata) => void;
      readonly selectedRailway?: RailwayLineMetadata;
    }) => {
      const railway: RailwayLineMetadata = {
        codeLigne: "340311",
        gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
        name: "Raccordement de Rouen-Martainville",
        pkDebut: "136+772",
        pkFin: "137+980",
        rangTroncon: 1,
        type: "Raccordement",
      };

      return (
        <MockView>
          <MockPressable
            accessibilityLabel="Choisir une ligne test"
            accessibilityRole="button"
            onPress={() => {
              onRailwayPress?.(railway);
            }}
          >
            <MockText>Carte</MockText>
          </MockPressable>
          <MockText>{selectedRailway?.codeLigne ?? "Aucune ligne"}</MockText>
        </MockView>
      );
    },
  };
});

jest.mock("@/components/composites/location-bar", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: () => <MockView testID="mock-location-bar" />,
  };
});

describe("Index railway selection", () => {
  test("shows, highlights, and closes railway details from a map press", async () => {
    const user = userEvent.setup();
    await render(<Index />);

    expect(screen.getByText("Aucune ligne")).toBeOnTheScreen();
    expect(screen.queryByTestId("railway-details-card")).toBeNull();

    await user.press(
      screen.getByRole("button", { name: "Choisir une ligne test" }),
    );

    expect(screen.getByTestId("railway-details-card")).toBeOnTheScreen();
    expect(
      within(screen.getByTestId("railway-details-card")).getByText("340311"),
    ).toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", {
        name: "Fermer les informations de la ligne",
      }),
    );

    expect(screen.queryByTestId("railway-details-card")).toBeNull();
    expect(screen.getByText("Aucune ligne")).toBeOnTheScreen();
  });
});
