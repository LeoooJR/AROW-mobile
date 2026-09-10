import { render, screen, userEvent } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/milestone";
import { Railway } from "@/features/railways/railway";

import Index from "@/app/index";

const mockMilestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});
const mockRailwayLine = new Railway({
  code: "893000",
  name: "Ligne test",
  sections: [
    {
      geometry: {
        endMilestone: "511+605",
        gaiaId: "railway-gaia-id",
        railwayType: "Ligne",
        startMilestone: "499+752",
        status: "present",
      },
      sectionRank: 1,
    },
  ],
});
const mockRailway = mockRailwayLine.sections[0];

jest.mock("expo-asset", () => ({
  useAssets: () => [[{ localUri: "file:///railways.geojson" }]],
}));

jest.mock("@/statics/lignes-par-type.geojson", () => "railway-asset");

jest.mock("@/hooks/platform/use-real-location", () => ({
  useRealLocation: () => ({
    openSettings: jest.fn(),
    requestAccess: jest.fn(),
    retry: jest.fn(),
    state: {
      position: { heading: null, latitude: 45.74491, longitude: 4.86234 },
      status: "connected",
    },
  }),
}));

jest.mock("@/features/milestones/railway-reference-context", () => ({
  useRailwayReference: () => ({
    milestoneSearch: {
      findMilestone: jest.fn(),
      state: { status: "unavailable" },
    },
    milestoneState: { milestones: [mockMilestone], status: "ready" },
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
      focusLocation,
      focusRequest,
      layerVisibility,
      onFeaturePress,
    }: {
      readonly focusLocation?: { latitude: number; longitude: number };
      readonly focusRequest?: number;
      readonly layerVisibility: { milestone: boolean; railway: boolean };
      readonly onFeaturePress: (feature: { readonly kind: string }) => void;
    }) => (
      <MockView
        testID="mock-map"
        {...{ focusLocation, focusRequest }}
        {...layerVisibility}
      >
        <MockPressable
          onPress={() => {
            onFeaturePress(mockRailway);
          }}
          role="button"
        >
          <MockText>Select railway</MockText>
        </MockPressable>
        <MockPressable
          onPress={() => {
            onFeaturePress(mockMilestone);
          }}
          role="button"
        >
          <MockText>Select milestone</MockText>
        </MockPressable>
      </MockView>
    ),
  };
});

jest.mock("@/components/composites/map-toolbar", () => {
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      onMilestoneSelect,
      onVisibilityChange,
    }: {
      readonly onMilestoneSelect: (milestone: Milestone) => void;
      readonly onVisibilityChange: (
        layer: "milestone" | "railway",
        visible: boolean,
      ) => void;
    }) => (
      <MockView>
        <MockPressable
          onPress={() => {
            onVisibilityChange("railway", false);
          }}
          role="button"
        >
          <MockText>Hide railway</MockText>
        </MockPressable>
        <MockPressable
          onPress={() => {
            onMilestoneSelect(mockMilestone);
          }}
          role="button"
        >
          <MockText>Use searched milestone</MockText>
        </MockPressable>
        <MockPressable
          onPress={() => {
            onVisibilityChange("milestone", false);
          }}
          role="button"
        >
          <MockText>Hide milestone</MockText>
        </MockPressable>
      </MockView>
    ),
  };
});

jest.mock("@/components/composites/map-feature-details-card", () => {
  const {
    Pressable: MockPressable,
    Text: MockText,
    View: MockView,
  } = jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      feature,
      onClose,
      showSimulationAction,
    }: {
      readonly feature: { readonly kind: string };
      readonly onClose: () => void;
      readonly showSimulationAction?: boolean;
    }) => (
      <MockView>
        <MockText testID="mock-details">{feature.kind}</MockText>
        {showSimulationAction ? (
          <MockText>Raised for simulation action</MockText>
        ) : null}
        <MockPressable onPress={onClose} role="button">
          <MockText>Close details</MockText>
        </MockPressable>
      </MockView>
    ),
  };
});

jest.mock("@/components/composites/location-bar", () => {
  const { Text: MockText, View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      showSimulationAction,
    }: {
      readonly showSimulationAction?: boolean;
    }) => (
      <MockView testID="mock-location-bar">
        {showSimulationAction ? <MockText>Simulation action</MockText> : null}
      </MockView>
    ),
  };
});

describe("map screen layer visibility", () => {
  test("starts with both optional layers visible", async () => {
    await render(<Index />);

    expect(screen.getByTestId("mock-map")).toHaveProp("railway", true);
    expect(screen.getByTestId("mock-map")).toHaveProp("milestone", true);
  });

  test("clears only a selection owned by the layer being hidden", async () => {
    const user = userEvent.setup();
    await render(<Index />);

    await user.press(screen.getByRole("button", { name: "Select railway" }));
    expect(screen.getByTestId("mock-details")).toHaveTextContent("railway");
    await user.press(screen.getByRole("button", { name: "Hide milestone" }));
    expect(screen.getByTestId("mock-details")).toHaveTextContent("railway");
    await user.press(screen.getByRole("button", { name: "Hide railway" }));
    expect(screen.queryByTestId("mock-details")).not.toBeOnTheScreen();
  });

  test("clears an open milestone card when milestones are hidden", async () => {
    const user = userEvent.setup();
    await render(<Index />);

    await user.press(screen.getByRole("button", { name: "Select milestone" }));
    expect(screen.getByTestId("mock-details")).toHaveTextContent("milestone");
    await user.press(screen.getByRole("button", { name: "Hide milestone" }));

    expect(screen.queryByTestId("mock-details")).not.toBeOnTheScreen();
  });

  test("restores, selects, and focuses a searched milestone", async () => {
    const user = userEvent.setup();
    await render(<Index />);

    await user.press(screen.getByRole("button", { name: "Hide milestone" }));
    expect(screen.getByTestId("mock-map")).toHaveProp("milestone", false);
    await user.press(
      screen.getByRole("button", { name: "Use searched milestone" }),
    );

    expect(screen.getByTestId("mock-map")).toHaveProp("milestone", true);
    expect(screen.getByTestId("mock-map")).toHaveProp(
      "focusLocation",
      mockMilestone.coordinates,
    );
    expect(screen.getByTestId("mock-map")).toHaveProp("focusRequest", 1);
    expect(screen.getByTestId("mock-details")).toHaveTextContent("milestone");
    expect(screen.getByText("Simulation action")).toBeOnTheScreen();
    expect(screen.getByText("Raised for simulation action")).toBeOnTheScreen();
  });

  test("shows the simulation action only while a searched result is selected", async () => {
    const user = userEvent.setup();
    await render(<Index />);

    await user.press(screen.getByRole("button", { name: "Select milestone" }));
    expect(screen.queryByText("Simulation action")).not.toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", { name: "Use searched milestone" }),
    );
    expect(screen.getByText("Simulation action")).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "Select railway" }));
    expect(screen.queryByText("Simulation action")).not.toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", { name: "Use searched milestone" }),
    );
    await user.press(screen.getByRole("button", { name: "Close details" }));
    expect(screen.queryByText("Simulation action")).not.toBeOnTheScreen();

    await user.press(
      screen.getByRole("button", { name: "Use searched milestone" }),
    );
    await user.press(screen.getByRole("button", { name: "Hide milestone" }));
    expect(screen.queryByText("Simulation action")).not.toBeOnTheScreen();
  });
});
