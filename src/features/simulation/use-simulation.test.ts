import { act, renderHook, waitFor } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { getMockLocationExecutor } from "@/features/simulation/mock-location";
import { useSimulation } from "@/features/simulation/use-simulation";

jest.mock("@/features/simulation/mock-location", () => ({
  getMockLocationExecutor: jest.fn(),
}));

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});

const executor = {
  checkReadiness: jest.fn(),
  getSnapshot: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

describe("useSimulation", () => {
  beforeEach(() => {
    process.env.EXPO_OS = "android";
    jest.clearAllMocks();
    jest.mocked(getMockLocationExecutor).mockResolvedValue(executor);
    executor.checkReadiness.mockResolvedValue({ ready: true });
    executor.getSnapshot.mockResolvedValue({ status: "stopped" });
    executor.start.mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    executor.stop.mockResolvedValue({ status: "stopped" });
  });

  test.each([
    "MOCK_PROVIDER_NOT_SELECTED",
    "LOCATION_SERVICES_DISABLED",
    "LOCATION_PERMISSION_REQUIRED",
  ])("rejects %s before looking up the milestone", async (code) => {
    executor.checkReadiness.mockResolvedValue({
      code,
      ready: false,
    });
    const findMilestone = jest.fn();
    const { result } = await renderHook(() => useSimulation(findMilestone));

    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({
      code,
    });
    expect(findMilestone).not.toHaveBeenCalled();
    expect(executor.start).not.toHaveBeenCalled();
  });

  test("does not apply a missing milestone", async () => {
    const findMilestone = jest.fn().mockResolvedValue(undefined);
    const { result } = await renderHook(() => useSimulation(findMilestone));

    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(findMilestone).toHaveBeenCalledWith({
      lineCode: "893000",
      positionMeters: 509_000,
      sectionRank: 1,
    });
    expect(executor.start).not.toHaveBeenCalled();
  });

  test("applies a resolved milestone once and cleans up on stop", async () => {
    const findMilestone = jest.fn().mockResolvedValue(milestone);
    const { result } = await renderHook(() => useSimulation(findMilestone));

    await act(async () => {
      result.current.start(milestone);
      result.current.start(milestone);
    });
    await waitFor(() => expect(result.current.state.status).toBe("running"));
    expect(executor.start).toHaveBeenCalledTimes(1);
    expect(executor.start).toHaveBeenCalledWith(45.74744, 4.85933);

    await act(async () => result.current.stop());
    await waitFor(() => expect(result.current.state.status).toBe("idle"));
    expect(executor.stop).toHaveBeenCalledTimes(1);
  });

  test("stops a native start that completes after cancellation", async () => {
    let completeStart!: (value: unknown) => void;
    executor.start.mockImplementation(
      () =>
        new Promise((resolve) => {
          completeStart = resolve;
        }),
    );
    const { result } = await renderHook(() =>
      useSimulation(jest.fn().mockResolvedValue(milestone)),
    );

    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("starting"));
    await act(async () => result.current.stop());
    expect(result.current.state.status).toBe("starting");
    completeStart({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.state.status).toBe("idle"));
  });

  test("restores the applied position from the native snapshot", async () => {
    executor.getSnapshot.mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    const { result } = await renderHook(() => useSimulation(jest.fn()));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalled());
    await waitFor(() => expect(result.current.state.status).toBe("running"));
  });

  test("keeps an actionable error if native cleanup fails", async () => {
    executor.stop.mockResolvedValue({
      code: "CLEANUP_FAILED",
      status: "error",
    });
    const { result } = await renderHook(() =>
      useSimulation(jest.fn().mockResolvedValue(milestone)),
    );
    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("running"));
    await act(async () => result.current.stop());
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({
      mayBeActive: true,
      code: "CLEANUP_FAILED",
    });
  });
});
