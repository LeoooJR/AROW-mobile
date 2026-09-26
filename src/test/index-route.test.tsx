import {
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";

import type { MapFeature } from "@/features/map-features/map-feature";
import type { Milestone } from "@/features/milestones/domain/milestone";
import type { SimulationState } from "@/features/simulation/simulation-state";

import Index from "@/app/index";

const mockStartSimulation = jest.fn();
const mockStopSimulation = jest.fn();
let mockSimulationState: SimulationState = { status: "idle" };

jest.mock("@/features/simulation/use-simulation", () => ({
  useSimulation: () => ({
    start: mockStartSimulation,
    state: mockSimulationState,
    stop: mockStopSimulation,
  }),
}));

jest.mock("expo-asset", () => ({
  useAssets: () => [
    [
      {
        localUri: "file:///railways.geojson",
        uri: "asset:///railways.geojson",
      },
      {
        localUri: "file:///milestones.geojson",
        uri: "asset:///milestones.geojson",
      },
    ],
    undefined,
  ],
}));

jest.mock("@/features/railway-reference/context", () => ({
  useRailwayReference: () => ({
    milestoneSearch: {
      findMilestone: jest.fn(),
      loadRailways: jest.fn(),
      state: { status: "unavailable" },
    },
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
    typeof import("@/features/milestones/domain/milestone")
  >("@/features/milestones/domain/milestone");
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
            {selectedFeature?.kind === "railway-section"
              ? selectedFeature.name
              : (selectedFeature?.label ?? "Aucun élément")}
          </MockText>
        </MockView>
      );
    },
  };
});

jest.mock("@/components/composites/location-bar", () => {
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      onSimulationPress,
      showSimulationAction,
    }: {
      readonly onSimulationPress: () => void;
      readonly showSimulationAction: boolean;
    }) => (
      <MockView testID="mock-location-bar">
        {showSimulationAction ? (
          <MockPressable
            accessibilityRole="button"
            accessibilityLabel="Action de simulation"
            onPress={onSimulationPress}
          >
            <MockText>Action de simulation</MockText>
          </MockPressable>
        ) : null}
      </MockView>
    ),
  };
});

jest.mock("@/components/composites/map-toolbar", () => {
  const { Milestone: MockMilestone } = jest.requireActual<
    typeof import("@/features/milestones/domain/milestone")
  >("@/features/milestones/domain/milestone");
  const { Pressable: MockPressable, Text: MockText } =
    jest.requireActual<typeof import("react-native")>("react-native");
  const milestone = new MockMilestone({
    coordinates: { latitude: 45.74744, longitude: 4.85933 },
    label: "509+000",
    lineCode: "893000",
    positionMeters: 509_000,
    sectionRank: 1,
  });
  return {
    __esModule: true,
    default: ({
      onMilestoneSelect,
    }: {
      readonly onMilestoneSelect: (value: Milestone) => void;
    }) => (
      <MockPressable
        accessibilityRole="button"
        accessibilityLabel="Choisir un repère recherché"
        onPress={() => onMilestoneSelect(milestone)}
      >
        <MockText>Recherche</MockText>
      </MockPressable>
    ),
  };
});

describe("Index map feature selection", () => {
  beforeEach(() => {
    mockSimulationState = { status: "idle" };
    mockStartSimulation.mockReset();
    mockStopSimulation.mockReset();
  });

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

  test("starts from a searched milestone and keeps stop available while exploring", async () => {
    const user = userEvent.setup();
    const view = await render(<Index />);
    await user.press(
      screen.getByRole("button", { name: "Choisir un repère recherché" }),
    );
    await user.press(
      screen.getByRole("button", { name: "Action de simulation" }),
    );
    expect(mockStartSimulation).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "milestone", label: "509+000" }),
    );

    mockSimulationState = {
      status: "running",
      position: {
        accuracy: null,
        heading: null,
        latitude: 45.74744,
        longitude: 4.85933,
      },
    };
    await view.rerender(<Index />);
    await user.press(
      screen.getByRole("button", { name: "Choisir une ligne test" }),
    );
    expect(
      screen.getByRole("button", { name: "Action de simulation" }),
    ).toBeOnTheScreen();
    await user.press(
      screen.getByRole("button", { name: "Action de simulation" }),
    );
    expect(mockStopSimulation).toHaveBeenCalledTimes(1);
  });
});
