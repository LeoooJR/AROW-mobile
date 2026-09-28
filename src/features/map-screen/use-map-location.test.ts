import { act, renderHook } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { useMapLocation } from "@/features/map-screen/use-map-location";
import type { SimulationState } from "@/features/simulation/simulation-state";
import type { LocationState } from "@/hooks/platform/use-real-location";

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockRetry = jest.fn();
const mockRequestAccess = jest.fn();
const mockOpenSettings = jest.fn();
let mockSimulation: SimulationState = { status: "idle" };
let mockRealLocation: LocationState = { status: "permissionRequired" };

jest.mock("@/features/simulation/use-simulation", () => ({
  useSimulation: () => ({
    start: mockStart,
    state: mockSimulation,
    stop: mockStop,
  }),
}));
jest.mock("@/hooks/platform/use-real-location", () => ({
  useRealLocation: () => ({
    openSettings: mockOpenSettings,
    requestAccess: mockRequestAccess,
    retry: mockRetry,
    state: mockRealLocation,
  }),
}));

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});
const position = {
  accuracy: null,
  heading: null,
  latitude: 45.74744,
  longitude: 4.85933,
};

describe("useMapLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSimulation = { status: "idle" };
    mockRealLocation = { status: "permissionRequired" };
  });

  test("starts only a searched milestone and keeps stop after selection closes", async () => {
    const { result, rerender } = await renderHook(
      ({ selected }: { selected?: Milestone }) => useMapLocation(selected),
      { initialProps: { selected: milestone } },
    );
    await act(async () => result.current.onSimulationPress());
    expect(mockStart).toHaveBeenCalledWith(milestone);

    mockSimulation = { position, status: "running" };
    await rerender({ selected: undefined });
    expect(result.current.showSimulationAction).toBe(true);
    expect(result.current.currentLocation).toEqual(position);
    await act(async () => result.current.onSimulationPress());
    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  test("offers location permission action for simulation readiness failure", async () => {
    mockSimulation = {
      code: "LOCATION_PERMISSION_REQUIRED",
      mayBeActive: false,
      status: "error",
    };
    const { result } = await renderHook(() => useMapLocation());
    await act(async () => result.current.onLocationAction?.());
    expect(mockRequestAccess).toHaveBeenCalledTimes(1);
  });

  test.each([{ status: "canceling" }, { status: "stopping" }] as const)(
    "keeps the stop control visible without a selected card while %s",
    async (simulation) => {
      mockSimulation = simulation;
      const { result } = await renderHook(() => useMapLocation());
      expect(result.current.showSimulationAction).toBe(true);
      await act(async () => result.current.onSimulationPress());
      expect(mockStop).toHaveBeenCalledTimes(1);
      expect(mockStart).not.toHaveBeenCalled();
    },
  );

  test("refreshes real location once after a running simulation stops", async () => {
    mockSimulation = { position, status: "running" };
    const { result, rerender } = await renderHook(() => useMapLocation());
    mockSimulation = { status: "idle" };
    await rerender(undefined);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    await rerender(undefined);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    expect(result.current.showSimulationAction).toBe(false);
  });
});
