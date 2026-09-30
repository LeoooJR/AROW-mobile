import { act, renderHook } from "@testing-library/react-native";

import getLocationPresentation from "@/components/composites/location-bar/location-presentation";
import { Milestone } from "@/features/milestones/domain/milestone";
import { useMapLocation } from "@/features/map-screen/use-map-location";
import type { SimulationState } from "@/features/simulation/simulation-state";
import type { LocationState } from "@/hooks/platform/use-real-location";

const mockStart = jest.fn();
const mockStop = jest.fn();
const mockDismissStartError = jest.fn();
const mockRetry = jest.fn();
const mockRequestAccess = jest.fn();
const mockOpenSettings = jest.fn();
let mockSimulation: SimulationState = { status: "idle" };
let mockRealLocation: LocationState = { status: "permissionRequired" };

jest.mock("@/features/simulation/use-simulation", () => ({
  useSimulation: () => ({
    dismissStartError: mockDismissStartError,
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

  test.each([
    [{ status: "permissionRequired" }, mockRequestAccess],
    [{ status: "denied", canAskAgain: true }, mockRequestAccess],
    [{ status: "denied", canAskAgain: false }, mockOpenSettings],
    [{ status: "servicesDisabled" }, mockRetry],
    [{ status: "error" }, mockRetry],
  ] as const)(
    "uses the real-location action for %s when stopped or recovering simulation permission",
    async (realLocation, expectedAction) => {
      mockRealLocation = realLocation;
      const { result, rerender } = await renderHook(() => useMapLocation());
      await act(async () => result.current.onLocationAction?.());
      expect(expectedAction).toHaveBeenCalledTimes(1);

      mockSimulation = {
        code: "LOCATION_PERMISSION_REQUIRED",
        mayBeActive: false,
        origin: "reconciliation",
        status: "error",
      };
      await rerender(undefined);
      await act(async () => result.current.onLocationAction?.());
      expect(expectedAction).toHaveBeenCalledTimes(2);
      expect(
        [mockRequestAccess, mockOpenSettings, mockRetry].filter(
          (action) => action !== expectedAction && action.mock.calls.length > 0,
        ),
      ).toEqual([]);
    },
  );

  test("does not request permission while real-location permission is being checked", async () => {
    mockRealLocation = { status: "checking" };
    mockSimulation = {
      code: "LOCATION_PERMISSION_REQUIRED",
      mayBeActive: false,
      origin: "reconciliation",
      status: "error",
    };
    const { result } = await renderHook(() => useMapLocation());
    expect(result.current.onLocationAction).toBeUndefined();
  });

  test("does not offer recovery for unrelated simulation errors", async () => {
    mockSimulation = {
      code: "MOCK_PROVIDER_NOT_SELECTED",
      mayBeActive: false,
      origin: "reconciliation",
      status: "error",
    };
    const { result } = await renderHook(() => useMapLocation());
    expect(result.current.onLocationAction).toBeUndefined();
  });

  test.each([
    [{ status: "connected", position }, "Connectée"],
    [{ status: "locating", position }, "Connexion…"],
    [{ status: "permissionRequired" }, "Autorisation requise"],
  ] as const)(
    "returns to real-location %s immediately when the searched card closes",
    async (realLocation, expectedLabel) => {
      mockRealLocation = realLocation;
      const failedStart: SimulationState = {
        code: "MOCK_PROVIDER_NOT_SELECTED",
        mayBeActive: false,
        origin: "start",
        status: "error",
      };
      mockSimulation = failedStart;
      const { result, rerender } = await renderHook(
        ({ selected }: { selected?: Milestone }) => useMapLocation(selected),
        { initialProps: { selected: milestone } },
      );
      expect(result.current.simulation).toBe(failedStart);
      expect(result.current.showSimulationAction).toBe(true);

      await rerender({ selected: undefined });
      expect(result.current.simulation.status).toBe("idle");
      expect(
        getLocationPresentation(result.current.state, result.current.simulation)
          .stateLabel,
      ).toBe(expectedLabel);
      expect(result.current.showSimulationAction).toBe(false);
      expect(mockDismissStartError).toHaveBeenCalledWith(failedStart);
      expect(result.current.onLocationAction).toBe(
        realLocation.status === "permissionRequired"
          ? mockRequestAccess
          : undefined,
      );
    },
  );

  test("does not dismiss cleanup errors when the card closes", async () => {
    mockSimulation = {
      code: "CLEANUP_FAILED",
      mayBeActive: false,
      origin: "cleanup",
      status: "error",
    };
    const { result } = await renderHook(() => useMapLocation());
    expect(result.current.showSimulationAction).toBe(true);
    expect(result.current.simulation.status).toBe("error");
    expect(mockDismissStartError).not.toHaveBeenCalled();
    await act(async () => result.current.onSimulationPress());
    expect(mockStop).toHaveBeenCalledTimes(1);
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
