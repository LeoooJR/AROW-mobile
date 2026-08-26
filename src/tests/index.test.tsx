import { render, screen } from "@testing-library/react-native";

import { type MilestoneFeatureCollection } from "@/features/milestones/milestones";
import { useMilestones } from "@/features/milestones/use-milestones";
import { useRealLocation } from "@/hooks/platform/use-real-location";

import Index from "@/app/index";

jest.mock("@/features/milestones/use-milestones", () => ({
  useMilestones: jest.fn(),
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

const useMilestonesMock = jest.mocked(useMilestones);
const useRealLocationMock = jest.mocked(useRealLocation);
const MILESTONES: MilestoneFeatureCollection = {
  features: [],
  type: "FeatureCollection",
};

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
    useMilestonesMock.mockReturnValue({
      collection: MILESTONES,
      status: "ready",
    });

    await render(<Index />);

    expect(screen.getByTestId("mock-map")).toHaveProp("milestones", MILESTONES);
    expect(screen.getByTestId("mock-map")).toHaveProp(
      "location",
      expect.objectContaining({ latitude: 45.74, longitude: 4.86 }),
    );
  });

  test("keeps the base map available when milestone loading fails", async () => {
    useMilestonesMock.mockReturnValue({ status: "error" });

    await render(<Index />);

    expect(screen.getByTestId("mock-map")).not.toHaveProp("milestones");
    expect(screen.getByTestId("mock-map")).toBeOnTheScreen();
  });
});
