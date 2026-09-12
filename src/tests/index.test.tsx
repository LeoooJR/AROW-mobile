import { render, screen } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/milestone";
import { useRailwayReference } from "@/features/milestones/railway-reference-context";
import { useRealLocation } from "@/hooks/platform/use-real-location";

import Index from "@/app/index";

jest.mock("@/features/milestones/railway-reference-context", () => ({
  useRailwayReference: jest.fn(),
}));

jest.mock("@/hooks/platform/use-real-location", () => ({
  useRealLocation: jest.fn(),
}));

jest.mock("@/components/adapters/map/map", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-map" />
    ),
  };
});

jest.mock("@/components/composites/location-bar", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-location-bar" />
    ),
  };
});

jest.mock("@/components/composites/map-toolbar", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-map-toolbar" />
    ),
  };
});

const useRailwayReferenceMock = jest.mocked(useRailwayReference);
const useRealLocationMock = jest.mocked(useRealLocation);
const MILESTONES = [] satisfies readonly Milestone[];

describe("Index", () => {
  beforeEach(() => {
    useRealLocationMock.mockReturnValue({
      openSettings: jest.fn(),
      requestAccess: jest.fn(),
      retry: jest.fn(),
      state: {
        position: {
          accuracy: 3,
          heading: 90,
          latitude: 45.74,
          longitude: 4.86,
        },
        status: "connected",
      },
    });
  });

  test("passes ready milestone and location data to the map", async () => {
    useRailwayReferenceMock.mockReturnValue({
      milestoneSearch: {
        findMilestone: jest.fn(),
        state: { status: "unavailable" },
      },
      milestoneState: { milestones: MILESTONES, status: "ready" },
    });

    await render(<Index />);

    expect(screen.getByTestId("mock-map")).toHaveProp("milestones", MILESTONES);
    expect(screen.getByTestId("mock-map")).toHaveProp(
      "location",
      expect.objectContaining({ latitude: 45.74, longitude: 4.86 }),
    );
  });

  test("keeps the base map available when milestone loading fails", async () => {
    useRailwayReferenceMock.mockReturnValue({
      milestoneSearch: {
        findMilestone: jest.fn(),
        state: { status: "unavailable" },
      },
      milestoneState: { status: "error" },
    });

    await render(<Index />);

    expect(screen.getByTestId("mock-map")).not.toHaveProp("milestones");
    expect(screen.getByTestId("mock-map")).toBeOnTheScreen();
  });
});
