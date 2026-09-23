import { render, screen } from "@testing-library/react-native";

import { useRailwayReference } from "@/features/railway-reference/context";
import { useRealLocation } from "@/hooks/platform/use-real-location";

import Index from "@/app/index";

jest.mock("expo-asset", () => ({
  useAssets: () => [
    [
      { localUri: "file:///railways.geojson" },
      { localUri: "file:///milestones.geojson" },
    ],
  ],
}));
jest.mock("@/features/railway-reference/context", () => ({
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
  return { __esModule: true, default: () => <MockView /> };
});
jest.mock("@/components/composites/map-toolbar", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");
  return { __esModule: true, default: () => <MockView /> };
});

const useRailwayReferenceMock = jest.mocked(useRailwayReference);
const useRealLocationMock = jest.mocked(useRealLocation);

describe("Index", () => {
  beforeEach(() => {
    useRailwayReferenceMock.mockReturnValue({
      milestoneSearch: {
        findMilestone: jest.fn(),
        loadRailways: jest.fn(),
        state: { status: "idle" },
      },
    });
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

  test("passes generated asset URIs and location data to the map", async () => {
    await render(<Index />);

    expect(screen.getByTestId("mock-map")).toHaveProp(
      "railwayData",
      "file:///railways.geojson",
    );
    expect(screen.getByTestId("mock-map")).toHaveProp(
      "milestoneData",
      "file:///milestones.geojson",
    );
    expect(screen.getByTestId("mock-map")).toHaveProp(
      "location",
      expect.objectContaining({ latitude: 45.74, longitude: 4.86 }),
    );
  });
});
