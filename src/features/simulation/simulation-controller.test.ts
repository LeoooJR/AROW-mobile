import { waitFor } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { SimulationController } from "@/features/simulation/simulation-controller";
import { NativeContractError } from "../../../modules/arow-mock-location/src/decode-native-result";

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function setup() {
  const executor = {
    prepareNotifications: jest
      .fn()
      .mockResolvedValue({ status: "ready", notificationVisible: true }),
    checkReadiness: jest.fn().mockResolvedValue({ ready: true }),
    getSnapshot: jest.fn().mockResolvedValue({ status: "stopped" }),
    start: jest.fn().mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    }),
    stop: jest.fn().mockResolvedValue({ status: "stopped" }),
  };
  const onNotificationUnavailable = jest.fn();
  const controller = new SimulationController(
    async () => executor,
    onNotificationUnavailable,
  );
  const onState = jest.fn();
  const unsubscribe = controller.subscribe(onState);
  return {
    controller,
    executor,
    onState,
    unsubscribe,
    onNotificationUnavailable,
  };
}

describe("SimulationController", () => {
  test("denial continues automatically and warns once after successful startup", async () => {
    const { controller, executor, onNotificationUnavailable } = setup();
    executor.prepareNotifications.mockResolvedValue({
      status: "ready",
      notificationVisible: false,
    });
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    expect(onNotificationUnavailable).toHaveBeenCalledTimes(1);
    executor.getSnapshot.mockResolvedValue({
      status: "running",
      ...milestone.coordinates,
    });
    await controller.reconcile();
    controller.start(milestone);
    expect(onNotificationUnavailable).toHaveBeenCalledTimes(1);
    controller.stop();
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    controller.start(milestone);
    await waitFor(() =>
      expect(onNotificationUnavailable).toHaveBeenCalledTimes(2),
    );
  });

  test("readiness failure never prepares notifications", async () => {
    const { controller, executor, onNotificationUnavailable } = setup();
    executor.checkReadiness.mockResolvedValue({
      ready: false,
      code: "MOCK_PROVIDER_NOT_SELECTED",
    });
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("error"));
    expect(executor.prepareNotifications).not.toHaveBeenCalled();
    expect(onNotificationUnavailable).not.toHaveBeenCalled();
  });

  test.each([false, true])(
    "Stop prevents a late start during preparation (superseded: %s)",
    async (supersede) => {
      const { controller, executor, onNotificationUnavailable } = setup();
      const pending = deferred<{
        status: "ready";
        notificationVisible: boolean;
      }>();
      executor.prepareNotifications.mockReturnValueOnce(pending.promise);
      controller.start(milestone);
      await waitFor(() =>
        expect(executor.prepareNotifications).toHaveBeenCalledTimes(1),
      );
      expect(controller.state.status).toBe("checking");
      controller.stop();
      if (supersede) {
        controller.start(milestone);
        await waitFor(() => expect(controller.state.status).toBe("running"));
      }
      pending.resolve({ status: "ready", notificationVisible: false });
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(executor.start).toHaveBeenCalledTimes(supersede ? 1 : 0);
      expect(onNotificationUnavailable).not.toHaveBeenCalled();
    },
  );

  test("cancelled preparation returns to idle without starting", async () => {
    const { controller, executor } = setup();
    executor.prepareNotifications.mockResolvedValue({ status: "cancelled" });
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(executor.start).not.toHaveBeenCalled();
  });

  test("preparation failure is an inactive start error", async () => {
    const { controller, executor, onNotificationUnavailable } = setup();
    executor.prepareNotifications.mockRejectedValue(
      new Error("request failed"),
    );
    controller.start(milestone);
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        status: "error",
        mayBeActive: false,
        origin: "start",
      }),
    );
    expect(executor.start).not.toHaveBeenCalled();
    expect(onNotificationUnavailable).not.toHaveBeenCalled();
  });
  test("uses the selected milestone after readiness and waits for the first fix", async () => {
    const { controller, executor } = setup();
    const readiness = deferred<{ ready: true }>();
    const firstFix = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    executor.checkReadiness.mockReturnValue(readiness.promise);
    executor.start.mockReturnValue(firstFix.promise);

    controller.start(milestone);
    expect(controller.state.status).toBe("checking");
    expect(executor.start).not.toHaveBeenCalled();

    readiness.resolve({ ready: true });
    await waitFor(() =>
      expect(executor.start).toHaveBeenCalledWith(45.74744, 4.85933),
    );
    expect(controller.state.status).toBe("starting");

    firstFix.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await waitFor(() => expect(controller.state.status).toBe("running"));
  });

  test("exposes malformed initial reconciliation as uncertain active state", async () => {
    const { controller, executor } = setup();
    executor.getSnapshot.mockRejectedValue(new NativeContractError("snapshot"));
    await controller.reconcile();
    expect(controller.state).toEqual({
      status: "error",
      code: "SIMULATION_UNAVAILABLE",
      mayBeActive: true,
      origin: "reconciliation",
    });
  });

  test.each([true, false])(
    "uses reported ownership %s rather than the error code",
    async (ownsProviders) => {
      const { controller, executor } = setup();
      executor.start.mockResolvedValue({
        status: "error",
        code: "APPLY_FAILED",
        ownsProviders,
      });
      controller.start(milestone);
      await waitFor(() =>
        expect(controller.state).toMatchObject({
          status: "error",
          code: "APPLY_FAILED",
          mayBeActive: ownsProviders,
        }),
      );
      executor.getSnapshot.mockResolvedValue({
        status: "error",
        code: "CLEANUP_FAILED",
        ownsProviders,
      });
      await controller.reconcile();
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: ownsProviders,
      });
    },
  );

  test("retains the previously applied position when reconciliation reports cleanup failure", async () => {
    const { controller, executor } = setup();
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    executor.getSnapshot.mockResolvedValue({
      status: "error",
      code: "CLEANUP_FAILED",
      ownsProviders: true,
    });
    await controller.reconcile();
    expect(controller.state).toMatchObject({
      status: "error",
      mayBeActive: true,
      position: milestone.coordinates,
    });
  });

  test("does not report a native interrupted start as running", async () => {
    const { controller, executor } = setup();
    executor.start.mockResolvedValue({ status: "stopped" });
    controller.start(milestone);
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        status: "error",
        code: "APPLY_FAILED",
        mayBeActive: false,
      }),
    );
  });

  test("keeps rejected start and stop results conservative", async () => {
    const { controller, executor } = setup();
    executor.start.mockRejectedValue(new NativeContractError("start"));
    controller.start(milestone);
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        status: "error",
        mayBeActive: true,
      }),
    );
    executor.stop.mockRejectedValue(new NativeContractError("stop"));
    controller.stop();
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: true,
      }),
    );
  });

  test("cancels pending readiness before native start", async () => {
    const { controller, executor } = setup();
    const readiness = deferred<{ ready: true }>();
    executor.checkReadiness.mockReturnValue(readiness.promise);

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("checking"));
    controller.stop();
    readiness.resolve({ ready: true });

    expect(controller.state.status).toBe("idle");
    await Promise.resolve();
    expect(executor.start).not.toHaveBeenCalled();
  });

  test("waits for a canceled native start to finish cleanup", async () => {
    const { controller, executor, onState } = setup();
    const start = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    const stop = deferred<{ status: "stopped" }>();
    executor.start.mockReturnValue(start.promise);
    executor.stop.mockReturnValue(stop.promise);

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    expect(controller.state.status).toBe("canceling");
    controller.stop();
    controller.start(milestone);
    expect(executor.start).toHaveBeenCalledTimes(1);
    start.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
    expect(controller.state.status).toBe("stopping");
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(onState).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running" }),
    );
  });

  test("keeps canceled-start cleanup failure actionable", async () => {
    const { controller, executor } = setup();
    const start = deferred<{
      status: "running";
      latitude: number;
      longitude: number;
    }>();
    executor.start.mockReturnValue(start.promise);
    executor.stop.mockResolvedValue({
      code: "CLEANUP_FAILED",
      ownsProviders: true,
      status: "error",
    });

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    start.resolve({ status: "running", latitude: 1, longitude: 2 });
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: true,
        status: "error",
      }),
    );
  });

  test("cleans up a rejected start after cancellation without reporting running", async () => {
    const { controller, executor, onState } = setup();
    let rejectStart!: (reason: Error) => void;
    executor.start.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectStart = reject;
      }),
    );

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    rejectStart(new Error("start failed"));

    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(executor.stop).toHaveBeenCalledTimes(1);
    expect(onState).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running" }),
    );
  });

  test("shows stopping without a position when retrying an uncertain cleanup", async () => {
    const { controller, executor } = setup();
    const stop = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockRejectedValue(new NativeContractError("snapshot"));
    executor.stop.mockReturnValue(stop.promise);
    await controller.reconcile();

    controller.stop();
    expect(controller.state).toEqual({
      status: "stopping",
      position: undefined,
    });
    controller.stop();
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
  });

  test("runs one cleanup at a time and allows retry after failure", async () => {
    const { controller, executor } = setup();
    const firstStop = deferred<{
      code: "CLEANUP_FAILED";
      ownsProviders: boolean;
      status: "error";
    }>();
    executor.stop
      .mockReturnValueOnce(firstStop.promise)
      .mockResolvedValueOnce({ status: "stopped" });

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    controller.stop();
    controller.stop();
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));

    firstStop.resolve({
      code: "CLEANUP_FAILED",
      ownsProviders: true,
      status: "error",
    });
    await waitFor(() => expect(controller.state.status).toBe("error"));
    controller.stop();
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(executor.stop).toHaveBeenCalledTimes(2);
  });

  test("discards a snapshot read before a newer start", async () => {
    const { controller, executor } = setup();
    const snapshot = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    const reconciliation = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    snapshot.resolve({ status: "stopped" });
    await reconciliation;
    expect(controller.state.status).toBe("running");
  });

  test("dismisses only the same inactive failed start and rejects a late snapshot", async () => {
    const { controller, executor } = setup();
    const snapshot = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    const reconciliation = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    executor.checkReadiness.mockResolvedValue({
      ready: false,
      code: "MOCK_PROVIDER_NOT_SELECTED",
    });
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("error"));
    const firstError = controller.state;
    controller.dismissStartError(firstError);
    expect(controller.state.status).toBe("idle");
    snapshot.resolve({ status: "stopped" });
    await reconciliation;
    expect(controller.state.status).toBe("idle");

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("error"));
    controller.dismissStartError(firstError);
    expect(controller.state.status).toBe("error");
  });

  test("does not dismiss cleanup or uncertain active errors", async () => {
    const { controller, executor } = setup();
    executor.getSnapshot.mockRejectedValue(new NativeContractError("snapshot"));
    await controller.reconcile();
    const reconciliationError = controller.state;
    controller.dismissStartError(reconciliationError);
    expect(controller.state).toBe(reconciliationError);

    executor.stop.mockResolvedValue({
      status: "error",
      code: "CLEANUP_FAILED",
      ownsProviders: false,
    });
    controller.stop();
    await waitFor(() => expect(controller.state.status).toBe("error"));
    const cleanupError = controller.state;
    controller.dismissStartError(cleanupError);
    expect(controller.state).toBe(cleanupError);
  });

  test("does not let a late running snapshot overwrite cleanup", async () => {
    const { controller, executor } = setup();
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    const snapshot = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    const stop = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    executor.stop.mockReturnValue(stop.promise);
    const reconciliation = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));

    controller.stop();
    snapshot.resolve({ latitude: 1, longitude: 2, status: "running" });
    await reconciliation;
    expect(controller.state.status).toBe("stopping");
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
  });

  test("does not publish after unsubscribe, then reconciles on a new subscription", async () => {
    const { controller, executor, onState, unsubscribe } = setup();
    const snapshot = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    const pending = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    unsubscribe();
    snapshot.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await pending;
    expect(onState).toHaveBeenCalledTimes(1);

    executor.getSnapshot.mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    const newListener = jest.fn();
    controller.subscribe(newListener);
    await controller.reconcile();
    expect(newListener).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "running" }),
    );
  });

  test("finishes native cleanup without notifying an unmounted listener", async () => {
    const { controller, executor, onState, unsubscribe } = setup();
    const stop = deferred<{ status: "stopped" }>();
    executor.stop.mockReturnValue(stop.promise);
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    controller.stop();
    expect(controller.state.status).toBe("stopping");

    unsubscribe();
    const notifications = onState.mock.calls.length;
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(onState).toHaveBeenCalledTimes(notifications);
  });
});
