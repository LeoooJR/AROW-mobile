import {
  fireEvent,
  render,
  screen,
  userEvent,
  within,
} from "@testing-library/react-native";

import type { MapFeature } from "@/types/map-feature";
import type { Milestone } from "@shared/railway-domain/milestone";
import { Milestone as RecordedMilestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import type { SimulationState } from "@/features/simulation/simulation-state";

import Index from "@/app/index";
import { useAssets } from "expo-asset";
import { AppStartupContext } from "@/contexts/app-startup-context";
jest.mock("@/features/use-visible-milestones", () => ({
  useVisibleMilestones: () => [],
}));
const mockFindBounds = jest.fn().mockResolvedValue({});
const mockFindNeighbours = jest.fn().mockResolvedValue(undefined);
jest.mock("@/components/adapters/toast", () => ({
  useToast: () => mockToast,
}));
const mockToast = { show: jest.fn(), close: jest.fn() };
jest.mock("@/features/use-map-startup", () => ({
  useMapStartup: () => undefined,
}));

const mockStartSimulation = jest.fn();
const mockStopSimulation = jest.fn();
let mockSimulationState: SimulationState = { status: "idle" };

jest.mock("@/features/use-simulation", () => ({
  useSimulation: () => ({
    start: mockStartSimulation,
    state: mockSimulationState,
    stop: mockStopSimulation,
  }),
}));

jest.mock("expo-asset", () => ({
  useAssets: jest.fn(() => [
    [
      {
        localUri: "file:///railways.geojson",
        uri: "asset:///railways.geojson",
      },
    ],
    undefined,
  ]),
}));

const defaultRailwayAssets = jest.mocked(useAssets).getMockImplementation()?.(
  [],
);

jest.mock("@/features/use-railway-reference", () => ({
  useRailwayReference: () => ({
    findRailwayMilestoneBounds: mockFindBounds,
    findMilestoneNeighbours: mockFindNeighbours,
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

jest.mock("@/features/use-real-location", () => ({
  useRealLocation: () => ({
    openSettings: jest.fn(),
    requestAccess: jest.fn(),
    retry: jest.fn(),
    state: { status: "permissionRequired" },
  }),
}));

jest.mock("@/components/adapters/map/map", () => {
  const { MilestoneId: MockMilestoneId } = jest.requireActual<
    typeof import("@shared/railway-domain/milestone-id")
  >("@shared/railway-domain/milestone-id");
  const { RailwaySectionId: MockRailwaySectionId } = jest.requireActual<
    typeof import("@shared/railway-domain/railway-section-id")
  >("@shared/railway-domain/railway-section-id");
  const { Milestone: MockMilestone } = jest.requireActual<
    typeof import("@shared/railway-domain/milestone")
  >("@shared/railway-domain/milestone");
  const { Railway: MockRailway } = jest.requireActual<
    typeof import("@shared/railway-domain/railway")
  >("@shared/railway-domain/railway");
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      onFeaturePress,
      onLoadError,
      selectedFeature,
    }: {
      readonly onFeaturePress?: (value: MapFeature) => void;
      readonly onLoadError?: () => void;
      readonly selectedFeature?: MapFeature;
    }) => {
      const railwayLine = new MockRailway({
        code: "340311",
        name: "Raccordement de Rouen-Martainville",
        sections: [
          {
            geometry: {
              gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
              railwayType: "Raccordement",
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
        id: new MockMilestoneId(new MockRailwaySectionId("001000", 1), 241_000),
      });

      return (
        <MockView testID="mock-map" {...{ onLoadError }}>
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
      onLayout,
      onSimulationPress,
      showSimulationAction,
    }: {
      readonly onLayout?: (
        event: import("react-native").LayoutChangeEvent,
      ) => void;
      readonly onSimulationPress: () => void;
      readonly showSimulationAction: boolean;
    }) => (
      <MockView testID="mock-location-bar" onLayout={onLayout}>
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
  const { MilestoneId: MockMilestoneId } = jest.requireActual<
    typeof import("@shared/railway-domain/milestone-id")
  >("@shared/railway-domain/milestone-id");
  const { RailwaySectionId: MockRailwaySectionId } = jest.requireActual<
    typeof import("@shared/railway-domain/railway-section-id")
  >("@shared/railway-domain/railway-section-id");
  const { Milestone: MockMilestone } = jest.requireActual<
    typeof import("@shared/railway-domain/milestone")
  >("@shared/railway-domain/milestone");
  const { Pressable: MockPressable, Text: MockText } =
    jest.requireActual<typeof import("react-native")>("react-native");
  const milestone = new MockMilestone({
    coordinates: { latitude: 45.74744, longitude: 4.85933 },
    label: "509+000",
    id: new MockMilestoneId(new MockRailwaySectionId("893000", 1), 509_000),
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
  test("prepares a map point without starting and retains the card until explicit closure", async () => {
    const user = userEvent.setup();
    await render(<Index />);
    await user.press(
      screen.getByRole("button", {
        name: "Choisir un point kilométrique test",
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Action de simulation" }),
    ).toBeNull();
    await user.press(screen.getByRole("button", { name: "Utiliser ce point" }));
    await user.press(screen.getByRole("button", { name: "Utiliser ce point" }));
    expect(screen.getByText("PK 241+000")).toBeOnTheScreen();
    expect(mockStartSimulation).not.toHaveBeenCalled();
    expect(mockStopSimulation).not.toHaveBeenCalled();
    await user.press(
      screen.getByRole("button", { name: "Action de simulation" }),
    );
    expect(mockStartSimulation).toHaveBeenCalledWith(
      expect.objectContaining({ label: "241+000", kind: "milestone" }),
    );
    await user.press(
      screen.getByRole("button", {
        name: "Fermer les informations de l’élément cartographique",
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Action de simulation" }),
    ).toBeNull();
  });

  test("cannot prepare a different target while running and keeps Stop usable", async () => {
    mockSimulationState = {
      status: "running",
      position: {
        accuracy: null,
        heading: null,
        latitude: 45.74744,
        longitude: 4.85933,
      },
    };
    const user = userEvent.setup();
    await render(<Index />);
    await user.press(
      screen.getByRole("button", {
        name: "Choisir un point kilométrique test",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Utiliser ce point" }),
    ).toBeDisabled();
    await user.press(screen.getByRole("button", { name: "Utiliser ce point" }));
    expect(mockStartSimulation).not.toHaveBeenCalled();
    expect(mockStopSimulation).not.toHaveBeenCalled();
    await user.press(
      screen.getByRole("button", { name: "Action de simulation" }),
    );
    expect(mockStopSimulation).toHaveBeenCalledTimes(1);
  });
  test("keeps details above a location bar that grows with enlarged text", async () => {
    mockFindBounds.mockClear();
    const user = userEvent.setup();
    await render(<Index />);
    await user.press(
      screen.getByRole("button", { name: "Choisir une ligne test" }),
    );
    await fireEvent(screen.getByTestId("mock-location-bar"), "layout", {
      nativeEvent: { layout: { height: 200, width: 400, x: 0, y: 0 } },
    });
    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 216,
    });
    await fireEvent(screen.getByTestId("mock-location-bar"), "layout", {
      nativeEvent: { layout: { height: 150, width: 400, x: 0, y: 0 } },
    });
    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 166,
    });
    expect(mockFindBounds).toHaveBeenCalledTimes(1);
  });
  test.each(["loading", "error", "ready"] as const)(
    "only supplies a loading-error callback during startup (%s)",
    async (status) => {
      const onFailure = jest.fn();
      await render(
        <AppStartupContext.Provider
          value={{ status, onFailure, onReady: jest.fn() }}
        >
          <Index />
        </AppStartupContext.Provider>,
      );
      if (status === "loading") {
        expect(screen.getByTestId("mock-map")).toHaveProp(
          "onLoadError",
          onFailure,
        );
      } else {
        expect(screen.getByTestId("mock-map")).not.toHaveProp("onLoadError");
      }
    },
  );
  afterEach(() => jest.restoreAllMocks());
  test("does not mount the native map before both railway assets load", async () => {
    jest.mocked(useAssets).mockReturnValue([undefined, undefined]);
    await render(<Index />);
    expect(screen.queryByTestId("mock-map")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Choisir une ligne test" }),
    ).toBeNull();
  });
  test("reports railway asset errors to startup", async () => {
    jest
      .mocked(useAssets)
      .mockReturnValue([undefined, new Error("missing asset")]);
    const onFailure = jest.fn();
    await render(
      <AppStartupContext.Provider
        value={{ status: "loading", onFailure, onReady: jest.fn() }}
      >
        <Index />
      </AppStartupContext.Provider>,
    );
    expect(onFailure).toHaveBeenCalledTimes(1);
  });
  beforeEach(() => {
    mockFindNeighbours.mockReset().mockResolvedValue(undefined);
    if (defaultRailwayAssets)
      jest.mocked(useAssets).mockReturnValue(defaultRailwayAssets);
    mockSimulationState = { status: "idle" };
    mockStartSimulation.mockReset();
    mockStopSimulation.mockReset();
  });

  test.each([false, true])(
    "neighbour browsing clears the pending Start target and preserves running simulation (%s)",
    async (running) => {
      const next = new RecordedMilestone({
        id: new MilestoneId(new RailwaySectionId("893000", 1), 510000),
        label: "510+000",
        coordinates: { latitude: 45.75, longitude: 4.86 },
      });
      mockFindNeighbours.mockResolvedValueOnce({
        next,
        current: new RecordedMilestone({
          id: new MilestoneId(new RailwaySectionId("893000", 1), 509000),
          label: "509+000",
          coordinates: { latitude: 45.74744, longitude: 4.85933 },
        }),
        positionInSection: 10,
        total: 12,
      });
      const user = userEvent.setup();
      const view = await render(<Index />);
      await user.press(
        screen.getByRole("button", { name: "Choisir un repère recherché" }),
      );
      if (running) {
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
      }
      await user.press(
        await screen.findByRole("button", {
          name: "Afficher le point kilométrique suivant, 510+000",
        }),
      );
      expect(screen.getByText("PK 510+000")).toBeOnTheScreen();
      expect(mockStartSimulation).not.toHaveBeenCalled();
      expect(mockStopSimulation).not.toHaveBeenCalled();
      if (running) {
        await user.press(
          screen.getByRole("button", { name: "Action de simulation" }),
        );
        expect(mockStopSimulation).toHaveBeenCalledTimes(1);
      } else
        expect(
          screen.queryByRole("button", { name: "Action de simulation" }),
        ).toBeNull();
    },
  );

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
