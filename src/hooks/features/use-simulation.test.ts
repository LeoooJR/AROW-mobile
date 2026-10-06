import { act, renderHook, waitFor } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { getMockLocationExecutor } from "@/features/simulation/mock-location";
import { prepareSimulationNotifications } from "@/features/simulation/simulation-notifications";

import SimulationProvider from "@/features/simulation/simulation-provider";
import { useSimulation } from "@/hooks/features/use-simulation";

jest.mock("@/features/simulation/simulation-notifications", () => ({
  prepareSimulationNotifications: jest.fn(),
}));

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

function renderSimulationHook() {
  return renderHook(() => useSimulation(), { wrapper: SimulationProvider });
}

describe("useSimulation", () => {
  test("notification preparation follows first-fix confirmation and never blocks Stop", async () => {
    let firstFix!: (value: {
      status: "running";
      latitude: number;
      longitude: number;
    }) => void;
    executor.start.mockReturnValueOnce(
      new Promise((resolve) => {
        firstFix = resolve;
      }),
    );
    let finishNotifications!: (value: { notificationVisible: boolean }) => void;
    jest.mocked(prepareSimulationNotifications).mockReturnValueOnce(
      new Promise((resolve) => {
        finishNotifications = resolve;
      }),
    );
    const { result } = await renderSimulationHook();
    await act(async () => result.current.start(milestone));
    expect(result.current.state.status).toBe("starting");
    expect(prepareSimulationNotifications).not.toHaveBeenCalled();
    await act(async () =>
      firstFix({ status: "running", ...milestone.coordinates }),
    );
    expect(result.current.state.status).toBe("running");
    expect(prepareSimulationNotifications).toHaveBeenCalledTimes(1);
    const [isCurrent] = jest.mocked(prepareSimulationNotifications).mock
      .calls[0];
    expect(isCurrent()).toBe(true);
    await act(async () => result.current.stop());
    expect(result.current.state.status).toBe("idle");
    expect(isCurrent()).toBe(false);
    await act(async () => finishNotifications({ notificationVisible: false }));
    expect(result.current.notificationWarningId).toBe(0);
  });

  test("notification exceptions warn without changing the running simulation", async () => {
    jest
      .mocked(prepareSimulationNotifications)
      .mockRejectedValueOnce(new Error("permission unavailable"));
    const { result } = await renderSimulationHook();
    await act(async () => result.current.start(milestone));
    expect(result.current.state.status).toBe("running");
    expect(result.current.notificationWarningId).toBe(1);
  });

  test.each(["superseded", "unmounted", "ignored"] as const)(
    "discards stale results but preserves ignored starts (%s)",
    async (action) => {
      let finish!: (value: { notificationVisible: boolean }) => void;
      jest.mocked(prepareSimulationNotifications).mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const view = await renderSimulationHook();
      await act(async () => view.result.current.start(milestone));
      const [isCurrent] = jest.mocked(prepareSimulationNotifications).mock
        .calls[0];
      if (action === "superseded") {
        await act(async () => view.result.current.stop());
        await act(async () => view.result.current.start(milestone));
      } else if (action === "unmounted") {
        await view.unmount();
      } else {
        await act(async () => view.result.current.start(milestone));
        expect(prepareSimulationNotifications).toHaveBeenCalledTimes(1);
      }
      expect(isCurrent()).toBe(action === "ignored");
      await act(async () => finish({ notificationVisible: false }));
      expect(view.result.current.notificationWarningId).toBe(
        action === "ignored" ? 1 : 0,
      );
    },
  );

  test("native startup errors never prepare notifications", async () => {
    executor.start.mockResolvedValueOnce({
      status: "error",
      code: "START_FAILED",
      ownsProviders: false,
    });
    const { result } = await renderSimulationHook();
    await act(async () => result.current.start(milestone));
    expect(result.current.state.status).toBe("error");
    expect(prepareSimulationNotifications).not.toHaveBeenCalled();
  });

  test("keeps warning events outside reconciled state and increments only on new hidden starts", async () => {
    jest.mocked(prepareSimulationNotifications).mockResolvedValue({
      notificationVisible: false,
    });
    const { result } = await renderSimulationHook();
    expect(result.current.notificationWarningId).toBe(0);
    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.notificationWarningId).toBe(1));
    await act(async () => result.current.stop());
    expect(result.current.notificationWarningId).toBe(1);
    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.notificationWarningId).toBe(2));
  });
  beforeEach(() => {
    process.env.EXPO_OS = "android";
    jest.clearAllMocks();
    jest.mocked(getMockLocationExecutor).mockResolvedValue(executor);
    executor.checkReadiness.mockResolvedValue({ ready: true });
    jest.mocked(prepareSimulationNotifications).mockResolvedValue({
      notificationVisible: true,
    });
    executor.getSnapshot.mockResolvedValue({ status: "stopped" });
    executor.start.mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    executor.stop.mockResolvedValue({ status: "stopped" });
  });

  test("requires the application simulation provider", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(renderHook(() => useSimulation())).rejects.toThrow(
      "useSimulation must be used within SimulationProvider",
    );
    error.mockRestore();
  });

  test.each([
    "MOCK_PROVIDER_NOT_SELECTED",
    "LOCATION_SERVICES_DISABLED",
    "LOCATION_PERMISSION_REQUIRED",
  ])("rejects %s before native start", async (code) => {
    executor.checkReadiness.mockResolvedValue({
      code,
      ready: false,
    });
    const { result } = await renderSimulationHook();

    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({
      code,
    });
    expect(executor.start).not.toHaveBeenCalled();
    expect(prepareSimulationNotifications).not.toHaveBeenCalled();
  });

  test("applies the selected milestone once and cleans up on stop", async () => {
    const { result } = await renderSimulationHook();

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
    expect(jest.mocked(prepareSimulationNotifications)).toHaveBeenCalledTimes(
      1,
    );
  });

  test("stops a native start that completes after cancellation", async () => {
    let completeStart!: (value: unknown) => void;
    executor.start.mockImplementation(
      () =>
        new Promise((resolve) => {
          completeStart = resolve;
        }),
    );
    const { result } = await renderSimulationHook();

    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("starting"));
    await act(async () => result.current.stop());
    expect(result.current.state.status).toBe("canceling");
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
    const { result } = await renderSimulationHook();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalled());
    await waitFor(() => expect(result.current.state.status).toBe("running"));
  });

  test("keeps an actionable error if native cleanup fails", async () => {
    executor.stop.mockResolvedValue({
      code: "CLEANUP_FAILED",
      ownsProviders: true,
      status: "error",
    });
    const { result } = await renderSimulationHook();
    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("running"));
    await act(async () => result.current.stop());
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({
      mayBeActive: true,
      code: "CLEANUP_FAILED",
    });
  });

  test("continues pending native cleanup after the hook unmounts", async () => {
    let completeStop!: (value: { status: "stopped" }) => void;
    executor.stop.mockReturnValue(
      new Promise((resolve) => {
        completeStop = resolve;
      }),
    );
    const { result, unmount } = await renderSimulationHook();
    await act(async () => result.current.start(milestone));
    await waitFor(() => expect(result.current.state.status).toBe("running"));
    await act(async () => result.current.stop());
    expect(result.current.state.status).toBe("stopping");
    await unmount();
    completeStop({ status: "stopped" });
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
  });
});
