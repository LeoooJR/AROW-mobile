import {
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";

import type { MapFeature } from "@/features/map-features/map-feature";

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

jest.mock("@/features/milestones/railway-reference-context", () => ({
  useRailwayReference: () => ({
    milestoneSearch: {
      findMilestone: jest.fn(),
      state: { status: "unavailable" },
    },
    milestoneState: { status: "unavailable" },
  }),
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
  const { Milestone: MockMilestone } = jest.requireActual<
    typeof import("@/features/milestones/milestone")
  >("@/features/milestones/milestone");
  const { Railway: MockRailway } = jest.requireActual<
    typeof import("@/features/railways/railway")
  >("@/features/railways/railway");
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      onFeaturePress,
      selectedFeature,
    }: {
      readonly onFeaturePress?: (value: MapFeature) => void;
      readonly selectedFeature?: MapFeature;
    }) => {
      const railwayLine = new MockRailway({
        code: "340311",
        name: "Raccordement de Rouen-Martainville",
        sections: [
          {
            geometry: {
              endMilestone: "137+980",
              gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
              railwayType: "Raccordement",
              startMilestone: "136+772",
              status: "present",
            },
            sectionRank: 1,
          },
        ],
      });
      const railway = railwayLine.sections[0];
      const milestone = new MockMilestone({
        coordinates: { latitude: 45.74491, longitude: 4.86234 },
        label: "241+000",
        lineCode: "001000",
        positionMeters: 241_000,
        sectionRank: 1,
      });

      return (
        <MockView>
          <MockPressable
            accessibilityLabel="Choisir une ligne test"
            accessibilityRole="button"
            onPress={() => {
              onFeaturePress?.(railway);
            }}
          >
            <MockText>Carte</MockText>
          </MockPressable>
          <MockPressable
            accessibilityLabel="Choisir un point kilométrique test"
            accessibilityRole="button"
            onPress={() => {
              onFeaturePress?.(milestone);
            }}
          >
            <MockText>Point</MockText>
          </MockPressable>
          <MockText>
            {selectedFeature?.kind === "railway"
              ? selectedFeature.name
              : (selectedFeature?.label ?? "Aucun élément")}
          </MockText>
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

describe("Index map feature selection", () => {
  test("shows, replaces, and closes shared feature details", async () => {
    const user = userEvent.setup();
    await render(<Index />);

    expect(screen.getByText("Aucun élément")).toBeOnTheScreen();
    expect(screen.queryByTestId("map-feature-details-card")).toBeNull();

    await user.press(
      screen.getByRole("button", { name: "Choisir une ligne test" }),
    );

    expect(screen.getByTestId("map-feature-details-card")).toBeOnTheScreen();
    expect(
      within(screen.getByTestId("map-feature-details-card")).getByText(
        "340311",
      ),
    ).toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", {
        name: "Choisir un point kilométrique test",
      }),
    );

    expect(
      within(screen.getByTestId("map-feature-details-card")).getByText(
        "PK 241+000",
      ),
    ).toBeOnTheScreen();
    expect(
      within(screen.getByTestId("map-feature-details-card")).getByText(
        "001000",
      ),
    ).toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", {
        name: "Fermer les informations de l’élément cartographique",
      }),
    );

    expect(screen.queryByTestId("map-feature-details-card")).toBeNull();
    expect(screen.getByText("Aucun élément")).toBeOnTheScreen();
  });
});
